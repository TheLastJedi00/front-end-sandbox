import { Directive, input } from '@angular/core';
import { normalizeKey, PressedKeys } from '../../engine/runtime/input';

/**
 * Liga o teclado ao preview — e so ao preview. O editor de codigo fica ao lado,
 * entao o jogo so escuta teclas quando o palco esta com o foco; sem isso,
 * digitar "d" no editor faria a bola andar.
 */
@Directive({
  selector: '[appPreviewInput]',
  host: {
    '[attr.tabindex]': 'enabled() ? 0 : null',
    '[attr.role]': 'enabled() ? "application" : null',
    '[attr.aria-label]': 'enabled() ? "Palco do jogo. Use A e D para andar e espaço para pular." : null',
    '(keydown)': 'onKeyDown($event)',
    '(keyup)': 'onKeyUp($event)',
    '(blur)': 'keys().clear()',
  },
})
export class PreviewInput {
  readonly keys = input.required<PressedKeys>();
  readonly enabled = input(false);

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled()) return;
    const key = normalizeKey(event);
    if (!key) return;
    // Espaco e setas rolariam a pagina no meio da apresentacao.
    event.preventDefault();
    this.keys().press(key);
  }

  protected onKeyUp(event: KeyboardEvent): void {
    const key = normalizeKey(event);
    if (key) this.keys().release(key);
  }
}
