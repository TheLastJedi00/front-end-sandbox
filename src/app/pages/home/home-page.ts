import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Sandbox Front-end</h1>
      <a routerLink="/sandbox/1">Começar</a>
    </main>
  `,
})
export class HomePage {}
