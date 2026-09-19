import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SourceFile, SourceFileId } from '../../core/models';

/** Abas de arquivo. Cada fase habilita apenas os arquivos que ja fazem sentido. */
@Component({
  selector: 'app-file-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'file-tabs', role: 'tablist', 'aria-label': 'Arquivos' },
  template: `
    @for (file of files(); track file.id) {
      <button
        type="button"
        role="tab"
        class="tab"
        [class.tab--active]="file.id === active()"
        [attr.aria-selected]="file.id === active()"
        [attr.tabindex]="file.id === active() ? 0 : -1"
        (click)="select.emit(file.id)"
      >
        <span class="dot" [class]="'dot--' + file.id" aria-hidden="true"></span>
        {{ file.name }}
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      background: var(--surface-bar);
      border-block-end: 1px solid var(--border-soft);
      overflow-x: auto;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: none;
      border-inline-end: 1px solid var(--border-soft);
      border-block-start: 2px solid transparent;
      background: transparent;
      color: var(--text-dim);
      font-family: var(--font-ui);
      font-size: 0.8125rem;
      white-space: nowrap;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab--active {
      background: var(--surface-editor);
      border-block-start-color: var(--surface-status);
      color: var(--text-primary);
    }

    .dot {
      inline-size: 0.55rem;
      block-size: 0.55rem;
      border-radius: 2px;
    }

    .dot--html {
      background: #e34f26;
    }
    .dot--css {
      background: #2965f1;
    }
    .dot--js {
      background: #f0db4f;
    }
  `,
})
export class FileTabs {
  readonly files = input.required<readonly SourceFile[]>();
  readonly active = input.required<SourceFileId>();
  readonly select = output<SourceFileId>();
}
