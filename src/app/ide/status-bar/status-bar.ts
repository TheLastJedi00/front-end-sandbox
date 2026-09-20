import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'status-bar' },
  template: `
    <span class="segment">{{ branch() }}</span>
    <span class="spacer"></span>
    <span class="segment"><ng-content /></span>
    <span class="segment">{{ language() }}</span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding-inline: var(--space-4);
      block-size: 1.75rem;
      background: var(--surface-status);
      color: var(--text-inverse);
      font-size: 0.75rem;
    }

    .spacer {
      flex: 1;
    }
  `,
})
export class StatusBar {
  readonly branch = input('feat/MVP');
  readonly language = input('HTML');
}
