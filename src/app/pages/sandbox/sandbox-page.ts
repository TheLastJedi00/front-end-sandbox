import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

@Component({
  selector: 'app-sandbox-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main>Fase {{ levelId() }}</main> `,
})
export class SandboxPage {
  readonly levelId = input.required({ transform: numberAttribute });
}
