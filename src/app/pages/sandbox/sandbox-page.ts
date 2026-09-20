import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  OnInit,
} from '@angular/core';
import {
  Diagnostic,
  INITIAL_GAME_STATE,
  SOURCE_FILES,
  SourceCode,
  SourceFileId,
} from '../../core/models';
import { GameLoop } from '../../engine/runtime/game-loop';
import { buildScene } from '../../engine/runtime/scene';
import { parseCss } from '../../engine/parsers/css-parser';
import { parseHtml } from '../../engine/parsers/html-parser';
import { parseJs } from '../../engine/parsers/js-parser';
import { validateLevel } from '../../engine/validation/level-validator';
import { ActivityBar } from '../../ide/activity-bar/activity-bar';
import { CodeEditor } from '../../ide/code-editor/code-editor';
import { FileTabs } from '../../ide/file-tabs/file-tabs';
import { GamePreview } from '../../ide/game-preview/game-preview';
import { IdeShell } from '../../ide/ide-shell/ide-shell';
import { ProblemsPanel } from '../../ide/problems-panel/problems-panel';
import { StatusBar } from '../../ide/status-bar/status-bar';
import { TitleBar } from '../../ide/title-bar/title-bar';
import { findLevel, LEVELS } from '../../levels/level-definitions';
import { GoalPanel } from './goal-panel';

@Component({
  selector: 'app-sandbox-page',
  imports: [
    IdeShell,
    TitleBar,
    ActivityBar,
    StatusBar,
    FileTabs,
    CodeEditor,
    ProblemsPanel,
    GamePreview,
    GoalPanel,
  ],
  providers: [GameLoop],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ide-shell>
      <app-title-bar ideTitleBar [label]="level().title + ' — sandbox-front-end'" />
      <app-activity-bar ideActivityBar />

      <ng-container ideCode>
        <app-file-tabs [files]="files()" [active]="activeFile()" (select)="activeFile.set($event)" />
        <app-code-editor
          [value]="code()[activeFile()]"
          [language]="activeFile()"
          [label]="'Editor de ' + activeFile()"
          (valueChange)="onCodeChange($event)"
        />
        <app-problems-panel [diagnostics]="diagnostics()" />
      </ng-container>

      <ng-container idePreview>
        <app-goal-panel [level]="level()" [validation]="validation()" />
        <div class="stage-wrapper">
          <app-game-preview [scene]="scene()" [state]="loop.state()" />
        </div>
      </ng-container>

      <app-status-bar ideStatusBar [language]="fileLanguage()">
        {{ diagnostics().length }} problema(s)
      </app-status-bar>
    </app-ide-shell>
  `,
  styles: `
    .stage-wrapper {
      padding: 0 var(--space-4) var(--space-4);
    }
  `,
})
export class SandboxPage implements OnInit {
  readonly levelId = input.required({ transform: numberAttribute });

  protected readonly loop = inject(GameLoop);

  protected readonly level = computed(() => findLevel(this.levelId()) ?? LEVELS[0]);

  /** O codigo volta ao inicial da fase sempre que a rota muda de fase. */
  protected readonly code = linkedSignal<SourceCode>(() => ({ ...this.level().starter }));
  protected readonly activeFile = linkedSignal<SourceFileId>(() => this.level().focusFile);

  protected readonly files = computed(() =>
    SOURCE_FILES.filter((file) => this.level().enabledFiles.includes(file.id)),
  );
  protected readonly fileLanguage = computed(
    () => this.files().find((file) => file.id === this.activeFile())?.language ?? 'HTML',
  );

  private readonly html = computed(() => parseHtml(this.code().html));
  private readonly css = computed(() => parseCss(this.code().css));
  private readonly js = computed(() => parseJs(this.code().js));

  protected readonly scene = computed(() => buildScene(this.html(), this.css()));

  protected readonly diagnostics = computed<readonly Diagnostic[]>(() => {
    const enabled = this.level().enabledFiles;
    return [
      ...(enabled.includes('html') ? this.html().diagnostics : []),
      ...(enabled.includes('css') ? this.css().diagnostics : []),
      ...(enabled.includes('js') ? this.js().diagnostics : []),
    ];
  });

  /**
   * O que o jogo conquistou ate agora. Fica separado do estado quadro a quadro
   * para que a validacao so rode quando algo de fato acontece.
   */
  private readonly achievements = computed(
    () => {
      const state = this.loop.state();
      return { hasJumped: state.hasJumped, reachedGoal: state.reachedGoal };
    },
    {
      equal: (a, b) => a.hasJumped === b.hasJumped && a.reachedGoal === b.reachedGoal,
    },
  );

  protected readonly validation = computed(() =>
    validateLevel({
      level: this.level(),
      scene: this.scene(),
      js: this.js(),
      // A validacao so olha o que ja foi conquistado, nunca a posicao do quadro atual.
      state: { ...INITIAL_GAME_STATE, ...this.achievements() },
    }),
  );

  constructor() {
    effect(() => {
      const level = this.level();
      this.loop.configure({
        animation: this.scene().animation,
        handlers: this.js().handlers,
        interactive: level.interactive,
        autoJump: !level.interactive,
      });
    });

    // Trocar de fase recomeca o jogo do zero.
    effect(() => {
      this.level();
      this.loop.reset();
    });
  }

  ngOnInit(): void {
    this.loop.start();
  }

  protected onCodeChange(text: string): void {
    this.code.update((code) => ({ ...code, [this.activeFile()]: text }));
  }
}
