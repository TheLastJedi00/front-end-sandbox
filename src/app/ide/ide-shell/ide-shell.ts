import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Layout da IDE: codigo a esquerda, preview a direita.
 * Duas colunas fixas em telas largas (o caso da apresentacao, num projetor 16:9)
 * e empilhadas abaixo de 900px, para funcionar tambem num tablet.
 */
@Component({
  selector: 'app-ide-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <ng-content select="[ideTitleBar]" />
      <div class="body">
        <ng-content select="[ideActivityBar]" />
        <section class="code" aria-label="Editor de código">
          <ng-content select="[ideCode]" />
        </section>
        <section class="preview" aria-label="Resultado">
          <ng-content select="[idePreview]" />
        </section>
      </div>
      <ng-content select="[ideStatusBar]" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      block-size: 100dvh;
    }

    .shell {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      block-size: 100%;
      background: var(--surface-app);
    }

    .body {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
      min-block-size: 0;
    }

    .code,
    .preview {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
      min-block-size: 0;
    }

    .code {
      border-inline-end: 1px solid var(--border-soft);
      background: var(--surface-editor);
    }

    .preview {
      background: var(--surface-panel);
    }

    @media (max-inline-size: 900px) {
      :host {
        block-size: auto;
      }

      .body {
        grid-template-columns: minmax(0, 1fr);
      }

      .code {
        border-inline-end: none;
        border-block-end: 1px solid var(--border-soft);
      }
    }
  `,
})
export class IdeShell {}
