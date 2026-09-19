import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';
import { IdeShell } from '../../ide/ide-shell/ide-shell';

@Component({
  selector: 'app-sandbox-page',
  imports: [IdeShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ide-shell>
      <div ideCode>Fase {{ levelId() }}</div>
      <div idePreview>Resultado</div>
    </app-ide-shell>
  `,
})
export class SandboxPage {
  readonly levelId = input.required({ transform: numberAttribute });
}
