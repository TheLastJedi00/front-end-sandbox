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
import { IdeShell } from '../../ide/ide-shell/ide-shell';
import { ProblemsPanel } from '../../ide/problems-panel/problems-panel';
import { StatusBar } from '../../ide/status-bar/status-bar';
import { TitleBar } from '../../ide/title-bar/title-bar';
import { findLevel, LAST_LEVEL, LEVELS } from '../../levels/level-definitions';
import { CodeStorage } from '../../core/services/code-storage';
import { ProgressStore } from '../../core/services/progress-store';
import { GameStage } from './game-stage';
import { GoalPanel } from './goal-panel';
import { LevelProgress } from './level-progress';

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
    GameStage,
    GoalPanel,
    LevelProgress,
  ],
  providers: [GameLoop],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ide-shell>
      <app-title-bar ideTitleBar [label]="level().title + ' — sandbox-front-end'">
        <app-level-progress [current]="level().id" />
      </app-title-bar>
      <app-activity-bar ideActivityBar />

      <ng-container ideCode>
        <app-file-tabs [files]="files()" [active]="activeFile()" (select)="activeFile.set($event)" />
        <app-code-editor
          [value]="code()[activeFile()]"
          [language]="activeFile()"
          [label]="'Editor de ' + activeFile()"
          (valueChange)="onCodeChange($event)"
        />
        <app-problems-panel [diagnostics]="diagnostics()" [hint]="hint()" />
      </ng-container>

      <ng-container idePreview>
        <app-goal-panel [level]="level()" [validation]="validation()" />

        <div class="toolbar">
          <button type="button" class="tool" [disabled]="!hasMoreHints()" (click)="revealHint()">
            {{ hint() ? 'Outra dica' : 'Dica' }}
          </button>
          <button type="button" class="tool" (click)="showSolution()">Mostrar solução</button>
          <button type="button" class="tool" (click)="restart()">Reiniciar fase</button>
        </div>
        <div class="stage-wrapper">
          <app-game-stage
            [scene]="scene()"
            [interactive]="level().interactive"
            [completed]="validation().completed"
          />
          @if (level().interactive) {
            <p class="controls">
              Use os botões de controle — ou, com teclado, clique no palco e use <kbd>A</kbd>
              <kbd>D</kbd> para andar e <kbd>espaço</kbd> para pular.
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

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0 var(--space-4) var(--space-3);
    }

    .tool {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .tool:hover:not(:disabled) {
      border-color: var(--focus-ring);
    }

    .tool:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .controls {
      margin: var(--space-2) 0 0;
      color: var(--text-muted);
      font-size: 0.8125rem;
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
  private readonly progress = inject(ProgressStore);
  private readonly storage = inject(CodeStorage);
  protected readonly loop = inject(GameLoop);

  protected readonly level = computed(() => findLevel(this.levelId()) ?? LEVELS[0]);
  protected readonly isLast = computed(() => this.level().id === LAST_LEVEL);

  /** Ao trocar de fase, recupera o rascunho salvo ou volta ao codigo inicial. */
  protected readonly code = linkedSignal<SourceCode>(() => {
    const level = this.level();
    return this.storage.load(level.id) ?? { ...level.starter };
  });
  protected readonly activeFile = linkedSignal<SourceFileId>(() => this.level().focusFile);

  protected readonly files = computed(() =>
    SOURCE_FILES.filter((file) => this.level().enabledFiles.includes(file.id)),
  );
  protected readonly fileLanguage = computed(
    () => this.files().find((file) => file.id === this.activeFile())?.language ?? 'HTML',
  );

  /** Dicas sao reveladas uma a uma e zeram a cada fase. */
  private readonly hintsShown = linkedSignal<number>(() => {
    this.level();
    return 0;
  });
  protected readonly hint = computed(() => this.level().hints[this.hintsShown() - 1] ?? null);
  protected readonly hasMoreHints = computed(
    () => this.hintsShown() < this.level().hints.length,
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

    // Cada mudanca no codigo e guardada: um F5 no meio da aula nao apaga nada.
    effect(() => this.storage.save(this.level().id, this.code()));

    // A fase concluida fica marcada na trilha, mesmo se o aluno voltar atras.
    effect(() => {
      if (this.validation().completed) this.progress.markCompleted(this.level().id);
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

  protected revealHint(): void {
    this.hintsShown.update((shown) => Math.min(shown + 1, this.level().hints.length));
  }

  protected showSolution(): void {
    this.code.set({ ...this.level().solution });
  }

  /** Volta a fase ao ponto de partida — inclusive as dicas ja reveladas. */
  protected restart(): void {
    this.storage.clear(this.level().id);
    this.code.set({ ...this.level().starter });
    this.hintsShown.set(0);
    this.loop.reset();
  }

  protected onCodeChange(text: string): void {
    this.code.update((code) => ({ ...code, [this.activeFile()]: text }));
  }
}
