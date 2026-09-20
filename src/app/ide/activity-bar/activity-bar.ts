import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Coluna de icones da esquerda. E puramente cenografica — existe para a tela
 * parecer um editor de verdade — e por isso fica escondida de leitores de tela.
 */
@Component({
  selector: 'app-activity-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'activity-bar', 'aria-hidden': 'true' },
  template: `
    @for (icon of icons; track icon.name) {
      <span class="icon" [class.icon--active]="icon.active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
             stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path [attr.d]="icon.path" />
        </svg>
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding-block: var(--space-4);
      inline-size: 3.25rem;
      background: var(--surface-activity);
      border-inline-end: 1px solid var(--border-soft);
      color: var(--text-dim);
    }

    .icon--active {
      color: var(--text-primary);
    }

    @media (max-inline-size: 900px) {
      :host {
        display: none;
      }
    }
  `,
})
export class ActivityBar {
  protected readonly icons = [
    { name: 'arquivos', active: true, path: 'M4 4h6l2 2h8v12H4z' },
    { name: 'busca', active: false, path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.5-4.5' },
    { name: 'controle-de-versao', active: false, path: 'M7 4v12m0 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 0v2a4 4 0 0 1-4 4H9' },
    { name: 'executar', active: false, path: 'M8 5l10 7-10 7z' },
    { name: 'extensoes', active: false, path: 'M4 4h7v7H4zm9 9h7v7h-7zM4 13h7v7H4zm9-9h7v7h-7z' },
  ];
}
