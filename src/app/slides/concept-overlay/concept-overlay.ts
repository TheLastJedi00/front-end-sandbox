import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { LevelConcept } from '../../core/models';
import { DeckPosition } from '../deck-navigation';
import { conceptSlides } from '../slide-definitions';
import { SlideDeck } from '../slide-deck/slide-deck';

/**
 * Sequencia que abre a fase, por cima da IDE: o conceito e, depois dele, a
 * sintaxe desmontada parte por parte. E um overlay, e nao uma rota, para que o
 * estado do editor continue vivo atras dele e o "Pular" seja instantaneo.
 */
@Component({
  selector: 'app-concept-overlay',
  imports: [SlideDeck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'concept-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': '"Conceito da fase: " + concept()',
  },
  template: `
    <div class="panel">
      <app-slide-deck
        [slides]="slides()"
        finishLabel="Começar a escrever"
        skipLabel="Pular"
        [synced]="synced()"
        [followOnly]="followOnly()"
        [showPace]="!followOnly()"
        (moved)="moved.emit($event)"
        (finish)="dismiss.emit()"
      />
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: var(--space-4);
      background: color-mix(in srgb, #000 72%, transparent);
      backdrop-filter: blur(4px);
      animation: backdrop-in 300ms ease-out both;
    }

    .panel {
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      inline-size: min(76rem, 100%);
      block-size: min(50rem, 100%);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--surface-app);
      box-shadow: 0 2rem 6rem -2rem #000;
      overflow: hidden;
      animation: panel-in 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes backdrop-in {
      from {
        opacity: 0;
      }
    }

    @keyframes panel-in {
      from {
        opacity: 0;
        transform: translateY(2rem) scale(0.96);
      }
    }
  `,
})
export class ConceptOverlay {
  readonly concept = input.required<LevelConcept>();
  /** Posicao vinda da sessao ao vivo (ver `SlideDeck`). */
  readonly synced = input<DeckPosition | null>(null);
  /** Maquina do aluno: assiste ate o professor fechar o conceito para todos. */
  readonly followOnly = input(false);

  /** O aluno comecou a fase — por ter chegado ao fim ou por ter pulado. */
  readonly dismiss = output<void>();
  /** Cada movimento do apresentador no mini-deck. */
  readonly moved = output<DeckPosition>();

  protected readonly slides = computed(() => conceptSlides(this.concept()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // O foco entra no dialogo: quem usa teclado nao pode ficar navegando a IDE
    // que esta atras dos slides. O "Avancar" e o botao que ele vai querer.
    afterNextRender(() =>
      this.host.nativeElement.querySelector<HTMLButtonElement>('.nav--primary')?.focus(),
    );
  }
}
