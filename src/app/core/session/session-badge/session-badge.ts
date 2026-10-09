import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../auth/auth-store';
import { RestartDialog } from '../restart-dialog/restart-dialog';
import { RoleStore } from '../role-store';

/**
 * Lembra quem esta maquina e na aula e deixa sair dela. Sair tambem esquece o
 * papel: e o caminho para uma maquina trocar de apresentador para aluno. Para
 * o apresentador, e tambem onde fica o "Reiniciar apresentacao", em qualquer tela.
 */
@Component({
  selector: 'app-session-badge',
  imports: [RestartDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'session-badge' },
  template: `
    <span class="role" [class.role--presenter]="roles.isPresenter()">{{ label() }}</span>
    @if (roles.isPresenter()) {
      <button class="action" type="button" (click)="restart.open()">
        Reiniciar apresentação
      </button>
      <app-restart-dialog #restart />
    }
    <button class="action" type="button" (click)="logout()">Sair</button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 0.75rem;
    }

    .role {
      padding: 0.1rem var(--space-2);
      border-radius: 999px;
      background: color-mix(in srgb, var(--state-hint) 18%, transparent);
      color: var(--state-hint);
      font-weight: 600;
    }

    .role--presenter {
      background: color-mix(in srgb, var(--state-warning) 20%, transparent);
      color: var(--state-warning);
    }

    .action {
      padding: 0.1rem var(--space-2);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: inherit;
    }

    .action:hover {
      border-color: var(--focus-ring);
      color: var(--text-primary);
    }
  `,
})
export class SessionBadge {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly roles = inject(RoleStore);

  protected readonly label = computed(() =>
    this.roles.isPresenter() ? 'Apresentador' : 'Aluno',
  );

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.roles.clear();
    await this.router.navigate(['/login']);
  }
}
