import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { injectIsBrowser } from '../../core/platform/browser';
import {
  formatRemaining,
  isExpired,
  PhaseTimer as PhaseTimerState,
  remainingMs,
} from '../../core/session/phase-timer';

/** A partir daqui o relogio fica em alerta. */
const LAST_MINUTE_MS = 60_000;
/** Mais rapido que um segundo: a virada do numero nao atrasa visivelmente. */
const TICK_MS = 250;

/**
 * Relogio da fase na barra de titulo. Conta sozinho a partir do `endsAt` da
 * sessao — nada e gravado a cada segundo. Os controles so aparecem na maquina
 * do apresentador.
 */
@Component({
  selector: 'app-phase-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'phase-timer',
    '[class.phase-timer--idle]': 'timer().status === "parado"',
    '[class.phase-timer--warning]': 'warning()',
    '[class.phase-timer--expired]': 'expired()',
  },
  template: `
    <span class="clock" [attr.aria-label]="'Tempo da fase: ' + display()">
      <span class="icon" aria-hidden="true">⏱</span>
      <span class="digits">{{ display() }}</span>
      @if (timer().status === 'pausado' && !expired()) {
        <span class="paused">pausado</span>
      }
    </span>

    @if (controls()) {
      @switch (timer().status) {
        @case ('rodando') {
          <button class="control" type="button" (click)="pause.emit()">Pausar</button>
        }
        @case ('pausado') {
          <button class="control" type="button" (click)="resume.emit()">Retomar</button>
        }
      }
      <button class="control" type="button" (click)="restart.emit()">
        {{ timer().status === 'parado' ? 'Iniciar' : 'Reiniciar' }}
      </button>
    }

    <!-- Um anuncio por minuto, e no zero: o leitor de tela nao fala a cada segundo. -->
    <span class="live" aria-live="polite">{{ announcement() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 0.8125rem;
    }

    .clock {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 0.1rem var(--space-2);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--state-success) 16%, transparent);
      color: var(--state-success);
      font-family: var(--font-mono);
      font-weight: 600;
      transition:
        background-color 300ms ease,
        color 300ms ease;
    }

    :host(.phase-timer--idle) .clock {
      background: transparent;
      color: var(--text-muted);
    }

    :host(.phase-timer--warning) .clock {
      background: color-mix(in srgb, var(--state-warning) 22%, transparent);
      color: var(--state-warning);
    }

    :host(.phase-timer--expired) .clock {
      background: color-mix(in srgb, var(--state-error) 24%, transparent);
      color: var(--state-error);
      animation: blink 1s steps(2, start) 3;
    }

    .digits {
      min-inline-size: 2.6rem;
      text-align: end;
      font-variant-numeric: tabular-nums;
    }

    .paused {
      font-family: var(--font-ui);
      font-weight: 400;
      font-size: 0.75rem;
    }

    .control {
      padding: 0.1rem var(--space-2);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .control:hover {
      border-color: var(--focus-ring);
      color: var(--text-primary);
    }

    .live {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }

    @keyframes blink {
      to {
        visibility: hidden;
      }
    }
  `,
})
export class PhaseTimer {
  readonly timer = input.required<PhaseTimerState>();
  /** Maquina do apresentador: mostra pausar, retomar e reiniciar. */
  readonly controls = input(false);

  readonly pause = output<void>();
  readonly resume = output<void>();
  readonly restart = output<void>();

  private readonly now = signal(Date.now());

  protected readonly remaining = computed(() => remainingMs(this.timer(), this.now()));
  protected readonly display = computed(() => formatRemaining(this.remaining()));
  protected readonly expired = computed(() => isExpired(this.timer(), this.now()));
  protected readonly warning = computed(
    () =>
      this.timer().status !== 'parado' && !this.expired() && this.remaining() <= LAST_MINUTE_MS,
  );
  protected readonly announcement = computed(() => {
    if (this.timer().status === 'parado') return '';
    if (this.expired()) return 'Tempo esgotado';
    const minutes = Math.ceil(this.remaining() / 60_000);
    return minutes === 1 ? 'Falta 1 minuto' : `Faltam ${minutes} minutos`;
  });

  constructor() {
    if (!injectIsBrowser()) return;

    const tick = setInterval(() => this.now.set(Date.now()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }
}
