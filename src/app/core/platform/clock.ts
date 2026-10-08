import { Injectable, signal } from '@angular/core';
import { injectIsBrowser } from './browser';

/** Mais rapido que um segundo: a virada do numero nao atrasa visivelmente. */
const TICK_MS = 250;

/**
 * Hora atual como signal, para quem conta tempo na tela (o timer da fase). Um
 * relogio so para o app inteiro; no prerender ele fica parado.
 */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly current = signal(Date.now());
  readonly now = this.current.asReadonly();

  constructor() {
    if (injectIsBrowser()) setInterval(() => this.current.set(Date.now()), TICK_MS);
  }
}
