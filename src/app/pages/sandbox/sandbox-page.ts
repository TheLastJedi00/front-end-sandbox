import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
  OnInit,
  untracked,
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
import { BriefingStore } from '../../core/services/briefing-store';
import { SyntaxCards } from '../../ide/syntax-cards/syntax-cards';
import { ConceptOverlay } from '../../slides/concept-overlay/concept-overlay';
import { SessionBadge } from '../../core/session/session-badge/session-badge';
import { LiveSession } from '../../core/session/live-session';
import { SessionFollower } from '../../core/session/session-follower';
import { RoleStore } from '../../core/session/role-store';
import { SolutionAlerts } from '../../core/session/solution-alerts';
import { ClassProgressService } from '../../core/session/class-progress';
import { ClassProgressPopup } from '../../core/session/class-progress-popup/class-progress-popup';
import { Clock } from '../../core/platform/clock';
import {
  IDLE_TIMER,
  isExpired,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
} from '../../core/session/phase-timer';
import { PhaseTimer } from '../../ide/phase-timer/phase-timer';
import { DeckPosition } from '../../slides/deck-navigation';
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
    ConceptOverlay,
    SyntaxCards,
    SessionBadge,
    PhaseTimer,
    ClassProgressPopup,
  ],
  providers: [GameLoop],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showConcept()) {
      <app-concept-overlay
        [concept]="level().concept"
        [synced]="conceptDeck()"
        [followOnly]="roles.isStudent()"
        [canGoBack]="roles.isPresenter() && liveLevel() !== null"
        (moved)="onConceptMoved($event)"
        (dismiss)="startLevel()"
        (back)="follower.back()"
      />
    }

    <app-ide-shell>
      <app-title-bar ideTitleBar [label]="level().title + ' — sandbox-front-end'">
        @if (roles.isPresenter() && liveLevel() && !showConcept()) {
          <!-- Sai do codigo e reabre o conceito desta fase, para a turma toda. -->
          <button class="back" type="button" (click)="follower.back()">
            <span aria-hidden="true">←</span> Voltar
          </button>
        }
        <app-level-progress [current]="level().id" [navigable]="roles.isPresenter()" />
        <app-phase-timer
          [timer]="timer()"
          [controls]="roles.isPresenter()"
          (pause)="updateTimer(pauseTimer)"
          (resume)="updateTimer(resumeTimer)"
          (restart)="restartTimer()"
        />
        <app-session-badge />
      </app-title-bar>
      <app-activity-bar ideActivityBar />

      <ng-container ideCode>
        <app-file-tabs [files]="files()" [active]="activeFile()" (select)="activeFile.set($event)" />
        <div class="editor-area">
          <app-code-editor
            [value]="code()[activeFile()]"
            [language]="activeFile()"
            [label]="'Editor de ' + activeFile()"
            [concept]="level().concept"
            [assistEnabled]="assistEnabled()"
            [focusRequest]="focusRequest()"
            (valueChange)="onCodeChange($event)"
          />
          @if (showCards()) {
            <app-syntax-cards [concept]="level().concept" (close)="showCards.set(false)" />
          }
        </div>
        <app-problems-panel [diagnostics]="diagnostics()" [hint]="hint()" />
      </ng-container>

      <ng-container idePreview>
        <app-goal-panel [level]="level()" [validation]="validation()" />

        <div class="toolbar">
          <button type="button" class="tool" [disabled]="!hasMoreHints()" (click)="revealHint()">
            {{ hint() ? 'Outra dica' : 'Dica' }}
          </button>
          <button type="button" class="tool" (click)="showCards.set(true)">Sintaxe</button>
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

          @if (timeUp() && !validation().completed) {
            <div class="time-up" role="alert">
              <strong>Tempo esgotado!</strong>
              <span>
                {{
                  roles.isPresenter()
                    ? 'Avance quando a turma estiver pronta.'
                    : 'Pode terminar o que está fazendo — o professor decide quando seguir.'
                }}
              </span>
            </div>
          }

          @if (validation().completed) {
            <div class="done" role="status">
              <strong>Fase concluída!</strong>
              @if (roles.isStudent()) {
                <span class="wait">O professor leva a turma para a próxima etapa.</span>
              }
            </div>
          }
        </div>
      </ng-container>

      <app-status-bar ideStatusBar [language]="fileLanguage()">
        {{ diagnostics().length }} problema(s)
      </app-status-bar>
    </app-ide-shell>

    <!-- O seguir do apresentador mora aqui: nao depende de ele concluir a fase. -->
    @if (classProgress(); as progress) {
      <app-class-progress-popup
        [progress]="progress"
        [nextLabel]="isLast() ? 'Ver o resultado' : 'Próxima fase'"
        (next)="goToNext()"
      />
    }
  `,
  styles: `
    .editor-area {
      position: relative;
      display: flex;
      flex: 1;
      min-block-size: 0;
    }

    .stage-wrapper {
      padding: 0 var(--space-4) var(--space-4);
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0 var(--space-4) var(--space-3);
    }

    .back {
      padding: 0.1rem var(--space-2);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .back:hover {
      border-color: var(--focus-ring);
      color: var(--text-primary);
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

    .time-up {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-2) var(--space-3);
      margin-block-start: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--state-error) 18%, var(--surface-raised));
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .wait {
      color: var(--text-muted);
      font-size: 0.875rem;
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
  private readonly briefings = inject(BriefingStore);
  private readonly session = inject(LiveSession);
  protected readonly follower = inject(SessionFollower);
  private readonly alerts = inject(SolutionAlerts);
  private readonly turma = inject(ClassProgressService);
  protected readonly roles = inject(RoleStore);

  /**
   * Cada incremento leva o cursor de volta ao editor. Os cards de sintaxe cobrem
   * a area de codigo, entao sem foco o aluno nao teria como comecar a digitar.
   */
  protected readonly focusRequest = signal(0);
  protected readonly loop = inject(GameLoop);

  protected readonly level = computed(() => findLevel(this.levelId()) ?? LEVELS[0]);
  protected readonly isLast = computed(() => this.level().id === LAST_LEVEL);

  /** Ao trocar de fase, recupera o rascunho salvo ou volta ao codigo inicial. */
  protected readonly code = linkedSignal<SourceCode>(() => {
    const level = this.level();
    return this.storage.load(level.id) ?? { ...level.starter };
  });
  protected readonly activeFile = linkedSignal<SourceFileId>(() => this.level().focusFile);

  /** A sessao ao vivo, quando ela fala desta fase. */
  protected readonly liveLevel = computed(() => {
    const state = this.session.state();
    return state?.stage === 'fase' && state.levelId === this.level().id ? state : null;
  });

  /**
   * Quem abre e fecha o conceito e o professor, para a turma toda. Sem a sessao
   * desta fase, vale a regra local: o slide abre a fase so na primeira vez.
   */
  protected readonly showConcept = computed(
    () => this.liveLevel()?.conceptOpen ?? !this.briefings.wasSeen(this.level().id),
  );
  /** Timer da fase, como a sessao diz; parado fora dela. */
  protected readonly timer = computed(() => this.liveLevel()?.timer ?? IDLE_TIMER);
  private readonly clock = inject(Clock);
  /** Os 3 minutos acabaram. So avisa: o editor continua livre. */
  protected readonly timeUp = computed(() => isExpired(this.timer(), this.clock.now()));
  /**
   * Progresso da turma no popup do apresentador: so durante o codigo desta
   * fase, e ja desde "0 de N" — confirma que as maquinas entraram.
   */
  protected readonly classProgress = computed(() =>
    this.roles.isPresenter() && this.liveLevel() && !this.showConcept()
      ? this.turma.current()
      : null,
  );
  /** Slide e etapa do conceito em que a turma esta. */
  protected readonly conceptDeck = computed(() => this.liveLevel()?.deck ?? null);

  /**
   * A sugestao automatica cala a boca quando nao tem mais o que ajudar: fase
   * concluida ou solucao ja na tela.
   */
  private readonly solutionShown = linkedSignal<boolean>(() => {
    this.level();
    return false;
  });
  protected readonly assistEnabled = computed(
    // Com os cards de sintaxe na frente ja ha ajuda na tela; a sugestao espera.
    () => !this.solutionShown() && !this.validation().completed && !this.showCards(),
  );

  /** Cards de sintaxe: abrem com a fase e saem na primeira tecla digitada. */
  protected readonly showCards = linkedSignal<boolean>(() => {
    this.level();
    return true;
  });

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
    // Sem o slide de conceito na frente, a fase ja abre com o cursor no editor —
    // tambem quando e o professor que fecha o conceito para a turma.
    effect(() => {
      if (!this.showConcept()) untracked(() => this.askFocus());
    });

    // O apresentador que chega a uma fase por conta propria (pela trilha) leva a
    // turma junto. So na chegada a cada fase (a pagina e reaproveitada entre
    // elas): depois disso, quem muda a sessao sao os botoes.
    let arrivedAt: number | null = null;
    effect(() => {
      const level = this.level().id;
      const state = this.session.state();
      if (arrivedAt === level || !state || !this.roles.isPresenter()) return;

      arrivedAt = level;
      if (state.stage !== 'fase' || state.levelId !== level) void this.session.enterLevel(level);
    });

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

    // E avisa o professor: a maquina do aluno entra na contagem da turma. O
    // servico le a sessao, entao isto roda de novo quando ela chega — e grava
    // uma vez so por fase.
    effect(() => {
      if (this.validation().completed) void this.turma.reportCompletion(this.level().id);
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

  protected startLevel(): void {
    if (!this.roles.isPresenter()) return;

    this.briefings.markSeen(this.level().id);
    // A turma entra na IDE e os 3 minutos comecam a contar para todos.
    void this.session.update({ conceptOpen: false, timer: startTimer(Date.now()) });
  }

  protected readonly pauseTimer = pauseTimer;
  protected readonly resumeTimer = resumeTimer;

  protected updateTimer(change: typeof pauseTimer): void {
    if (this.roles.isPresenter()) {
      void this.session.update({ timer: change(this.timer(), Date.now()) });
    }
  }

  protected restartTimer(): void {
    if (this.roles.isPresenter()) void this.session.update({ timer: resetTimer(Date.now()) });
  }

  protected onConceptMoved(deck: DeckPosition): void {
    if (this.roles.isPresenter()) void this.session.update({ deck });
  }

  private askFocus(): void {
    this.focusRequest.update((n) => n + 1);
  }

  protected goToNext(): void {
    if (!this.roles.isPresenter()) return;

    const next = this.level().id + 1;
    void (next > LAST_LEVEL ? this.session.finish() : this.session.enterLevel(next));
    void this.router.navigate(next > LAST_LEVEL ? ['/fim'] : ['/sandbox', next]);
  }

  protected revealHint(): void {
    this.hintsShown.update((shown) => Math.min(shown + 1, this.level().hints.length));
  }

  protected showSolution(): void {
    // Continua livre para o aluno, mas o professor fica sabendo.
    if (this.roles.isStudent()) void this.alerts.report(this.level().id);
    this.solutionShown.set(true);
    this.code.set({ ...this.level().solution });
  }

  /** Volta a fase ao ponto de partida — inclusive as dicas ja reveladas. */
  protected restart(): void {
    this.storage.clear(this.level().id);
    this.code.set({ ...this.level().starter });
    this.hintsShown.set(0);
    this.solutionShown.set(false);
    this.loop.reset();
  }

  protected onCodeChange(text: string): void {
    // Digitar e o sinal de que os cards ja cumpriram o seu papel.
    this.showCards.set(false);
    this.code.update((code) => ({ ...code, [this.activeFile()]: text }));
  }
}
