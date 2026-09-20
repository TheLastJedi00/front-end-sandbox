import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LevelDefinition, ValidationResult } from '../../core/models';

/** Enunciado da fase e a lista de objetivos que vai sendo marcada sozinha. */
@Component({
  selector: 'app-goal-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'goal-panel' },
  template: `
    <header class="head">
      <span class="concept">{{ level().concept }}</span>
      <h1 class="title">{{ level().title }}</h1>
    </header>

    <p class="goal">{{ level().goal }}</p>

    <ul class="checks">
      @for (check of validation().checks; track check.id) {
        <li class="check" [class.check--done]="check.done">
          <span class="mark" aria-hidden="true">{{ check.done ? '✓' : '○' }}</span>
          <span>{{ check.label }}</span>
          <span class="sr">{{ check.done ? ' (concluído)' : ' (pendente)' }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--space-4);
    }

    .head {
      display: flex;
      align-items: baseline;
      gap: var(--space-3);
    }

    .concept {
      padding: 0.1rem var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      color: var(--state-hint);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    .title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .goal {
      margin: var(--space-2) 0 var(--space-3);
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .checks {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .check {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .check--done {
      color: var(--state-success);
    }

    .mark {
      inline-size: 1rem;
    }

    .sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class GoalPanel {
  readonly level = input.required<LevelDefinition>();
  readonly validation = input.required<ValidationResult>();
}
