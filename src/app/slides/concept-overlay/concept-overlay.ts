import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LevelConcept } from '../../core/models';
import { conceptSlide } from '../slide-definitions';
import { Slide } from '../slide/slide';

/**
 * Slide que abre a fase, por cima da IDE. E um overlay, e nao uma rota, para
 * que o estado do editor continue vivo atras dele e o "Pular" seja instantaneo.
 */
@Component({
  selector: 'app-concept-overlay',
  imports: [Slide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'concept-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': '"Conceito da fase: " + concept()',
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    <div class="panel">
      <app-slide [slide]="slide()" />

      <footer class="actions">
        <button class="action action--primary" type="button" (click)="dismiss.emit()" #start>
          Começar a escrever <span aria-hidden="true">→</span>
        </button>
        <button class="action" type="button" (click)="dismiss.emit()">Pular</button>
      </footer>
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
      background: color-mix(in srgb, #000 68%, transparent);
      backdrop-filter: blur(3px);
    }

    .panel {
      display: grid;
      grid-template-rows: 1fr auto;
      inline-size: min(64rem, 100%);
      max-block-size: min(44rem, 100%);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background:
        radial-gradient(40rem 20rem at 10% -20%, #0b3a63 0%, transparent 70%),
        var(--surface-panel);
      overflow: hidden;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4);
      border-block-start: 1px solid var(--border-soft);
    }

    .action {
      padding: var(--space-3) var(--space-6);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      font-weight: 600;
    }

    .action--primary {
      border-color: transparent;
      background: var(--surface-status);
      color: var(--text-inverse);
    }
  `,
})
export class ConceptOverlay {
  readonly concept = input.required<LevelConcept>();

  /** O aluno comecou a fase — por ter lido o slide ou por ter pulado. */
  readonly dismiss = output<void>();

  protected readonly slide = computed(() => conceptSlide(this.concept()));

  private readonly start = viewChild.required<ElementRef<HTMLButtonElement>>('start');

  constructor() {
    // O foco entra no dialogo: quem usa teclado nao pode ficar navegando a IDE
    // que esta atras do slide.
    afterNextRender(() => this.start().nativeElement.focus());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' && event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    this.dismiss.emit();
  }
}
