import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SlideDefinition } from '../slide-definitions';

/**
 * Um slide. A entrada e animada em CSS puro para nao custar nada em tempo de
 * execucao, e os tamanhos usam `clamp` porque a mesma tela vai de um tablet a
 * um projetor 16:9.
 */
@Component({
  selector: 'app-slide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'slide', '[attr.data-slide]': 'slide().id' },
  template: `
    <article class="body" [style.--accent]="accent()">
      @if (slide().eyebrow) {
        <p class="eyebrow">{{ slide().eyebrow }}</p>
      }
      <h1 class="title">{{ slide().title }}</h1>

      @if (slide().lead) {
        <p class="lead">{{ slide().lead }}</p>
      }

      @if (slide().points; as points) {
        <ul class="points">
          @for (point of points; track point.label) {
            <li class="point" [style.--accent]="point.accent ?? accent()">
              <span class="label">{{ point.label }}</span>
              <strong class="text">{{ point.text }}</strong>
              @if (point.code) {
                <code class="inline-code">{{ point.code }}</code>
              }
            </li>
          }
        </ul>
      }

      @if (slide().code; as code) {
        <figure class="code">
          @if (code.caption) {
            <figcaption class="caption">{{ code.caption }}</figcaption>
          }
          <pre class="listing"><code>@for (line of code.lines; track $index) {{{ line }}
}</code></pre>
        </figure>
      }
    </article>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-block-size: 0;
      padding: var(--space-6) var(--space-4);
      overflow: auto;
    }

    .body {
      display: grid;
      justify-items: start;
      gap: var(--space-4);
      inline-size: 100%;
      max-inline-size: 56rem;
      animation: slide-in 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .eyebrow {
      margin: 0;
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.875rem;
      letter-spacing: 0.08em;
      text-transform: lowercase;
    }

    .title {
      margin: 0;
      font-size: clamp(1.75rem, 4.5vw, 3rem);
      font-weight: 600;
      line-height: 1.1;
      letter-spacing: -0.02em;
      background: linear-gradient(120deg, var(--text-inverse), var(--accent) 140%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .lead {
      max-inline-size: 44rem;
      margin: 0;
      color: var(--text-muted);
      font-size: clamp(1rem, 1.6vw, 1.25rem);
      line-height: 1.6;
    }

    .points {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: var(--space-4);
      inline-size: 100%;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .point {
      display: grid;
      align-content: start;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px solid var(--border-soft);
      border-block-start: 3px solid var(--accent);
      border-radius: var(--radius-lg);
      background: var(--surface-panel);
    }

    .label {
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .text {
      font-size: 1.0625rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .inline-code,
    .listing {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--surface-editor);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .code {
      inline-size: 100%;
      margin: 0;
    }

    .caption {
      margin-block-end: var(--space-2);
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .listing {
      margin: 0;
      padding: var(--space-4);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      font-size: clamp(0.875rem, 1.4vw, 1.125rem);
      line-height: var(--line-code);
      overflow-x: auto;
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(1.25rem);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class Slide {
  readonly slide = input.required<SlideDefinition>();

  protected readonly accent = computed(() => this.slide().accent ?? 'var(--state-hint)');
}
