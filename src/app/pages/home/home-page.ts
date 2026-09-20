import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FIRST_LEVEL } from '../../levels/level-definitions';

/** Abertura da apresentacao: as tres linguagens em uma frase cada. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <p class="eyebrow">sandbox-front-end</p>
      <h1 class="title">Você vai escrever um jogo.</h1>
      <p class="lead">
        Três linguagens trabalham juntas em toda página da internet. Em cada fase você usa uma
        delas — e vê o resultado ao lado, na hora.
      </p>

      <ul class="cards">
        @for (card of cards; track card.language) {
          <li class="card">
            <span class="language" [style.color]="card.color">{{ card.language }}</span>
            <strong class="role">{{ card.role }}</strong>
            <p class="detail">{{ card.detail }}</p>
            <code class="sample">{{ card.sample }}</code>
          </li>
        }
      </ul>

      <a class="start" [routerLink]="['/sandbox', firstLevel]">Começar</a>
    </main>
  `,
  styles: `
    .page {
      display: grid;
      justify-items: center;
      gap: var(--space-4);
      max-inline-size: 60rem;
      margin-inline: auto;
      padding: var(--space-12) var(--space-4);
      text-align: center;
    }

    .eyebrow {
      margin: 0;
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .title {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .lead {
      max-inline-size: 42rem;
      margin: 0;
      color: var(--text-muted);
      font-size: 1.0625rem;
      line-height: 1.6;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: var(--space-4);
      inline-size: 100%;
      margin: var(--space-4) 0 0;
      padding: 0;
      list-style: none;
    }

    .card {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--surface-panel);
      text-align: start;
    }

    .language {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .role {
      font-size: 1.125rem;
    }

    .detail {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .sample {
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--surface-editor);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .start {
      margin-block-start: var(--space-4);
      padding: var(--space-3) var(--space-8);
      border-radius: var(--radius-md);
      background: var(--surface-status);
      color: var(--text-inverse);
      font-size: 1.0625rem;
      font-weight: 600;
      text-decoration: none;
    }
  `,
})
export class HomePage {
  protected readonly firstLevel = FIRST_LEVEL;

  protected readonly cards = [
    {
      language: 'HTML',
      role: 'O que existe',
      detail: 'Cria as coisas e diz quem está dentro de quem.',
      sample: '<ball></ball>',
      color: '#e34f26',
    },
    {
      language: 'CSS',
      role: 'Como aparece',
      detail: 'Dá cor, tamanho e movimento ao que já existe.',
      sample: 'ball { color: red }',
      color: '#2965f1',
    },
    {
      language: 'JavaScript',
      role: 'O que acontece',
      detail: 'Reage ao jogador e muda o jogo enquanto ele roda.',
      sample: 'if(key("D")) { avancar() }',
      color: '#f0db4f',
    },
  ];
}
