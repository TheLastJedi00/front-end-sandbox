import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CodeAnatomy } from '../code-anatomy/code-anatomy';
import { CodeListing } from '../code-listing/code-listing';
import { SlideDefinition } from '../slide-definitions';

/**
 * Um slide. A entrada e animada em CSS puro para nao custar nada em tempo de
 * execucao, e os tamanhos usam `clamp` porque a mesma tela vai de um tablet a
 * um projetor 16:9.
 */
@Component({
  selector: 'app-slide',
  imports: [CodeListing, CodeAnatomy],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'slide', '[attr.data-slide]': 'slide().id' },
  template: `
    <!-- Cada bloco entra depois do anterior: --i e a ordem de entrada. -->
    <article class="body" [style.--accent]="accent()">
      @if (slide().eyebrow) {
        <p class="eyebrow enter" style="--i: 0">{{ slide().eyebrow }}</p>
      }
      <h1 class="title" [attr.aria-label]="slide().title">
        @for (word of titleWords(); track $index) {
          <span class="word" aria-hidden="true" [style.--w]="$index">{{ word }} </span>
        }
      </h1>

      @if (slide().lead) {
        <p class="lead enter" style="--i: 2">{{ slide().lead }}</p>
      }

      @if (slide().points; as points) {
        <ul class="points">
          <!-- Os pontos esperam o apresentador: um por etapa. O espaco deles ja
               fica reservado para o slide nao pular quando o proximo aparece. -->
          @for (point of points; track point.label; let j = $index) {
            <li
              class="point"
              [class.point--shown]="j < step()"
              [attr.aria-hidden]="j < step() ? null : 'true'"
              [style.--accent]="point.accent ?? accent()"
            >
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
        <app-code-listing
          class="enter"
          [style.--i]="codeOrder"
          [code]="code"
          [startDelay]="codeDelay"
        />
      }

      @if (slide().anatomy; as anatomy) {
        <app-code-anatomy
          class="enter"
          [style.--i]="codeOrder"
          [anatomy]="anatomy"
          [step]="anatomyStep()"
        />
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
    }

    /* Os blocos esperam a transicao do slide comecar e entram em cascata. */
    .enter {
      animation: rise 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--entry-base) + var(--i, 0) * var(--entry-gap));
    }

    :host {
      --entry-base: 120ms;
      --entry-gap: 110ms;
    }

    .word {
      display: inline-block;
      white-space: pre;
      animation: word-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--entry-base) + var(--entry-gap) + var(--w) * 60ms);
    }

    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(1.5rem);
        filter: blur(4px);
      }
    }

    @keyframes word-in {
      from {
        opacity: 0;
        transform: translateY(0.6em) rotateX(-60deg);
        filter: blur(6px);
      }
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
      perspective: 40rem;
    }

    /* O gradiente fica em cada palavra: com transform nos filhos, o
       background-clip do titulo inteiro nao acompanharia o movimento. */
    .word {
      background: linear-gradient(120deg, var(--text-inverse) 30%, var(--accent) 180%);
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
      opacity: 0;
      visibility: hidden;
    }

    .point--shown {
      opacity: 1;
      visibility: visible;
      animation: pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      box-shadow: 0 1rem 2.5rem -1.5rem var(--accent);
    }

    @keyframes pop {
      from {
        opacity: 0;
        transform: translateY(1rem) scale(0.9);
        filter: blur(4px);
      }
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

    .inline-code {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--surface-editor);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }
  `,
})
export class Slide {
  readonly slide = input.required<SlideDefinition>();
  /** Quantas etapas ja foram reveladas (ver `deck-navigation`). */
  readonly step = input(0);

  protected readonly accent = computed(() => this.slide().accent ?? 'var(--state-hint)');
  protected readonly titleWords = computed(() => this.slide().title.split(' '));
  /** As etapas da anatomia vem depois das dos pontos. */
  protected readonly anatomyStep = computed(() =>
    Math.max(0, this.step() - (this.slide().points?.length ?? 0)),
  );

  /** O codigo entra logo depois do texto; os pontos esperam as etapas. */
  protected readonly codeOrder = 3;
  /** A digitacao comeca quando a janela do codigo ja terminou de subir. */
  protected readonly codeDelay = 120 + this.codeOrder * 110 + 280;
}
