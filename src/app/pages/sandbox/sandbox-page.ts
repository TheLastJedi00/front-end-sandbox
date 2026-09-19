import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';
import { ActivityBar } from '../../ide/activity-bar/activity-bar';
import { IdeShell } from '../../ide/ide-shell/ide-shell';
import { StatusBar } from '../../ide/status-bar/status-bar';
import { TitleBar } from '../../ide/title-bar/title-bar';

@Component({
  selector: 'app-sandbox-page',
  imports: [IdeShell, TitleBar, ActivityBar, StatusBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ide-shell>
      <app-title-bar ideTitleBar />
      <app-activity-bar ideActivityBar />
      <div ideCode>Fase {{ levelId() }}</div>
      <div idePreview>Resultado</div>
      <app-status-bar ideStatusBar />
    </app-ide-shell>
  `,
})
export class SandboxPage {
  readonly levelId = input.required({ transform: numberAttribute });
}
