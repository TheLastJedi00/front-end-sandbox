import { effect, inject, Injectable, signal } from '@angular/core';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { AuthStore } from '../auth/auth-store';
import { firebase } from '../firebase/firebase';
import { injectIsBrowser } from '../platform/browser';
import { SESSIONS } from './live-session';
import { RoleStore } from './role-store';

const ALERTS = 'alertas';
const MACHINE_KEY = 'sandbox-front-end:v1:maquina';

/** Alertas da mesma fase que chegam dentro desta janela viram um popup so. */
export const MERGE_WINDOW_MS = 10_000;
/** Quanto tempo o popup fica na tela depois do ultimo alerta que entrou nele. */
export const TOAST_LIFETIME_MS = 8_000;

/** `sessoes/{uid}/alertas/{id}`: uma maquina mostrou a solucao de uma fase. */
export interface SolutionAlert {
  readonly levelId: number;
  /** Id aleatorio da maquina — so para contar maquinas diferentes. */
  readonly machine: string;
  /** Epoch ms. */
  readonly at: number;
}

/** O popup na tela do professor. */
export interface AlertToast {
  readonly id: number;
  readonly levelId: number;
  readonly machines: readonly string[];
  readonly lastAt: number;
}

/**
 * Junta um alerta aos popups abertos: se ja ha um da mesma fase recebido ha
 * pouco, ele so ganha mais uma maquina; senao, abre um novo. Funcao pura.
 */
export function mergeAlert(
  toasts: readonly AlertToast[],
  alert: SolutionAlert,
  nextId: number,
): readonly AlertToast[] {
  const open = toasts.find(
    (toast) => toast.levelId === alert.levelId && alert.at - toast.lastAt <= MERGE_WINDOW_MS,
  );
  if (!open) {
    return [...toasts, { id: nextId, levelId: alert.levelId, machines: [alert.machine], lastAt: alert.at }];
  }

  const machines = open.machines.includes(alert.machine)
    ? open.machines
    : [...open.machines, alert.machine];
  return toasts.map((toast) =>
    toast === open ? { ...toast, machines, lastAt: Math.max(toast.lastAt, alert.at) } : toast,
  );
}

export function toastMessage(toast: AlertToast): string {
  const count = toast.machines.length;
  return count === 1
    ? `Uma máquina mostrou a solução da fase ${toast.levelId}.`
    : `${count} máquinas mostraram a solução da fase ${toast.levelId}.`;
}

function parseAlert(data: unknown): SolutionAlert | null {
  if (typeof data !== 'object' || data === null) return null;
  const { levelId, machine, at } = data as Record<string, unknown>;
  return typeof levelId === 'number' && typeof machine === 'string' && typeof at === 'number'
    ? { levelId, machine, at }
    : null;
}

/**
 * "Mostrar solucao" continua livre na maquina do aluno, mas o professor fica
 * sabendo: o aluno grava um alerta e a maquina do apresentador mostra um popup.
 */
@Injectable({ providedIn: 'root' })
export class SolutionAlerts {
  private readonly auth = inject(AuthStore);
  private readonly roles = inject(RoleStore);
  private readonly isBrowser = injectIsBrowser();

  private readonly open = signal<readonly AlertToast[]>([]);
  readonly toasts = this.open.asReadonly();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    if (!this.isBrowser) return;

    // So o apresentador escuta, e so o que chega depois que ele comecou a
    // escutar: um F5 nao faz os alertas antigos pularem de novo na tela.
    effect((onCleanup) => {
      const uid = this.auth.uid();
      if (!uid || !this.roles.isPresenter()) return;

      const since = Date.now();
      const alerts = query(
        collection(firebase().db, SESSIONS, uid, ALERTS),
        where('at', '>', since),
      );
      const stop = onSnapshot(alerts, (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type !== 'added') continue;
          const alert = parseAlert(change.doc.data());
          if (alert) this.receive(alert);
        }
      });
      onCleanup(stop);
    });
  }

  /** Aluno: avisa o professor que esta maquina mostrou a solucao da fase. */
  report(levelId: number): Promise<unknown> {
    const uid = this.auth.uid();
    if (!this.isBrowser || !uid) return Promise.resolve();

    const alert: SolutionAlert = { levelId, machine: this.machineId(), at: Date.now() };
    return addDoc(collection(firebase().db, SESSIONS, uid, ALERTS), alert);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.open.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private receive(alert: SolutionAlert): void {
    const toasts = mergeAlert(this.open(), alert, this.nextId);
    if (toasts.some((toast) => toast.id === this.nextId)) this.nextId++;
    this.open.set(toasts);

    // O popup some sozinho; cada alerta novo nele renova o prazo.
    const toast = toasts.find((t) => t.levelId === alert.levelId && t.lastAt >= alert.at);
    if (!toast) return;
    clearTimeout(this.timers.get(toast.id));
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), TOAST_LIFETIME_MS),
    );
  }

  private machineId(): string {
    try {
      const saved = localStorage.getItem(MACHINE_KEY);
      if (saved) return saved;
      const id = crypto.randomUUID();
      localStorage.setItem(MACHINE_KEY, id);
      return id;
    } catch {
      return 'desconhecida';
    }
  }
}
