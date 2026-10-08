import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressStore } from '../../core/services/progress-store';
import { LEVELS } from '../../levels/level-definitions';

/**
 * Trilha das tres fases. Os links ficam sempre livres: numa apresentacao de 15
 * minutos quem conduz precisa poder pular uma etapa sem refazer a anterior.
 * Na maquina do aluno a trilha so mostra onde a turma esta: quem troca de fase
 * e o professor.
 */
@Component({
  selector: 'app-level-progress',
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'level-progress' },
  template: `
    <nav aria-label="Fases">
      <ol class="steps">
        @for (level of levels; track level.id) {
          <li class="step">
            @if (navigable()) {
              <a
                class="link"
                [class.link--current]="level.id === current()"
                [class.link--done]="progress.isCompleted(level.id)"
                [routerLink]="['/sandbox', level.id]"
                [attr.aria-current]="level.id === current() ? 'page' : null"
              >
                <ng-container *ngTemplateOutlet="content; context: { $implicit: level }" />
              </a>
            } @else {
              <span
                class="link"
                [class.link--current]="level.id === current()"
                [class.link--done]="progress.isCompleted(level.id)"
                [attr.aria-current]="level.id === current() ? 'step' : null"
              >
                <ng-container *ngTemplateOutlet="content; context: { $implicit: level }" />
              </span>
            }
          </li>
        }
      </ol>
    </nav>

    <ng-template #content let-level>
      <span class="mark" aria-hidden="true">
        {{ progress.isCompleted(level.id) ? '✓' : level.id }}
      </span>
      <span class="name">{{ level.concept }}</span>
    </ng-template>
  `,
  styles: `
    .steps {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .link {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0.15rem var(--space-2);
      border-radius: var(--radius-sm);
      color: var(--text-dim);
      font-size: 0.75rem;
      text-decoration: none;
    }

    .link:hover {
      color: var(--text-primary);
    }

    .link--current {
      background: var(--surface-raised);
      color: var(--text-primary);
    }

    .link--done {
      color: var(--state-success);
    }

    .mark {
      display: grid;
      place-content: center;
      inline-size: 1.1rem;
      block-size: 1.1rem;
      border: 1px solid currentcolor;
      border-radius: 50%;
      font-size: 0.6875rem;
    }
  `,
})
export class LevelProgress {
  readonly current = input.required<number>();
  /** Os itens sao links. Desligado na maquina do aluno. */
  readonly navigable = input(true);

  protected readonly progress = inject(ProgressStore);
  protected readonly levels = LEVELS;
}
