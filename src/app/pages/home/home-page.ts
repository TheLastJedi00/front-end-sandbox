import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FIRST_LEVEL } from '../../levels/level-definitions';
import { SessionBadge } from '../../core/session/session-badge/session-badge';
import { SlideDeck } from '../../slides/slide-deck/slide-deck';
import { OPENING_DECK } from '../../slides/slide-definitions';

/**
 * Abertura da apresentacao. Em vez de uma tela unica de texto, um deck curto:
 * quem conduz avanca no ritmo da turma e pula para o jogo quando quiser.
 */
@Component({
  selector: 'app-home-page',
  imports: [SlideDeck, SessionBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <app-slide-deck
        [slides]="deck"
        finishLabel="Começar a escrever"
        skipLabel="Ir direto ao jogo"
        (finish)="start()"
      />
      <app-session-badge class="badge" />
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-block-size: 100dvh;
    }

    .badge {
      position: absolute;
      inset-block-start: var(--space-4);
      inset-inline-start: var(--space-4);
      z-index: 5;
    }

    .page {
      position: relative;
      display: grid;
      min-block-size: 100dvh;
      background:
        radial-gradient(60rem 30rem at 15% -10%, #0b3a63 0%, transparent 70%),
        radial-gradient(48rem 26rem at 100% 100%, #2a1d4d 0%, transparent 70%),
        var(--surface-app);
    }
  `,
})
export class HomePage {
  protected readonly deck = OPENING_DECK;

  private readonly router = inject(Router);

  protected start(): void {
    void this.router.navigate(['/sandbox', FIRST_LEVEL]);
  }
}
