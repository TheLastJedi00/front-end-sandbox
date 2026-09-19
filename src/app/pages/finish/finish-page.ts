import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-finish-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Você criou um jogo</h1>
      <a routerLink="/">Voltar ao início</a>
    </main>
  `,
})
export class FinishPage {}
