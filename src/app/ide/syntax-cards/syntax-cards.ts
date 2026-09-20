import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { syntaxCards } from '../../assist/syntax-cards';
import { LevelConcept } from '../../core/models';

/**
 * Cards de sintaxe sobre a area do editor. Ficam visiveis enquanto o aluno nao
 * digitou nada e saem do caminho na primeira tecla — o codigo e que importa.
 */
@Component({
  selector: 'app-syntax-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Um toque em qualquer lugar dos cards ja significa "quero escrever": segurar
  // o clique aqui deixaria o aluno sem conseguir chegar ao editor embaixo.
  host: { class: 'syntax-cards', '(click)': 'close.emit()' },
  template: `
    <div class="sheet" role="note" [attr.aria-label]="'Sintaxe de ' + concept()">
      <header class="head">
        <h2 class="heading">Antes de digitar</h2>
        <button class="close" type="button" (click)="close.emit()">Fechar</button>
      </header>

      <ul class="cards">
        @for (card of cards(); track card.id) {
          <li class="card">
            <strong class="title">{{ card.title }}</strong>
            <p class="explanation">{{ card.explanation }}</p>
            <pre class="example"><code>@for (line of card.example; track $index) {{{ line }}
}</code></pre>
            <p class="mistake"><span class="mistake-label">Erro comum:</span> {{ card.mistake }}</p>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: grid;
      align-items: start;
      padding: var(--space-4);
      background: color-mix(in srgb, var(--surface-editor) 88%, transparent);
      backdrop-filter: blur(2px);
      overflow-y: auto;
    }

    .sheet {
      display: grid;
      gap: var(--space-3);
    }

    .head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .heading {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .close {
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .cards {
      display: grid;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .card {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px solid var(--border-soft);
      border-inline-start: 3px solid var(--state-hint);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
    }

    .title {
      font-size: 0.9375rem;
    }

    .explanation,
    .mistake {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .example {
      margin: 0;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--surface-editor);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      line-height: var(--line-code);
      overflow-x: auto;
    }

    .mistake-label {
      color: var(--state-warning);
    }
  `,
})
export class SyntaxCards {
  readonly concept = input.required<LevelConcept>();
  readonly close = output<void>();

  protected readonly cards = computed(() => syntaxCards(this.concept()));
}
