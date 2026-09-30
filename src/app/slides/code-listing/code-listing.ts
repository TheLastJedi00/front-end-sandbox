import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { highlightLines, Token } from '../../ide/code-editor/highlight';
import { SlideCode } from '../slide-definitions';

/** Tempo de "digitacao" de cada caractere, em ms. */
const MS_PER_CHAR = 22;
/** Uma linha longa nao pode segurar a turma esperando. */
const MAX_LINE_MS = 520;
/** Pausa entre uma linha e a seguinte, como quem aperta Enter. */
const LINE_GAP_MS = 90;

interface ListingLine {
  readonly tokens: readonly Token[];
  readonly chars: number;
  readonly delay: number;
  readonly duration: number;
}

/**
 * Bloco de codigo dos slides, com o mesmo realce da IDE. As linhas aparecem
 * uma depois da outra, como se alguem estivesse digitando — o aluno le o
 * codigo no ritmo em que ele seria escrito.
 */
@Component({
  selector: 'app-code-listing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'code-listing' },
  template: `
    <figure class="window">
      <figcaption class="chrome">
        <span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>
        @if (code().caption) {
          <span class="caption">{{ code().caption }}</span>
        }
      </figcaption>
      <pre class="listing"><code>@for (line of lines(); track $index; let n = $index) {<span
        class="line"
        [style.--chars]="line.chars"
        [style.--delay.ms]="line.delay"
        [style.--duration.ms]="line.duration"><span class="number" aria-hidden="true">{{ n + 1 }}</span><span
        class="text">@for (token of line.tokens; track $index) {<span [attr.class]="'tk--' + token.kind">{{ token.text }}</span>}</span></span>}<span class="caret" aria-hidden="true" [style.--delay.ms]="endsAt()"></span></code></pre>
    </figure>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .window {
      margin: 0;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--surface-editor) 92%, transparent);
      box-shadow:
        0 1.5rem 3rem -1.5rem color-mix(in srgb, var(--accent, #000) 45%, transparent),
        0 0 0 1px color-mix(in srgb, var(--accent, transparent) 18%, transparent);
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
      background: var(--accent, var(--border-strong));
    }

    .caption {
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .listing {
      margin: 0;
      padding: var(--space-4) var(--space-4) var(--space-4) 0;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: clamp(0.875rem, 1.5vw, 1.25rem);
      line-height: var(--line-code);
      overflow-x: auto;
    }

    /* Cada linha e um bloco: o <pre> nao precisa de quebras de texto entre elas. */
    .line {
      display: flex;
      min-block-size: calc(1em * var(--line-code));
    }

    .number {
      flex: none;
      inline-size: 3ch;
      margin-inline-end: 2ch;
      color: var(--text-dim);
      text-align: end;
      user-select: none;
      animation: fade 200ms ease-out both;
      animation-delay: var(--delay);
    }

    .text {
      white-space: pre;
      /* A linha "e digitada": o recorte abre da esquerda para a direita em
         degraus, um por caractere. */
      animation: type var(--duration) steps(var(--chars), end) both;
      animation-delay: var(--delay);
    }

    .caret {
      display: inline-block;
      inline-size: 0.6ch;
      block-size: 1.1em;
      margin-inline-start: 5ch;
      vertical-align: text-bottom;
      background: var(--accent, var(--focus-ring));
      animation:
        fade 1ms linear both,
        blink 1s steps(1) infinite;
      animation-delay: var(--delay), var(--delay);
    }

    @keyframes type {
      from {
        clip-path: inset(0 100% 0 0);
      }
      to {
        clip-path: inset(0 0 0 0);
      }
    }

    @keyframes fade {
      from {
        opacity: 0;
      }
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
  `,
})
export class CodeListing {
  readonly code = input.required<SlideCode>();
  /** Quando a digitacao comeca, em ms — para esperar o titulo entrar. */
  readonly startDelay = input(0);

  protected readonly lines = computed<readonly ListingLine[]>(() => {
    const { lines, language } = this.code();
    const source = lines.join('\n');
    const tokenized = language
      ? highlightLines(source, language)
      : lines.map((text): Token[] => (text ? [{ text, kind: 'plain' }] : []));

    let clock = this.startDelay();
    return tokenized.map((tokens, i) => {
      const chars = Math.max(1, lines[i].length);
      const duration = Math.min(MAX_LINE_MS, chars * MS_PER_CHAR);
      const line = { tokens, chars, delay: clock, duration };
      clock += duration + LINE_GAP_MS;
      return line;
    });
  });

  /** O cursor so aparece piscando quando a ultima linha termina. */
  protected readonly endsAt = computed(() => {
    const last = this.lines().at(-1);
    return last ? last.delay + last.duration : this.startDelay();
  });
}
