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
import { Router } from '@angular/router';
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
import { PreviewInput } from '../../ide/game-preview/preview-input';
import { IdeShell } from '../../ide/ide-shell/ide-shell';
import { ProblemsPanel } from '../../ide/problems-panel/problems-panel';
import { StatusBar } from '../../ide/status-bar/status-bar';
import { TitleBar } from '../../ide/title-bar/title-bar';
import { findLevel, LAST_LEVEL, LEVELS } from '../../levels/level-definitions';
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
    PreviewInput,
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
        <div class="stage-wrapper" [class.stage-wrapper--done]="validation().completed">
          <app-game-preview
            appPreviewInput
            [keys]="loop.keys"
            [enabled]="level().interactive"
            [showGoal]="level().interactive"
            [scene]="scene()"
            [state]="loop.state()"
          />
          @if (level().interactive) {
            <p class="controls">
              Clique no palco e use <kbd>A</kbd> <kbd>D</kbd> para andar e
              <kbd>espaço</kbd> para pular.
            </p>
          }

          @if (validation().completed) {
            <div class="done" role="status">
              <strong>Fase concluída!</strong>
              <button type="button" class="next" (click)="goToNext()">
                {{ isLast() ? 'Ver o resultado' : 'Próxima fase' }}
              </button>
            </div>
          }
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

    .controls {
      margin: var(--space-2) 0 0;
      color: var(--text-muted);
      font-size: 0.8125rem;
    }

    .stage-wrapper--done app-game-preview {
      display: block;
      border-radius: var(--radius-md);
      outline: 2px solid var(--state-success);
      outline-offset: 3px;
    }

    .done {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-block-start: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--state-success) 16%, var(--surface-raised));
      color: var(--text-primary);
    }

    .next {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: var(--radius-sm);
      background: var(--surface-status);
      color: var(--text-inverse);
      font-weight: 600;
    }

    kbd {
      padding: 0.05rem 0.35rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }
  `,
})
export class SandboxPage implements OnInit {
  readonly levelId = input.required({ transform: numberAttribute });

  private readonly router = inject(Router);
  protected readonly loop = inject(GameLoop);

  protected readonly level = computed(() => findLevel(this.levelId()) ?? LEVELS[0]);
  protected readonly isLast = computed(() => this.level().id === LAST_LEVEL);

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

    // Trocar de fase ou mexer no codigo recomeca o jogo do zero: o que ja foi
    // conquistado precisa valer para o codigo que esta na tela agora.
    effect(() => {
      this.level();
      this.code();
      this.loop.reset();
    });
  }

  ngOnInit(): void {
    this.loop.start();
  }

  protected goToNext(): void {
    const next = this.level().id + 1;
    this.router.navigate(next > LAST_LEVEL ? ['/fim'] : ['/sandbox', next]);
  }

  protected onCodeChange(text: string): void {
    this.code.update((code) => ({ ...code, [this.activeFile()]: text }));
  }
}
