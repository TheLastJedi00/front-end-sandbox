import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { loadTestCredentials } from '../../../testing/test-credentials';
import { firebase } from '../firebase/firebase';
import { SESSIONS, sessionRef, SessionSnapshot, watchSession, writeSession } from './live-session';
import { startTimer } from './phase-timer';

/**
 * Integracao com o projeto Firebase real (sem emulador), usando o usuario de
 * teste de `test-credentials.json`. Sem o arquivo, a suite inteira e pulada.
 */
describe('LiveSession — Firestore real', () => {
  const TIMEOUT = 20_000;
  let uid: string | null = null;

  beforeAll(async () => {
    const credentials = await loadTestCredentials();
    if (!credentials) return;

    const { user } = await signInWithEmailAndPassword(
      firebase().auth,
      credentials.email,
      credentials.password,
    );
    uid = user.uid;
  }, TIMEOUT);

  afterAll(async () => {
    if (!uid) return;
    await deleteDoc(sessionRef(firebase().db, uid));
    await signOut(firebase().auth);
  }, TIMEOUT);

  beforeEach(() => {
    if (!uid) pending('test-credentials.json ausente: integracao com o Firestore pulada');
  });

  it(
    'grava e le de volta a sessao do proprio usuario',
    async () => {
      const { db } = firebase();
      await writeSession(db, uid!, { stage: 'fase', levelId: 2, deck: { slide: 1, step: 0 } });

      const saved = await getDoc(sessionRef(db, uid!));
      expect(saved.exists()).toBeTrue();
      expect(saved.get('stage')).toBe('fase');
      expect(saved.get('levelId')).toBe(2);
      expect(saved.get('updatedAt')).toBeDefined();
    },
    TIMEOUT,
  );

  it(
    'onSnapshot recebe, vinda do servidor, a mudanca gravada',
    async () => {
      const { db } = firebase();
      const timer = startTimer(Date.now());

      const received = new Promise<SessionSnapshot>((resolve, reject) => {
        const stop = watchSession(
          db,
          uid!,
          (snapshot) => {
            // Espera o servidor confirmar: o primeiro evento e a escrita local.
            if (snapshot.pending || snapshot.fromCache) return;
            if (snapshot.state.stage !== 'fim') return;
            stop();
            resolve(snapshot);
          },
          reject,
        );
      });

      await writeSession(db, uid!, { stage: 'fim', timer });
      const snapshot = await received;

      expect(snapshot.exists).toBeTrue();
      expect(snapshot.state.stage).toBe('fim');
      expect(snapshot.state.timer).toEqual(timer);
    },
    TIMEOUT,
  );

  it(
    'as regras negam a sessao de outro usuario',
    async () => {
      const other = doc(firebase().db, SESSIONS, 'outro-professor');
      await expectAsync(getDoc(other)).toBeRejectedWith(
        jasmine.objectContaining({ code: 'permission-denied' }),
      );
    },
    TIMEOUT,
  );
});
