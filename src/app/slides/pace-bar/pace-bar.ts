import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { Clock } from '../../core/platform/clock';
import { paceOf, SLIDE_TARGET_MS } from '../slide-pace';

/**
 * Regua do apresentador: enche ate a meta de tempo do slide e muda de cor ao
 * passar dela. E local — so a tela de quem conduz mostra, e nada e gravado.
 */
@Component({
  selector: 'app-pace-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pace-bar',
    '[attr.data-status]': 'pace().status',
    '[style.--pace]': 'pace().fraction',
    'aria-hidden': 'true',
  },
  template: `
    <span class="fill"></span>
    <span class="label">{{ elapsedSeconds() }}s / {{ targetSeconds }}s</span>
  `,
  styles: `
    :host {
      position: absolute;
      inset-block-start: -1px;
      inset-inline: 0;
      block-size: 3px;
      background: color-mix(in srgb, var(--text-dim) 25%, transparent);
      pointer-events: none;
    }

    .fill {
      display: block;
      block-size: 100%;
      background: var(--state-success);
      transform: scaleX(var(--pace, 0));
      transform-origin: left;
      transition:
        transform 250ms linear,
        background-color 300ms ease;
    }

    :host([data-status='perto']) .fill {
      background: var(--state-warning);
    }

    :host([data-status='passou']) .fill {
      background: var(--state-error);
    }

    .label {
      position: absolute;
      inset-block-start: var(--space-2);
      inset-inline-start: 50%;
      transform: translateX(-50%);
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
    }

    :host([data-status='passou']) .label {
      color: var(--state-error);
    }

    @media (prefers-reduced-motion: reduce) {
      .fill {
        transition: none;
      }
    }
  `,
})
export class PaceBar {
  /** O slide atual. Trocar de slide zera a regua; trocar de etapa, nao. */
  readonly slide = input.required<number>();

  private readonly clock = inject(Clock);
  private readonly startedAt = linkedSignal({ source: this.slide, computation: () => Date.now() });
  private readonly elapsed = computed(() => Math.max(0, this.clock.now() - this.startedAt()));

  protected readonly pace = computed(() => paceOf(this.elapsed()));
  protected readonly elapsedSeconds = computed(() => Math.floor(this.elapsed() / 1000));
  protected readonly targetSeconds = SLIDE_TARGET_MS / 1000;
}
