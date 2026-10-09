import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { injectIsBrowser } from '../../core/platform/browser';
import {
  advance,
  advanceWhole,
  clampPosition,
  completed,
  DECK_START,
  DeckPosition,
  retreat,
  retreatWhole,
  stepsOf,
} from '../deck-navigation';
import { SlideDefinition } from '../slide-definitions';
import { PaceBar } from '../pace-bar/pace-bar';
import { Slide } from '../slide/slide';

/** Distancia minima, em pixels, para um arrasto contar como troca de slide. */
const SWIPE_MIN = 48;

/**
 * Casca do deck: navegacao, progresso e a saida para o jogo.
 *
 * Teclado e toque funcionam juntos porque as duas coisas acontecem — a aula e
 * projetada de um notebook, mas os alunos acompanham em tablets.
 *
 * Na aula ao vivo o deck e controlado de fora: a posicao chega por `synced` e
 * cada movimento do apresentador sai por `moved`. Com `followOnly`, a maquina
 * so assiste — sem botoes, teclado, toque ou swipe. Com `showPace`, uma regua
 * no rodape mede o tempo no slide contra a meta (so na tela de quem conduz).
 */
@Component({
  selector: 'app-slide-deck',
  imports: [Slide, PaceBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slide-deck',
    '(document:keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '[style.--deck-accent]': 'current().accent ?? null',
  },
  template: `
    <div class="ambient" aria-hidden="true">
      <span class="glow glow--a"></span>
      <span class="glow glow--b"></span>
      <span class="grid"></span>
    </div>

    <!-- Rastrear pelo id recria o slide a cada troca: a entrada roda de novo, e
         o slide que sai continua na tela ate terminar a animacao de saida. -->
    <div class="stage" [attr.data-direction]="direction()" (click)="onStageClick($event)">
      @for (slide of shown(); track slide.id) {
        <app-slide
          [slide]="slide"
          [step]="position().step"
          animate.enter="slide-enter"
          animate.leave="slide-leave"
        />
      }
    </div>

    <footer class="controls">
      @if (showPace()) {
        <app-pace-bar [slide]="index()" />
      }
      @if (!followOnly()) {
        <button
          class="nav"
          type="button"
          [disabled]="isFirst() && !canGoBack()"
          (click)="previous()"
        >
          <span aria-hidden="true">←</span> Voltar
        </button>
      }

      <ol class="dots" [attr.aria-label]="'Slide ' + (index() + 1) + ' de ' + total()">
        @for (slide of slides(); track slide.id; let i = $index) {
          <li>
            <!-- O ponto do slide atual vira uma barrinha que enche a cada etapa. -->
            <button
              class="dot"
              type="button"
              [class.dot--active]="i === index()"
              [style.--fill.%]="i === index() ? stepProgress() : null"
              [attr.aria-label]="'Ir para o slide ' + (i + 1)"
              [attr.aria-current]="i === index() ? 'true' : null"
              [disabled]="followOnly()"
              (click)="go(i)"
            ></button>
          </li>
        }
      </ol>

      <!-- Um botao so, com o texto trocando: o foco nao se perde no ultimo slide. -->
      @if (followOnly()) {
        <p class="following">Acompanhando o professor</p>
      } @else {
        <button class="nav nav--primary" type="button" (click)="next()">
          {{ atEnd() ? finishLabel() : 'Avançar' }} <span aria-hidden="true">→</span>
        </button>
      }
    </footer>

    @if (!followOnly()) {
      <button class="skip" type="button" (click)="finish.emit()">{{ skipLabel() }}</button>
    }

    <!-- Titulo ao trocar de slide; cada ponto quando ele aparece. As partes da
         anatomia tem o seu proprio anuncio, dentro do componente. -->
    <p class="live" aria-live="polite">{{ announcement() }}</p>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-rows: 1fr auto;
      min-block-size: 100%;
      touch-action: pan-y;
      transition: --deck-accent 900ms ease;
    }

    /* Fundo vivo, na cor da linguagem do slide. Fica atras de tudo e nunca
       recebe clique. */
    .ambient {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .glow {
      position: absolute;
      inline-size: 55vmax;
      block-size: 55vmax;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--deck-accent) 38%, transparent) 0%,
        transparent 65%
      );
      filter: blur(20px);
    }

    .glow--a {
      inset-block-start: -30vmax;
      inset-inline-start: -15vmax;
      animation: drift-a 18s ease-in-out infinite alternate;
    }

    .glow--b {
      inset-block-end: -35vmax;
      inset-inline-end: -20vmax;
      opacity: 0.7;
      animation: drift-b 22s ease-in-out infinite alternate;
    }

    /* Uma grade discreta, como papel quadriculado de quem esta projetando. */
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(color-mix(in srgb, var(--deck-accent) 11%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--deck-accent) 11%, transparent) 1px, transparent 1px);
      background-size: 3rem 3rem;
      mask-image: radial-gradient(ellipse at 50% 40%, #000 0%, transparent 70%);
      animation: grid-pan 30s linear infinite;
    }

    @keyframes drift-a {
      to {
        transform: translate(12vmax, 8vmax) scale(1.15);
      }
    }

    @keyframes drift-b {
      to {
        transform: translate(-10vmax, -6vmax) scale(0.9);
      }
    }

    @keyframes grid-pan {
      to {
        background-position: 3rem 3rem;
      }
    }

    .stage,
    .controls,
    .skip {
      z-index: 1;
    }

    .stage {
      position: relative;
      display: grid;
      min-block-size: 0;
      perspective: 1200px;
      overflow: hidden;
    }

    /* O slide que sai e o que entra ocupam a mesma celula durante a troca. */
    .stage > app-slide {
      grid-area: 1 / 1;
    }

    .slide-enter {
      animation: enter-from-right 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .slide-leave {
      pointer-events: none;
      animation: leave-to-left 320ms cubic-bezier(0.7, 0, 0.84, 0) both;
    }

    .stage[data-direction='backward'] .slide-enter {
      animation-name: enter-from-left;
    }

    .stage[data-direction='backward'] .slide-leave {
      animation-name: leave-to-right;
    }

    @keyframes enter-from-right {
      from {
        opacity: 0;
        transform: translateX(8%) rotateY(-10deg) scale(0.96);
        filter: blur(8px);
      }
    }

    @keyframes enter-from-left {
      from {
        opacity: 0;
        transform: translateX(-8%) rotateY(10deg) scale(0.96);
        filter: blur(8px);
      }
    }

    @keyframes leave-to-left {
      to {
        opacity: 0;
        transform: translateX(-8%) rotateY(10deg) scale(0.96);
        filter: blur(8px);
      }
    }

    @keyframes leave-to-right {
      to {
        opacity: 0;
        transform: translateX(8%) rotateY(-10deg) scale(0.96);
        filter: blur(8px);
      }
    }

    .controls {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      border-block-start: 1px solid var(--border-soft);
      background: var(--surface-panel);
    }

    .nav {
      padding: var(--space-3) var(--space-6);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      font-weight: 600;
    }

    .nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .nav--primary {
      border-color: transparent;
      background: var(--surface-status);
      color: var(--text-inverse);
    }

    .dots {
      display: flex;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .dot {
      inline-size: 0.75rem;
      block-size: 0.75rem;
      padding: 0;
      border: 1px solid var(--border-strong);
      border-radius: 50%;
      background: transparent;
    }

    .dot {
      transition:
        inline-size 300ms cubic-bezier(0.16, 1, 0.3, 1),
        border-radius 300ms;
    }

    .dot--active {
      inline-size: 2.5rem;
      border-color: color-mix(in srgb, var(--deck-accent) 60%, transparent);
      border-radius: 999px;
      background: linear-gradient(
          90deg,
          var(--deck-accent) var(--fill, 100%),
          transparent var(--fill, 100%)
        )
        no-repeat;
    }

    .skip {
      position: absolute;
      inset-block-start: var(--space-4);
      inset-inline-end: var(--space-4);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .dot:disabled {
      cursor: default;
    }

    .following {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .live {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
    }

    @media (max-width: 600px) {
      .nav {
        padding: var(--space-3) var(--space-4);
      }
    }
  `,
})
export class SlideDeck {
  readonly slides = input.required<readonly SlideDefinition[]>();
  /** Texto do botao que encerra o deck. */
  readonly finishLabel = input('Começar');
  readonly skipLabel = input('Pular apresentação');

  /** Posicao vinda da sessao ao vivo; `null` quando o deck anda sozinho. */
  readonly synced = input<DeckPosition | null>(null);
  /** So assiste: a posicao vem de `synced` e nada aqui a muda. */
  readonly followOnly = input(false);
  /** Mostra a regua de ritmo (tempo no slide contra a meta). */
  readonly showPace = input(false);
  /** Ha um passo da aula antes deste deck: o "Voltar" do comeco leva ate ele. */
  readonly canGoBack = input(false);

  /** O deck acabou — por ter chegado ao fim ou por ter sido pulado. */
  readonly finish = output<void>();
  /** Cada movimento feito aqui, para o apresentador gravar na sessao. */
  readonly moved = output<DeckPosition>();
  /** "Voltar" no comeco do deck, com `canGoBack`: sair para o passo anterior. */
  readonly back = output<void>();

  /**
   * Quem pediu menos movimento ao sistema ve cada slide ja completo: revelar
   * pedaco por pedaco so faz sentido com a animacao que acompanha.
   */
  private readonly reducedMotion =
    injectIsBrowser() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Slide atual e quantas etapas dele ja apareceram. */
  protected readonly position = linkedSignal<DeckPosition>(() => {
    const slides = this.slides();
    const synced = this.synced();
    if (synced) {
      const position = clampPosition(slides, synced);
      return this.reducedMotion ? completed(slides, position.slide) : position;
    }
    return this.reducedMotion ? completed(slides, 0) : DECK_START;
  });
  protected readonly index = computed(() => this.position().slide);
  protected readonly total = computed(() => this.slides().length);
  protected readonly current = computed(() => this.slides()[this.index()]);
  protected readonly isFirst = computed(
    () => this.position().slide === 0 && this.position().step === 0,
  );
  /** Nao ha mais etapa nem slide: o proximo "Avancar" encerra o deck. */
  protected readonly atEnd = computed(() => advance(this.slides(), this.position()) === null);
  /** Quanto do slide atual ja foi revelado, de 0 a 100. */
  protected readonly stepProgress = computed(() => {
    const steps = stepsOf(this.current());
    return steps === 0 ? 100 : (this.position().step / steps) * 100;
  });
  /** O que o leitor de tela diz depois de cada avanco. */
  protected readonly announcement = computed(() => {
    const { step } = this.position();
    const slide = this.current();
    if (step === 0) return slide.title;

    const point = slide.points?.[step - 1];
    // Passados os pontos, as etapas sao da anatomia, que se anuncia sozinha.
    return point ? `${point.label}: ${point.text}` : '';
  });
  /** Lista de um item so: e o `track` dela que recria o slide a cada troca. */
  protected readonly shown = computed(() => [this.current()]);
  /**
   * Para onde a apresentacao andou por ultimo — decide o lado da transicao.
   * Vem da propria posicao, entao vale tambem para o que chega pela sessao.
   */
  protected readonly direction = linkedSignal<DeckPosition, 'forward' | 'backward'>({
    source: this.position,
    computation: (position, previous) => {
      if (!previous || position.slide === previous.source.slide) {
        return previous?.value ?? 'forward';
      }
      return position.slide > previous.source.slide ? 'forward' : 'backward';
    },
  });

  private pointerStartX: number | null = null;
  /** Um arrasto ja trocou o slide; o `click` que vem depois dele nao conta. */
  private swiped = false;

  next(): void {
    const step = this.reducedMotion ? advanceWhole : advance;
    const target = step(this.slides(), this.position());
    if (target === null) {
      this.finish.emit();
      return;
    }
    this.moveTo(target);
  }

  previous(): void {
    const step = this.reducedMotion ? retreatWhole : retreat;
    const position = this.position();
    const target = step(this.slides(), position);
    // Do comeco do deck nao ha para onde voltar aqui dentro: o passo anterior
    // e de fora (o codigo da fase anterior, ou a abertura).
    if (target.slide === position.slide && target.step === position.step) {
      if (this.canGoBack() && !this.followOnly()) this.back.emit();
      return;
    }
    this.moveTo(target);
  }

  go(index: number): void {
    const slide = Math.min(Math.max(index, 0), this.total() - 1);
    if (slide === this.index()) return;

    this.moveTo(this.reducedMotion ? completed(this.slides(), slide) : { slide, step: 0 });
  }

  private moveTo(target: DeckPosition): void {
    if (this.followOnly()) return;
    this.position.set(target);
    this.moved.emit(target);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.followOnly()) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        event.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        this.previous();
        break;
      case 'Escape':
        event.preventDefault();
        this.finish.emit();
        break;
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.followOnly()) return;
    this.swiped = false;
    this.pointerStartX = event.pointerType === 'touch' ? event.clientX : null;
  }

  protected onPointerUp(event: PointerEvent): void {
    const start = this.pointerStartX;
    this.pointerStartX = null;
    if (start === null) return;

    const delta = event.clientX - start;
    if (Math.abs(delta) < SWIPE_MIN) return;

    this.swiped = true;
    if (delta < 0) this.next();
    else this.previous();
  }

  /**
   * No tablet o gesto natural tambem e tocar a metade direita da tela. Sao os
   * botoes que continuam sendo o caminho obvio; isto e um atalho.
   */
  protected onStageClick(event: MouseEvent): void {
    if (this.followOnly()) return;
    if (this.swiped) {
      this.swiped = false;
      return;
    }
    // Quem esta selecionando um trecho de codigo do slide nao quer avancar.
    if (!window.getSelection()?.isCollapsed) return;

    const stage = event.currentTarget as HTMLElement;
    const { left, width } = stage.getBoundingClientRect();
    const isRightHalf = event.clientX - left > width / 2;

    if (isRightHalf) this.next();
    else this.previous();
  }
}
