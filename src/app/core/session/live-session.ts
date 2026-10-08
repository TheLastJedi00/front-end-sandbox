import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  doc,
  DocumentReference,
  Firestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { AuthStore } from '../auth/auth-store';
import { firebase } from '../firebase/firebase';
import { injectIsBrowser } from '../platform/browser';
import { DECK_START } from '../../slides/deck-navigation';
import { IDLE_TIMER } from './phase-timer';
import { initialPresentation, parsePresentationState, PresentationState } from './presentation-state';

export const SESSIONS = 'sessoes';

export function sessionRef(db: Firestore, uid: string): DocumentReference {
  return doc(db, SESSIONS, uid);
}

/** Grava so os campos dados, sem apagar os outros, e carimba a hora do servidor. */
export function writeSession(
  db: Firestore,
  uid: string,
  patch: Partial<PresentationState>,
): Promise<void> {
  return setDoc(sessionRef(db, uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

export interface SessionSnapshot {
  readonly state: PresentationState;
  /** O documento ainda nao existe no servidor: ninguem apresentou nesta conta. */
  readonly exists: boolean;
  /** Veio do cache local, nao do servidor: a maquina esta sem conexao. */
  readonly fromCache: boolean;
  /** Ha gravacao desta maquina ainda nao confirmada pelo servidor. */
  readonly pending: boolean;
}

/**
 * Escuta `sessoes/{uid}` pelo canal em tempo real do Firestore. Cada mudanca
 * — de qualquer maquina — chega aqui sem polling.
 */
export function watchSession(
  db: Firestore,
  uid: string,
  next: (snapshot: SessionSnapshot) => void,
  error: (error: unknown) => void = () => undefined,
): Unsubscribe {
  return onSnapshot(
    sessionRef(db, uid),
    { includeMetadataChanges: true },
    (snapshot) =>
      next({
        state: parsePresentationState(snapshot.data(), Date.now()),
        exists: snapshot.exists(),
        fromCache: snapshot.metadata.fromCache,
        pending: snapshot.metadata.hasPendingWrites,
      }),
    error,
  );
}

/**
 * A aula ao vivo vista por esta maquina. Todas leem o mesmo documento (a conta
 * e a do professor); so a do apresentador grava.
 */
@Injectable({ providedIn: 'root' })
export class LiveSession {
  private readonly auth = inject(AuthStore);
  private readonly isBrowser = injectIsBrowser();

  private readonly snapshot = signal<SessionSnapshot | null>(null);

  /** Estado da aula; `null` ate a primeira leitura chegar. */
  readonly state = computed(() => this.snapshot()?.state ?? null);
  readonly loaded = computed(() => this.snapshot() !== null);
  readonly exists = computed(() => this.snapshot()?.exists ?? false);
  /** Ligada ao servidor (o ultimo estado nao veio so do cache). */
  readonly connected = computed(() => {
    const snapshot = this.snapshot();
    return snapshot !== null && !snapshot.fromCache;
  });
  readonly pending = computed(() => this.snapshot()?.pending ?? false);

  constructor() {
    if (!this.isBrowser) return;

    // Trocar de conta (ou sair) troca o documento escutado.
    effect((onCleanup) => {
      const uid = this.auth.uid();
      this.snapshot.set(null);
      if (!uid) return;

      const stop = watchSession(firebase().db, uid, (snapshot) => this.snapshot.set(snapshot));
      onCleanup(stop);
    });
  }

  /**
   * Gravacao do apresentador. O snapshot local chega na hora (o Firestore aplica
   * a gravacao antes de o servidor confirmar), entao a tela dele nao espera rede.
   */
  update(patch: Partial<PresentationState>): Promise<void> {
    const uid = this.auth.uid();
    if (!this.isBrowser || !uid) return Promise.resolve();
    return writeSession(firebase().db, uid, patch);
  }

  /** Leva a turma para uma fase, com o conceito aberto e o timer parado. */
  enterLevel(levelId: number): Promise<void> {
    return this.update({
      stage: 'fase',
      levelId,
      deck: DECK_START,
      conceptOpen: true,
      timer: IDLE_TIMER,
    });
  }

  /** Leva a turma para a tela final. */
  finish(): Promise<void> {
    return this.update({ stage: 'fim', timer: IDLE_TIMER });
  }

  /** Reiniciar a apresentacao: todos voltam a abertura e a aula recomeca. */
  restart(): Promise<void> {
    return this.update(initialPresentation(Date.now()));
  }
}
