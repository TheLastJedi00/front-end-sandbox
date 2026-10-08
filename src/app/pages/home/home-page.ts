import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FIRST_LEVEL } from '../../levels/level-definitions';
import { LiveSession } from '../../core/session/live-session';
import { RoleStore } from '../../core/session/role-store';
import { SessionBadge } from '../../core/session/session-badge/session-badge';
import { DeckPosition } from '../../slides/deck-navigation';
import { SlideDeck } from '../../slides/slide-deck/slide-deck';
import { OPENING_DECK } from '../../slides/slide-definitions';

/**
 * Abertura da apresentacao. Em vez de uma tela unica de texto, um deck curto:
 * quem conduz avanca no ritmo da turma e pula para o jogo quando quiser.
 *
 * Ao vivo, o deck do apresentador grava cada passo na sessao e o dos alunos
 * so acompanha.
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
        [synced]="synced()"
        [followOnly]="roles.isStudent()"
        (moved)="onMoved($event)"
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
  private readonly session = inject(LiveSession);
  protected readonly roles = inject(RoleStore);

  /** Onde a turma esta na abertura; fora dela, o deck comeca do inicio. */
  protected readonly synced = computed(() => {
    const state = this.session.state();
    return state?.stage === 'abertura' ? state.deck : null;
  });

  protected onMoved(deck: DeckPosition): void {
    if (this.roles.isPresenter()) void this.session.update({ stage: 'abertura', deck });
  }

  protected start(): void {
    if (!this.roles.isPresenter()) return;

    void this.session.enterLevel(FIRST_LEVEL);
    void this.router.navigate(['/sandbox', FIRST_LEVEL]);
  }
}
