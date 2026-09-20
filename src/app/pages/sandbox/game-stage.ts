import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { GameLoop } from '../../engine/runtime/game-loop';
import { Scene } from '../../engine/runtime/scene';
import { GamePreview } from '../../ide/game-preview/game-preview';
import { PreviewInput } from '../../ide/game-preview/preview-input';

/**
 * Casca fina entre a pagina e o preview. Existe por um motivo de performance:
 * o estado do jogo muda 60 vezes por segundo, e so quem o le precisa ser
 * reavaliado. Lendo o loop aqui, a pagina inteira fica fora do ciclo do quadro.
 */
@Component({
  selector: 'app-game-stage',
  imports: [GamePreview, PreviewInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-game-preview
      appPreviewInput
      [keys]="loop.keys"
      [enabled]="interactive()"
      [showGoal]="interactive()"
      [scene]="scene()"
      [state]="loop.state()"
    />
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

  protected readonly loop = inject(GameLoop);
}
