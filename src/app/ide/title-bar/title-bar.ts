import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Barra superior da janela. Decorativa, exceto pelo titulo da fase. */
@Component({
  selector: 'app-title-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'title-bar' },
  template: `
    <span class="dots" aria-hidden="true">
      <i class="dot dot--close"></i>
      <i class="dot dot--min"></i>
      <i class="dot dot--max"></i>
    </span>
    <span class="label">{{ label() }}</span>
    <span class="actions"><ng-content /></span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding-inline: var(--space-4);
      block-size: 2.25rem;
      background: var(--surface-title);
      border-block-end: 1px solid var(--border-soft);
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .dots {
      display: flex;
      gap: 0.4rem;
    }

    .dot {
      inline-size: 0.7rem;
      block-size: 0.7rem;
      border-radius: 50%;
    }

    .dot--close {
      background: #ff5f57;
    }
    .dot--min {
      background: #febc2e;
    }
    .dot--max {
      background: #28c840;
    }

    .label {
      flex: 1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
  `,
})
export class TitleBar {
  readonly label = input('sandbox-front-end — Visual Studio Code');
}
