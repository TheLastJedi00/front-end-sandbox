import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ClassProgress, progressLabel } from '../class-progress-state';

/**
 * Na tela do apresentador, durante o codigo de uma fase: quantos alunos ja
 * terminaram a missao. Quando a turma inteira termina, a barra brilha e o
 * botao de seguir se destaca — o professor percebe de longe que pode avancar.
 * O botao fica sempre ativo: quem decide seguir e ele, nao a barra.
 */
@Component({
  selector: 'app-class-progress-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'class-progress-popup',
    '[class.is-complete]': 'progress().complete',
    '[class.is-collapsed]': 'collapsed()',
  },
  template: `
    <p class="sr-only" role="status">{{ progress().complete ? 'Todos terminaram' : '' }}</p>

    @if (collapsed()) {
      <button
        class="pill"
        type="button"
        [attr.aria-label]="label() + '. Mostrar o progresso da turma'"
        (click)="collapsed.set(false)"
      >
        <span class="pill-track" aria-hidden="true">
          <span class="fill" [style.inline-size.%]="percent()"></span>
        </span>
        {{ progress().done }}/{{ progress().total }}
      </button>
    } @else {
      <section class="card" aria-label="Progresso da turma">
        <header class="head">
          <p class="title">{{ progress().complete ? 'Todos terminaram!' : 'Missão prática' }}</p>
          <button
            class="collapse"
            type="button"
            aria-label="Recolher o progresso da turma"
            (click)="collapsed.set(true)"
          >
            –
          </button>
        </header>

        <p class="count">{{ label() }}</p>
        <div
          class="track"
          role="progressbar"
          aria-label="Alunos que terminaram a missão"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="progress().total"
          [attr.aria-valuenow]="progress().done"
        >
          <span class="fill" [style.inline-size.%]="percent()"></span>
        </div>

        <button class="next" type="button" (click)="next.emit()">{{ nextLabel() }} →</button>
      </section>
    }
  `,
  styles: `
    :host {
      --glow: var(--state-success);
      position: fixed;
      inset-block-end: 2.5rem;
      inset-inline-end: var(--space-4);
      z-index: 40;
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .card {
      display: grid;
      gap: var(--space-2);
      inline-size: min(20rem, calc(100vw - 2rem));
      padding: var(--space-3) var(--space-4) var(--space-4);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-panel);
      box-shadow: 0 1rem 3rem -1rem #000;
      animation: card-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .collapse {
      padding: 0 var(--space-2);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 1.25rem;
      line-height: 1;
    }

    .collapse:hover {
      color: var(--text-primary);
    }

    .count {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.125rem;
      font-weight: 600;
    }

    .track,
    .pill-track {
      position: relative;
      display: block;
      overflow: hidden;
      border-radius: 999px;
      background: var(--surface-raised);
    }

    .track {
      block-size: 0.75rem;
    }

    .pill-track {
      inline-size: 3rem;
      block-size: 0.4rem;
    }

    .fill {
      display: block;
      block-size: 100%;
      border-radius: inherit;
      background: var(--state-hint);
      transition: inline-size 600ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .next {
      justify-self: stretch;
      margin-block-start: var(--space-1);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      color: var(--text-primary);
      font-weight: 600;
    }

    .next:hover {
      border-color: var(--focus-ring);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-strong);
      border-radius: 999px;
      background: var(--surface-panel);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 0.875rem;
      box-shadow: 0 0.5rem 1.5rem -0.5rem #000;
    }

    /* Turma inteira pronta: a barra fica cheia e comeca a brilhar. */
    :host(.is-complete) .fill {
      background: var(--glow);
      animation: glow 1.4s ease-in-out infinite;
    }

    :host(.is-complete) .card,
    :host(.is-complete) .pill {
      border-color: var(--glow);
      animation: card-glow 1.4s ease-in-out infinite;
    }

    :host(.is-complete) .next {
      border-color: var(--glow);
      background: var(--glow);
      color: #10231f;
    }

    @keyframes glow {
      50% {
        box-shadow: 0 0 1rem 0.2rem var(--glow);
        filter: brightness(1.3);
      }
    }

    @keyframes card-glow {
      50% {
        box-shadow:
          0 1rem 3rem -1rem #000,
          0 0 1.75rem 0.25rem color-mix(in srgb, var(--glow) 55%, transparent);
      }
    }

    @keyframes card-in {
      from {
        opacity: 0;
        transform: translateY(1rem);
      }
    }

    /* Sem movimento: nada pulsa. A cor de sucesso e um contorno fazem o aviso. */
    @media (prefers-reduced-motion: reduce) {
      .card,
      :host(.is-complete) .card,
      :host(.is-complete) .pill,
      :host(.is-complete) .fill {
        animation: none;
      }

      .fill {
        transition: none;
      }

      :host(.is-complete) .card,
      :host(.is-complete) .pill {
        outline: 2px solid var(--glow);
        outline-offset: 2px;
      }
    }
  `,
})
export class ClassProgressPopup {
  readonly progress = input.required<ClassProgress>();
  readonly nextLabel = input('Próxima fase');
  readonly next = output<void>();

  protected readonly collapsed = signal(false);
  protected readonly label = computed(() => progressLabel(this.progress()));
  protected readonly percent = computed(() => this.progress().ratio * 100);
}
