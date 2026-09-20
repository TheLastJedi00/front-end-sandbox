import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { GameLoop } from '../../engine/runtime/game-loop';
import { Scene } from '../../engine/runtime/scene';
import { GamePreview } from '../../ide/game-preview/game-preview';
import { PreviewInput } from '../../ide/game-preview/preview-input';
import { TouchControls } from '../../ide/game-preview/touch-controls';

/**
 * Casca fina entre a pagina e o preview. Existe por um motivo de performance:
 * o estado do jogo muda 60 vezes por segundo, e so quem o le precisa ser
 * reavaliado. Lendo o loop aqui, a pagina inteira fica fora do ciclo do quadro.
 */
@Component({
  selector: 'app-game-stage',
  imports: [GamePreview, PreviewInput, TouchControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-game-preview
      appPreviewInput
      [keys]="loop.keys"
      [enabled]="interactive()"
      [showGoal]="interactive()"
      [completed]="completed()"
      [scene]="scene()"
      [state]="loop.state()"
    />

    @if (interactive()) {
      <app-touch-controls [keys]="loop.keys" />
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class GameStage {
  readonly scene = input.required<Scene>();
  readonly interactive = input(false);
  readonly completed = input(false);

  protected readonly loop = inject(GameLoop);
}
