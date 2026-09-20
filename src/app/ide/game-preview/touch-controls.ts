import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PressedKeys } from '../../engine/runtime/input';

interface ControlButton {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

/**
 * Controles na tela para a fase 3. Num tablet nao existe teclado, e o jogo nao
 * pode depender dele — os botoes apertam exatamente as mesmas teclas que o
 * codigo do aluno escuta, entao `if(key("D"))` continua sendo o que decide.
 */
@Component({
  selector: 'app-touch-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'touch-controls' },
  template: `
    @for (button of buttons; track button.key) {
      <button
        type="button"
        class="control"
        [class.control--wide]="button.key === 'SPACE'"
        [attr.aria-label]="button.description"
        (pointerdown)="press($event, button.key)"
        (pointerup)="release(button.key)"
        (pointercancel)="release(button.key)"
        (pointerleave)="release(button.key)"
        (keydown.enter)="tap(button.key)"
        (keydown.space)="tap(button.key)"
      >
        {{ button.label }}
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      gap: var(--space-2);
      margin-block-start: var(--space-3);
    }

    .control {
      flex: 1;
      /* Alvo de toque confortavel para um dedo de aluno. */
      min-block-size: 3rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 1rem;
      /* Sem rolagem nem zoom acidental ao segurar o botao. */
      touch-action: none;
      user-select: none;
    }

    .control:active {
      border-color: var(--focus-ring);
      background: var(--surface-bar);
    }

    .control--wide {
      flex: 2;
    }
  `,
})
export class TouchControls {
  readonly keys = input.required<PressedKeys>();

  protected readonly buttons: readonly ControlButton[] = [
    { key: 'A', label: '◀ A', description: 'Andar para a esquerda (tecla A)' },
    { key: 'SPACE', label: 'espaço ▲', description: 'Pular (tecla espaço)' },
    { key: 'D', label: 'D ▶', description: 'Andar para a direita (tecla D)' },
  ];

  protected press(event: PointerEvent, key: string): void {
    // A tecla vem primeiro: apertar o botao nunca pode depender da captura.
    this.keys().press(key);

    try {
      // Segurar o botao equivale a segurar a tecla, entao o ponteiro fica preso
      // a ele: arrastar o dedo para fora nao deixa a tecla "grudada".
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Sem captura, `pointerleave` e `pointercancel` ainda soltam a tecla.
    }
  }

  protected release(key: string): void {
    this.keys().release(key);
  }

  /** Acionamento por teclado no proprio botao: um toque curto. */
  protected tap(key: string): void {
    this.keys().press(key);
    setTimeout(() => this.keys().release(key), 120);
  }
}
