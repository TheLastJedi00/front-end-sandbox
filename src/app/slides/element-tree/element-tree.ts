import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TreeNode } from '../slide-definitions';

/**
 * "Quem esta dentro de quem", desenhado. Cada elemento e uma caixa com o nome
 * da tag, e os filhos aparecem dentro dela, um nivel de cada vez — o mesmo
 * aninhamento que o HTML escreve com abertura e fechamento.
 *
 * O componente chama a si mesmo para desenhar os filhos.
 */
@Component({
  selector: 'app-element-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'element-tree',
    '[attr.data-name]': 'node().name',
    '[style.--depth]': 'depth()',
    '[style.--order]': 'order()',
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
  template: `
    <span class="name" aria-hidden="true">&lt;{{ node().name }}&gt;</span>
    @if (node().children?.length) {
      <div class="children">
        @for (child of node().children; track $index) {
          <app-element-tree [node]="child" [depth]="depth() + 1" [order]="$index" />
        }
      </div>
    }
  `,
  styles: `
    :host {
      --tone: var(--accent, var(--state-hint));
      display: grid;
      align-content: start;
      gap: var(--space-3);
      min-inline-size: 7rem;
      padding: var(--space-3) var(--space-4) var(--space-4);
      border: 2px dashed color-mix(in srgb, var(--tone) 70%, transparent);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--tone) 10%, transparent);
      animation: box-in 620ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      /* Pai antes dos filhos; irmaos um depois do outro. */
      animation-delay: calc(600ms + var(--depth) * 420ms + var(--order) * 180ms);
    }

    /* As tags do jogo ganham a cor que vao ter na tela. */
    :host([data-name='sky']) {
      --tone: var(--game-blue);
    }

    :host([data-name='ball']) {
      --tone: var(--game-red);
    }

    :host([data-name='ground']) {
      --tone: var(--game-green);
    }

    .name {
      color: var(--tone);
      font-family: var(--font-mono);
      font-size: clamp(0.9375rem, 1.6vw, 1.25rem);
      font-weight: 600;
    }

    .children {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    @keyframes box-in {
      from {
        opacity: 0;
        transform: scale(0.6) translateY(1rem);
      }
    }
  `,
})
export class ElementTree {
  readonly node = input.required<TreeNode>();
  readonly depth = input(0);
  /** Posicao entre os irmaos — atrasa a entrada de cada um. */
  readonly order = input(0);

  protected label(): string {
    const children = this.node().children ?? [];
    if (children.length === 0) return `${this.node().name}, vazio`;
    return `${this.node().name}, contém ${children.map((c) => c.name).join(' e ')}`;
  }
}
