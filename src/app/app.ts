import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RoleStore } from './core/session/role-store';
import { SessionFollower } from './core/session/session-follower';
import { SolutionToasts } from './core/session/solution-toasts/solution-toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SolutionToasts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly roles = inject(RoleStore);

  constructor() {
    // Vive o app inteiro: e ele que leva a maquina do aluno junto com a turma.
    inject(SessionFollower);
  }
}
