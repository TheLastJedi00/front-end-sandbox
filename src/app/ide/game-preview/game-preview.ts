import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { GameState } from '../../core/models';
import { toRenderModel } from '../../engine/runtime/renderer';
import { describeScene, Scene } from '../../engine/runtime/scene';

/**
 * Desenha a cena com DOM de verdade: o palco contem literalmente os elementos
 * <sky>, <ground> e <ball> que o aluno escreveu. Ver o proprio codigo virar
 * imagem e o ponto pedagogico da fase 1 — por isso DOM, e nao canvas.
 */
@Component({
  selector: 'app-game-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <sky>, <ground> e <ball> nao tem hifen, entao nem o Angular nem a
  // especificacao de custom elements os reconhecem. NO_ERRORS_SCHEMA e o preco
  // de manter os nomes que o aluno digitou; por isso este componente e so
  // desenho, com poucas ligacoes e nenhuma logica.
  schemas: [NO_ERRORS_SCHEMA],
  host: { class: 'game-preview' },
  template: `
    <p class="sr-only" role="status">{{ description() }}</p>
    <div class="stage">
      @if (model().skyColor !== 'transparent') {
        <sky [style.background]="model().skyColor">
          @if (model().ground.visible) {
            <ground
              [style.background]="model().ground.color"
              [style.height.%]="model().ground.height"
            ></ground>
          }

          @if (model().goal.visible) {
            <div
              class="goal"
              [class.goal--reached]="model().goal.reached"
              [style.left.%]="model().goal.left"
              [style.bottom.%]="model().goal.bottom"
              aria-hidden="true"
            ></div>
          }

          @if (model().ball.visible) {
            <ball
              [style.background]="model().ball.color"
              [style.left.%]="model().ball.left"
              [style.bottom.%]="model().ball.bottom"
              [style.height.%]="model().ball.size"
            ></ball>
          }
        </sky>
      } @else {
        <p class="empty">O palco está vazio. Escreva &lt;sky&gt; no HTML para criar o céu.</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .stage {
      position: relative;
      aspect-ratio: 16 / 9;
      inline-size: 100%;
      overflow: hidden;
      border-radius: var(--radius-md);
      background: #101010;
      box-shadow: inset 0 0 0 1px var(--border-soft);
    }

    sky {
      position: absolute;
      inset: 0;
      display: block;
    }

    ground {
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      display: block;
    }

    ball {
      position: absolute;
      display: block;
      aspect-ratio: 1;
      border-radius: 50%;
      transform: translateX(-50%);
      box-shadow: inset -0.2rem -0.2rem 0 rgba(0, 0, 0, 0.18);
    }

    .goal {
      position: absolute;
      inline-size: 0.35rem;
      block-size: 18%;
      transform: translateX(-50%);
      background: #e6e6e6;
    }

    .goal::after {
      content: '';
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0.35rem;
      inline-size: 1.4rem;
      block-size: 1rem;
      background: var(--state-warning);
      clip-path: polygon(0 0, 100% 50%, 0 100%);
    }

    .goal--reached::after {
      background: var(--state-success);
    }

    .empty {
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      margin: 0;
      padding: var(--space-4);
      color: var(--text-dim);
      font-size: 0.875rem;
      text-align: center;
    }
  `,
})
export class GamePreview {
  readonly scene = input.required<Scene>();
  readonly state = input.required<GameState>();
  readonly showGoal = input(false);

  /** O modelo e calculado aqui para que so este componente redesenhe a cada quadro. */
  protected readonly model = computed(() =>
    toRenderModel(this.scene(), this.state(), { showGoal: this.showGoal() }),
  );

  /** Texto equivalente a imagem, anunciado quando a cena muda. */
  protected readonly description = computed(() => describeScene(this.scene()));
}
