import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { loadTestCredentials } from '../../../testing/test-credentials';
import { firebase } from '../firebase/firebase';
import { COMPLETIONS, MACHINES } from './class-progress';
import { classProgress, completionId, LevelCompletion } from './class-progress-state';
import { SESSIONS } from './live-session';

/**
 * Presenca e conclusoes no projeto Firebase real, com o usuario de teste.
 * Usa maquinas com id proprio e apaga o que gravou no fim. Sem
 * `test-credentials.json`, a suite e pulada.
 */
describe('ClassProgress — Firestore real', () => {
  const TIMEOUT = 20_000;
  const run = `teste-${Date.now()}`;
  const machines = [`${run}-a`, `${run}-b`];
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
    const { db } = firebase();
    await Promise.all([
      ...machines.map((m) => deleteDoc(doc(db, SESSIONS, uid!, MACHINES, m))),
      ...machines.map((m) => deleteDoc(doc(db, SESSIONS, uid!, COMPLETIONS, completionId(m, 1)))),
    ]);
    await signOut(firebase().auth);
  }, TIMEOUT);

  beforeEach(() => {
    if (!uid) pending('test-credentials.json ausente: integracao com o Firestore pulada');
  });

  it(
    'a escuta do apresentador recebe presenca e conclusao gravadas pelo aluno',
    async () => {
      const { db } = firebase();
      const startedAt = Date.now();
      const since = (name: string) =>
        query(collection(db, SESSIONS, uid!, name), where('at', '>=', startedAt));

      await Promise.all(
        machines.map((m) => setDoc(doc(db, SESSIONS, uid!, MACHINES, m), { at: startedAt + 1 })),
      );

      const completed = new Promise<LevelCompletion[]>((resolve, reject) => {
        const stop = onSnapshot(
          since(COMPLETIONS),
          { includeMetadataChanges: true },
          (snapshot) => {
            // Espera o servidor confirmar: o primeiro evento e a escrita local.
            if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
            const mine = snapshot.docs
              .map((d) => d.data() as LevelCompletion)
              .filter((c) => machines.includes(c.machine));
            if (mine.length === 0) return;
            stop();
            resolve(mine);
          },
          reject,
        );
      });

      const completion: LevelCompletion = { levelId: 1, machine: machines[0], at: startedAt + 2 };
      await setDoc(
        doc(db, SESSIONS, uid!, COMPLETIONS, completionId(machines[0], 1)),
        completion,
      );

      const completions = await completed;
      const present = (await getDocs(since(MACHINES))).docs
        .filter((d) => machines.includes(d.id))
        .map((d) => ({ machine: d.id, at: d.get('at') as number }));

      expect(classProgress(present, completions, 1, startedAt)).toEqual({
        done: 1,
        total: 2,
        ratio: 0.5,
        complete: false,
      });
    },
    TIMEOUT,
  );
});
