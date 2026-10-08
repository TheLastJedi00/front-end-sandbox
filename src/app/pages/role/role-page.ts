import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Role, RoleStore } from '../../core/session/role-store';

/**
 * Logo depois do login: esta maquina conduz a aula ou acompanha? E essa escolha
 * que define quem e quem, ja que todas usam a conta do professor.
 */
@Component({
  selector: 'app-role-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <h1 class="title">Como esta máquina entra na aula?</h1>

      <div class="choices">
        <button class="choice" type="button" (click)="choose('apresentador')">
          <span class="icon" aria-hidden="true">▶</span>
          <span class="name">Entrar como apresentador</span>
          <span class="hint">Esta máquina conduz: avança os slides e as fases para toda a turma.</span>
        </button>

        <button class="choice" type="button" (click)="choose('aluno')">
          <span class="icon" aria-hidden="true">⌨</span>
          <span class="name">Entrar como aluno</span>
          <span class="hint">Esta máquina acompanha o professor e programa em cada fase.</span>
        </button>
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    .page {
      display: grid;
      align-content: center;
      justify-items: center;
      gap: var(--space-8);
      min-block-size: 100dvh;
      padding: var(--space-4);
      background:
        radial-gradient(60rem 30rem at 15% -10%, #0b3a63 0%, transparent 70%),
        radial-gradient(48rem 26rem at 100% 100%, #2a1d4d 0%, transparent 70%),
        var(--surface-app);
    }

    .title {
      margin: 0;
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 600;
      text-align: center;
    }

    .choices {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 18rem));
      gap: var(--space-6);
    }

    .choice {
      display: grid;
      justify-items: start;
      gap: var(--space-3);
      min-block-size: 14rem;
      padding: var(--space-8) var(--space-6);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      background: var(--surface-panel);
      color: var(--text-primary);
      text-align: start;
      transition:
        border-color 160ms ease,
        transform 160ms ease;
    }

    .choice:hover,
    .choice:focus-visible {
      border-color: var(--focus-ring);
      transform: translateY(-2px);
    }

    .icon {
      color: var(--state-hint);
      font-size: 2rem;
      line-height: 1;
    }

    .name {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .hint {
      color: var(--text-muted);
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .choices {
        grid-template-columns: minmax(0, 1fr);
      }

      .choice {
        min-block-size: auto;
      }
    }
  `,
})
export class RolePage {
  private readonly roles = inject(RoleStore);
  private readonly router = inject(Router);

  protected choose(role: Role): void {
    this.roles.choose(role);
    void this.router.navigate(['/']);
  }
}
