import { computed, Injectable, signal } from '@angular/core';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebase } from '../firebase/firebase';
import { injectIsBrowser } from '../platform/browser';

/**
 * Quem esta logado nesta maquina. E sempre a conta do professor — a mesma em
 * todas as maquinas da sala — e e o `uid` dela que liga as maquinas a mesma
 * sessao ao vivo.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly isBrowser = injectIsBrowser();

  private readonly current = signal<User | null>(null);
  /** O Firebase ja disse se ha sessao guardada. Antes disso, ninguem decide nada. */
  private readonly resolved = signal(false);

  readonly user = this.current.asReadonly();
  readonly ready = this.resolved.asReadonly();
  readonly uid = computed(() => this.current()?.uid ?? null);
  readonly isLoggedIn = computed(() => this.current() !== null);

  /** Resolve assim que o estado inicial do login e conhecido. */
  readonly whenReady: Promise<void>;

  constructor() {
    if (!this.isBrowser) {
      this.whenReady = Promise.resolve();
      return;
    }

    this.whenReady = new Promise((resolve) => {
      onAuthStateChanged(firebase().auth, (user) => {
        this.current.set(user);
        this.resolved.set(true);
        resolve();
      });
    });
  }

  async login(email: string, password: string): Promise<void> {
    const { user } = await signInWithEmailAndPassword(firebase().auth, email, password);
    this.current.set(user);
  }

  async logout(): Promise<void> {
    await signOut(firebase().auth);
    this.current.set(null);
  }
}

/** Traduz os erros do Firebase Auth para o que a tela de login mostra. */
export function loginErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Confira a rede e tente de novo.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada.';
    default:
      return 'Não foi possível entrar. Tente de novo.';
  }
}
