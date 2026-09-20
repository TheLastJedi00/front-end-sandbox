import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SlideDefinition } from '../slide-definitions';
import { Slide } from '../slide/slide';

/** Distancia minima, em pixels, para um arrasto contar como troca de slide. */
const SWIPE_MIN = 48;

/**
 * Casca do deck: navegacao, progresso e a saida para o jogo.
 *
 * Teclado e toque funcionam juntos porque as duas coisas acontecem — a aula e
 * projetada de um notebook, mas os alunos acompanham em tablets.
 */
@Component({
  selector: 'app-slide-deck',
  imports: [Slide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slide-deck',
    '(document:keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
  template: `
    <div class="stage" (click)="onStageClick($event)">
      <app-slide [slide]="current()" />
    </div>

    <footer class="controls">
      <button class="nav" type="button" [disabled]="isFirst()" (click)="previous()">
        <span aria-hidden="true">←</span> Voltar
      </button>

      <ol class="dots" [attr.aria-label]="'Slide ' + (index() + 1) + ' de ' + total()">
        @for (slide of slides(); track slide.id; let i = $index) {
          <li>
            <button
              class="dot"
              type="button"
              [class.dot--active]="i === index()"
              [attr.aria-label]="'Ir para o slide ' + (i + 1)"
              [attr.aria-current]="i === index() ? 'true' : null"
              (click)="go(i)"
            ></button>
          </li>
        }
      </ol>

      @if (isLast()) {
        <button class="nav nav--primary" type="button" (click)="finish.emit()">
          {{ finishLabel() }} <span aria-hidden="true">→</span>
        </button>
      } @else {
        <button class="nav nav--primary" type="button" (click)="next()">
          Avançar <span aria-hidden="true">→</span>
        </button>
      }
    </footer>

    <button class="skip" type="button" (click)="finish.emit()">{{ skipLabel() }}</button>

    <p class="live" aria-live="polite">{{ current().title }}</p>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-rows: 1fr auto;
      min-block-size: 100%;
      touch-action: pan-y;
    }

    .stage {
      display: grid;
      min-block-size: 0;
    }

    .controls {
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

    .dot--active {
      border-color: transparent;
      background: var(--state-hint);
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

    .live {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
    }

    @media (max-inline-size: 600px) {
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

  /** O deck acabou — por ter chegado ao fim ou por ter sido pulado. */
  readonly finish = output<void>();

  protected readonly index = signal(0);
  protected readonly total = computed(() => this.slides().length);
  protected readonly current = computed(() => this.slides()[this.index()]);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() >= this.total() - 1);

  private pointerStartX: number | null = null;
  /** Um arrasto ja trocou o slide; o `click` que vem depois dele nao conta. */
  private swiped = false;

  next(): void {
    if (this.isLast()) {
      this.finish.emit();
      return;
    }
    this.index.update((i) => i + 1);
  }

  previous(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  go(index: number): void {
    this.index.set(Math.min(Math.max(index, 0), this.total() - 1));
  }

  protected onKeydown(event: KeyboardEvent): void {
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
