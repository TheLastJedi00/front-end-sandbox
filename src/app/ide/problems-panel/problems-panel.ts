import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Diagnostic, SOURCE_FILES } from '../../core/models';

/** Painel inferior: os erros do parser e, quando pedida, a dica da fase. */
@Component({
  selector: 'app-problems-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'problems-panel' },
  template: `
    <header class="head">
      <h2 class="tab">Problemas</h2>
      <span class="count" [class.count--zero]="diagnostics().length === 0">
        {{ diagnostics().length }}
      </span>
    </header>

    <div class="list" role="log" aria-live="polite">
      @for (problem of diagnostics(); track $index) {
        <p class="item" [class]="'item--' + problem.severity">
          <span class="badge">{{ problem.severity }}</span>
          <span class="where">{{ fileName(problem) }}:{{ problem.line }}</span>
          <span class="message">{{ problem.message }}</span>
        </p>
      } @empty {
        <p class="item item--ok">Nenhum problema. O seu código está rodando.</p>
      }

      @if (hint(); as text) {
        <p class="item item--hint">
          <span class="badge">dica</span>
          <span class="message">{{ text }}</span>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      max-block-size: 30%;
      background: var(--surface-panel);
      border-block-start: 1px solid var(--border-soft);
      font-size: 0.8125rem;
    }

    .head {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-block-end: 1px solid var(--border-soft);
    }

    .tab {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-primary);
    }

    .count {
      min-inline-size: 1.25rem;
      padding-inline: 0.4rem;
      border-radius: 999px;
      background: var(--state-error);
      color: #1e1e1e;
      font-weight: 600;
      text-align: center;
    }

    .count--zero {
      background: var(--border-strong);
      color: var(--text-muted);
    }

    .list {
      overflow-y: auto;
      padding: var(--space-2) var(--space-4) var(--space-3);
    }

    .item {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-2);
      margin: 0;
      padding-block: var(--space-1);
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .badge {
      text-transform: uppercase;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
    }

    .item--erro .badge {
      color: var(--state-error);
    }

    .item--aviso .badge {
      color: var(--state-warning);
    }

    .item--hint .badge {
      color: var(--state-hint);
    }

    .item--ok {
      color: var(--state-success);
    }

    .where {
      color: var(--text-dim);
    }

    .message {
      color: var(--text-primary);
      font-family: var(--font-ui);
    }
  `,
})
export class ProblemsPanel {
  readonly diagnostics = input.required<readonly Diagnostic[]>();
  readonly hint = input<string | null>(null);

  protected fileName(problem: Diagnostic): string {
    return SOURCE_FILES.find((file) => file.id === problem.file)?.name ?? problem.file;
  }
}
