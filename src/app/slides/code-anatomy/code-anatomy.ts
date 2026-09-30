import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SlideAnatomy } from '../slide-definitions';
import { anatomyLines } from './anatomy';

/**
 * Codigo desmontado. O codigo inteiro fica na tela o tempo todo; a cada etapa
 * uma parte acende com o nome dela, o resto apaga um pouco, e a explicacao
 * aparece embaixo. As partes ja explicadas ficam sublinhadas na cor do slide.
 */
@Component({
  selector: 'app-code-anatomy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'code-anatomy', '[class.has-focus]': 'current() !== null' },
  template: `
    <figure class="window">
      <figcaption class="chrome">
        <span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>
        @if (anatomy().caption) {
          <span class="caption">{{ anatomy().caption }}</span>
        }
      </figcaption>

      <pre class="listing"><code>@for (line of lines(); track $index; let n = $index) {<span
        class="line" [style.--n]="n"><span class="number" aria-hidden="true">{{ n + 1 }}</span><span
        class="text">@for (segment of line; track $index) {@if (segment.part === undefined) {@for (token of segment.tokens; track $index) {<span [attr.class]="'tk--' + token.kind">{{ token.text }}</span>}} @else {<span
          class="part"
          [class.part--current]="segment.part === current()"
          [class.part--past]="isPast(segment.part)"
          >@for (token of segment.tokens; track $index) {<span [attr.class]="'tk--' + token.kind">{{ token.text }}</span>}@if (segment.part === current()) {<span class="tag" aria-hidden="true">{{ anatomy().parts[segment.part].label }}</span>}</span>}}</span></span>}</code></pre>
    </figure>

    <!-- A explicacao da parte da vez. Anunciada para quem usa leitor de tela. -->
    <div class="note" aria-live="polite">
      @if (currentPart(); as part) {
        <p class="note-body">
          <span class="note-label">{{ part.label }}</span>
          <span class="note-sample">{{ part.text }}</span>
          <span class="note-text">{{ part.note }}</span>
        </p>
      } @else {
        <p class="note-body note-body--hint">
          <span class="note-text">Avance para desmontar o código, parte por parte.</span>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
      inline-size: 100%;
    }

    .window {
      margin: 0;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--surface-editor) 92%, transparent);
      box-shadow: 0 1.5rem 3rem -1.5rem color-mix(in srgb, var(--accent) 45%, transparent);
      overflow: hidden;
    }

    .chrome {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      border-block-end: 1px solid var(--border-soft);
      background: var(--surface-bar);
    }

    .lights {
      display: flex;
      gap: 0.375rem;
    }

    .lights i {
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border-radius: 50%;
      background: var(--border-strong);
    }

    .lights i:first-child {
      background: var(--accent);
    }

    .caption {
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .listing {
      margin: 0;
      /* Espaco embaixo de cada linha para o rotulo da parte da vez. */
      padding: var(--space-4) var(--space-4) var(--space-6) 0;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: clamp(1rem, 2vw, 1.625rem);
      line-height: 2.6;
      overflow-x: auto;
    }

    .line {
      display: flex;
      animation: line-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(420ms + var(--n) * 80ms);
    }

    .number {
      flex: none;
      inline-size: 3ch;
      margin-inline-end: 2ch;
      color: var(--text-dim);
      text-align: end;
      user-select: none;
    }

    .text {
      white-space: pre;
      transition: opacity 300ms ease;
    }

    /* Com uma parte acesa, o resto do codigo recua. */
    :host(.has-focus) .text {
      opacity: 0.45;
    }

    .part {
      position: relative;
      display: inline-block;
      border-radius: var(--radius-sm);
      line-height: 1.3;
      transition:
        background-color 300ms ease,
        box-shadow 300ms ease,
        transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .part--past {
      box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--accent) 70%, transparent);
    }

    /* A parte da vez volta a opacidade cheia mesmo dentro da linha apagada. */
    :host(.has-focus) .text:has(.part--current) {
      opacity: 1;
    }

    :host(.has-focus) .text:has(.part--current) > :not(.part--current) {
      opacity: 0.45;
    }

    .part--current {
      z-index: 1;
      background: color-mix(in srgb, var(--accent) 22%, transparent);
      box-shadow:
        0 0 0 2px var(--accent),
        0 0 1.5rem color-mix(in srgb, var(--accent) 55%, transparent);
      transform: scale(1.08);
      animation: glow 1.6s ease-in-out infinite alternate;
    }

    .tag {
      position: absolute;
      inset-block-start: calc(100% + 0.5rem);
      inset-inline-start: 50%;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      background: var(--accent);
      color: #111;
      font-family: var(--font-ui);
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.4;
      white-space: nowrap;
      transform: translateX(-50%);
      animation: tag-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* A setinha que liga o rotulo ao trecho. */
    .tag::before {
      content: '';
      position: absolute;
      inset-block-end: 100%;
      inset-inline-start: 50%;
      border: 0.3rem solid transparent;
      border-block-end-color: var(--accent);
      transform: translateX(-50%);
    }

    .note {
      min-block-size: 3.5rem;
    }

    .note-body {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-2) var(--space-3);
      margin: 0;
      padding: var(--space-3) var(--space-4);
      border-inline-start: 3px solid var(--accent);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--surface-panel) 85%, transparent);
      font-size: clamp(1rem, 1.6vw, 1.25rem);
      animation: note-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .note-body--hint {
      border-inline-start-color: var(--border-strong);
      color: var(--text-muted);
    }

    .note-label {
      color: var(--accent);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.8125em;
    }

    .note-sample {
      padding: 0 0.375rem;
      border-radius: var(--radius-sm);
      background: var(--surface-editor);
      font-family: var(--font-mono);
    }

    @keyframes line-in {
      from {
        opacity: 0;
        transform: translateX(-1rem);
      }
    }

    @keyframes glow {
      to {
        box-shadow:
          0 0 0 2px var(--accent),
          0 0 2.5rem color-mix(in srgb, var(--accent) 75%, transparent);
      }
    }

    @keyframes tag-in {
      from {
        opacity: 0;
        transform: translate(-50%, -0.5rem) scale(0.7);
      }
    }

    @keyframes note-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }
  `,
})
export class CodeAnatomy {
  readonly anatomy = input.required<SlideAnatomy>();
  /** Quantas partes ja foram explicadas; a ultima delas e a da vez. */
  readonly step = input(0);

  protected readonly lines = computed(() => anatomyLines(this.anatomy()));
  protected readonly current = computed(() => (this.step() > 0 ? this.step() - 1 : null));
  protected readonly currentPart = computed(() => {
    const index = this.current();
    return index === null ? null : this.anatomy().parts[index];
  });

  protected isPast(part: number): boolean {
    return part < this.step() - 1;
  }
}
