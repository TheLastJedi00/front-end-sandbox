import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { AuthStore } from '../auth/auth-store';
import { firebase } from '../firebase/firebase';
import { injectIsBrowser } from '../platform/browser';
import {
  classProgress,
  ClassProgress,
  completionId,
  LevelCompletion,
  MachinePresence,
} from './class-progress-state';
import { LiveSession, SESSIONS } from './live-session';
import { machineId } from './machine-id';
import { RoleStore } from './role-store';

export const MACHINES = 'maquinas';
export const COMPLETIONS = 'conclusoes';

/**
 * Quantos alunos ja terminaram a missao da fase. A maquina do aluno grava que
 * esta na aula e que concluiu cada fase; a do apresentador escuta e conta.
 */
@Injectable({ providedIn: 'root' })
export class ClassProgressService {
  private readonly auth = inject(AuthStore);
  private readonly roles = inject(RoleStore);
  private readonly session = inject(LiveSession);
  private readonly isBrowser = injectIsBrowser();

  /** O comeco da aula atual, quando a sessao ja existe no servidor. */
  private readonly startedAt = computed(() =>
    this.session.exists() ? (this.session.state()?.startedAt ?? null) : null,
  );

  /** Fases ja avisadas nesta aula: cada uma vira uma gravacao so. */
  private reported = new Set<string>();

  private readonly machines = signal<readonly MachinePresence[]>([]);
  private readonly completions = signal<readonly LevelCompletion[]>([]);

  /** Apresentador: a turma na fase em que a aula esta agora. */
  readonly current = computed<ClassProgress | null>(() => {
    const state = this.session.state();
    const startedAt = this.startedAt();
    if (!state || state.stage !== 'fase' || startedAt === null) return null;
    return classProgress(this.machines(), this.completions(), state.levelId, startedAt);
  });

  constructor() {
    if (!this.isBrowser) return;

    // So o apresentador escuta, e so o desta aula: reiniciar troca a escuta e a
    // contagem volta a zero sem apagar nada no Firestore.
    effect((onCleanup) => {
      const uid = this.auth.uid();
      const startedAt = this.startedAt();
      this.machines.set([]);
      this.completions.set([]);
      if (!uid || startedAt === null || !this.roles.isPresenter()) return;

      const db = firebase().db;
      const since = (name: string) =>
        query(collection(db, SESSIONS, uid, name), where('at', '>=', startedAt));

      const stopMachines = onSnapshot(since(MACHINES), (snapshot) =>
        this.machines.set(
          snapshot.docs.flatMap((d) => {
            const at = d.get('at');
            return typeof at === 'number' ? [{ machine: d.id, at }] : [];
          }),
        ),
      );
      const stopCompletions = onSnapshot(since(COMPLETIONS), (snapshot) =>
        this.completions.set(snapshot.docs.flatMap((d) => parseCompletion(d.data()))),
      );
      onCleanup(() => {
        stopMachines();
        stopCompletions();
      });
    });

    // O aluno entra na conta da aula: de novo a cada "Reiniciar apresentacao".
    effect(() => {
      const uid = this.auth.uid();
      const startedAt = this.startedAt();
      if (!uid || startedAt === null || !this.roles.isStudent()) return;

      this.reported = new Set();
      const presence: Omit<MachinePresence, 'machine'> = { at: this.stamp(startedAt) };
      void setDoc(doc(firebase().db, SESSIONS, uid, MACHINES, machineId()), presence);
    });
  }

  /** Aluno: a missao desta fase ficou concluida nesta maquina. */
  reportCompletion(levelId: number): Promise<unknown> {
    const uid = this.auth.uid();
    const startedAt = this.startedAt();
    if (!this.isBrowser || !uid || startedAt === null || !this.roles.isStudent()) {
      return Promise.resolve();
    }

    const machine = machineId();
    const id = completionId(machine, levelId);
    if (this.reported.has(id)) return Promise.resolve();
    this.reported.add(id);

    const completion: LevelCompletion = { levelId, machine, at: this.stamp(startedAt) };
    return setDoc(doc(firebase().db, SESSIONS, uid, COMPLETIONS, id), completion);
  }

  /**
   * Hora desta maquina, mas nunca antes do comeco da aula: um relogio alguns
   * segundos atrasado nao pode fazer o aluno parecer de uma aula passada.
   */
  private stamp(startedAt: number): number {
    return Math.max(Date.now(), startedAt);
  }
}

function parseCompletion(data: unknown): LevelCompletion[] {
  if (typeof data !== 'object' || data === null) return [];
  const { levelId, machine, at } = data as Record<string, unknown>;
  return typeof levelId === 'number' && typeof machine === 'string' && typeof at === 'number'
    ? [{ levelId, machine, at }]
    : [];
}
