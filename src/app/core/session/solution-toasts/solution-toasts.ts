import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SolutionAlerts, toastMessage } from '../solution-alerts';

/**
 * Popups na tela do professor quando uma maquina mostra a solucao. Ficam num
 * canto, por cima de tudo, e somem sozinhos — o professor nao precisa parar a
 * aula para fecha-los.
 */
@Component({
  selector: 'app-solution-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'solution-toasts' },
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (toast of alerts.toasts(); track toast.id) {
        <div class="toast" animate.enter="toast-enter">
          <span class="icon" aria-hidden="true">!</span>
          <p class="text">{{ message(toast) }}</p>
          <button
            class="close"
            type="button"
            aria-label="Fechar aviso"
            (click)="alerts.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset-block-start: 3rem;
      inset-inline-end: var(--space-4);
      z-index: 50;
      pointer-events: none;
    }

    .stack {
      display: grid;
      gap: var(--space-2);
      inline-size: min(22rem, calc(100vw - 2rem));
    }

    .toast {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 1px solid color-mix(in srgb, var(--state-warning) 55%, transparent);
      border-radius: var(--radius-md);
      background: var(--surface-panel);
      box-shadow: 0 1rem 3rem -1rem #000;
      pointer-events: auto;
    }

    .toast-enter {
      animation: toast-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .icon {
      display: grid;
      place-items: center;
      inline-size: 1.5rem;
      block-size: 1.5rem;
      border-radius: 50%;
      background: var(--state-warning);
      color: #1e1e1e;
      font-weight: 700;
    }

    .text {
      margin: 0;
      color: var(--text-primary);
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .close {
      padding: 0 var(--space-1);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 1.25rem;
      line-height: 1;
    }

    .close:hover {
      color: var(--text-primary);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(1.5rem);
      }
    }
  `,
})
export class SolutionToasts {
  protected readonly alerts = inject(SolutionAlerts);
  protected readonly message = toastMessage;
}
