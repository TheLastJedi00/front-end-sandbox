import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressStore } from '../../core/services/progress-store';
import { FIRST_LEVEL, LEVELS } from '../../levels/level-definitions';

/** Fechamento: amarra os tres conceitos ao que o aluno acabou de construir. */
@Component({
  selector: 'app-finish-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <p class="eyebrow">{{ progress.completedCount() }} de {{ total }} fases concluídas</p>
      <h1 class="title">Isto era o jogo. E você escreveu.</h1>

      <ul class="recap">
        @for (item of recap; track item.language) {
          <li class="item">
            <span class="language">{{ item.language }}</span>
            <p class="text">{{ item.text }}</p>
          </li>
        }
      </ul>

      <p class="closing">
        Toda página que você abre na internet é feita exatamente assim: alguém descreveu o que
        existe, como aparece e o que acontece.
      </p>

      <div class="actions">
        <a class="action action--primary" [routerLink]="['/sandbox', firstLevel]">
          Jogar de novo
        </a>
        <a class="action" routerLink="/">Voltar ao início</a>
      </div>
    </main>
  `,
  styles: `
    .page {
      display: grid;
      justify-items: center;
      gap: var(--space-4);
      max-inline-size: 52rem;
      margin-inline: auto;
      padding: var(--space-12) var(--space-4);
      text-align: center;
    }

    .eyebrow {
      margin: 0;
      color: var(--state-success);
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .title {
      margin: 0;
      font-size: clamp(1.75rem, 4.5vw, 2.75rem);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .recap {
      display: grid;
      gap: var(--space-3);
      inline-size: 100%;
      margin: var(--space-4) 0 0;
      padding: 0;
      list-style: none;
      text-align: start;
    }

    .item {
      display: grid;
      grid-template-columns: 7rem 1fr;
      gap: var(--space-4);
      align-items: baseline;
      padding: var(--space-3) var(--space-4);
      border-inline-start: 2px solid var(--surface-status);
      background: var(--surface-panel);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .language {
      color: var(--state-hint);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .text {
      margin: 0;
      color: var(--text-primary);
    }

    .closing {
      max-inline-size: 40rem;
      margin: var(--space-4) 0 0;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-3);
      margin-block-start: var(--space-4);
    }

    .action {
      padding: var(--space-3) var(--space-6);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-weight: 600;
      text-decoration: none;
    }

    .action--primary {
      border-color: transparent;
      background: var(--surface-status);
      color: var(--text-inverse);
    }

    @media (max-inline-size: 600px) {
      .item {
        grid-template-columns: 1fr;
        gap: var(--space-1);
      }
    }
  `,
})
export class FinishPage {
  protected readonly progress = inject(ProgressStore);
  protected readonly total = LEVELS.length;
  protected readonly firstLevel = FIRST_LEVEL;

  protected readonly recap = [
    {
      language: 'HTML',
      text: 'Você criou o céu, o terreno e a bola — e disse quem fica dentro de quem.',
    },
    {
      language: 'CSS',
      text: 'Você pintou cada elemento e descreveu o pulo como três momentos no tempo.',
    },
    {
      language: 'JavaScript',
      text: 'Você ligou o teclado ao jogo: uma tecla apertada virou movimento na tela.',
    },
  ];
}
