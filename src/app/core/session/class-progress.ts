import { computed, effect, inject, Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { AuthStore } from '../auth/auth-store';
import { firebase } from '../firebase/firebase';
import { injectIsBrowser } from '../platform/browser';
import { completionId, LevelCompletion, MachinePresence } from './class-progress-state';
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

  constructor() {
    if (!this.isBrowser) return;

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
