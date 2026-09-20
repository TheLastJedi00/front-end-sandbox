import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
  ElementRef,
} from '@angular/core';
import {
  applyCompletion,
  autoClose,
  Completion,
  completionsAt,
} from '../../assist/completion';
import { ghostSuggestion, GhostSuggestion } from '../../assist/ghost-suggestion';
import { LevelConcept, SourceFileId } from '../../core/models';
import { highlight } from './highlight';

const DEBOUNCE_MS = 150;
/** Tempo parado antes de a IDE oferecer o proximo trecho de codigo. */
const IDLE_MS = 5000;
/** Altura reservada para a lista de sugestoes ao decidir se ela abre para cima. */
const LIST_HEIGHT = 220;
/** Quantas sugestoes aparecem de uma vez — a lista e um apoio, nao um menu. */
const MAX_SUGGESTIONS = 6;

interface CaretPoint {
  readonly x: number;
  readonly y: number;
  readonly lineHeight: number;
}

/**
 * Editor proprio: um `<textarea>` transparente sobre um `<pre>` espelhado.
 * A sintaxe aceita aqui e minuscula, entao nao vale trazer um Monaco/CodeMirror
 * inteiro — e o editor simples evita prometer ao aluno uma IDE completa.
 *
 * Sobre esse editor vive a assistencia da fase: autocomplete do vocabulario da
 * fase e fechamento automatico de tag e de bloco.
 */
@Component({
  selector: 'app-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gutter" aria-hidden="true" #gutter>
      @for (n of lineNumbers(); track n) {
        <span class="line-number">{{ n }}</span>
      }
    </div>
    <div class="area">
      <pre class="mirror" aria-hidden="true" #mirror><code>@for (token of tokens(); track $index) {<span
        [attr.class]="'tk tk--' + token.kind">{{ token.text }}</span>}</code><br /></pre>
      <span class="probe" aria-hidden="true" #probe>0000000000</span>
      <textarea
        class="input"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        wrap="off"
        [attr.aria-label]="label()"
        [attr.aria-expanded]="isListOpen()"
        [attr.aria-controls]="isListOpen() ? 'sugestoes' : null"
        [attr.aria-activedescendant]="activeOptionId()"
        [value]="draft()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (keyup)="syncCaret()"
        (click)="syncCaret()"
        (focus)="scheduleGhost()"
        (blur)="closeList()"
        (scroll)="onScroll($event)"
        #input
      ></textarea>

      @if (ghost(); as suggestion) {
        <div class="ghost" aria-hidden="true" [style.left.px]="caret().x" [style.top.px]="ghostTop()">
          <span class="ghost-text">{{ suggestion.insert }}</span>
        </div>
        <div class="ghost-actions" [style.top.px]="ghostTop()">
          <button class="ghost-accept" type="button" (pointerdown)="acceptGhost($event)">
            Aceitar sugestão: {{ suggestion.summary }}
            <kbd>Tab</kbd>
          </button>
          <button class="ghost-dismiss" type="button" (pointerdown)="dismissGhost($event)">
            Descartar
          </button>
        </div>
      }

      @if (isListOpen()) {
        <ul
          class="suggestions"
          id="sugestoes"
          role="listbox"
          [attr.aria-label]="'Sugestões para ' + language()"
          [style.left.px]="caret().x"
          [style.top.px]="placeAbove() ? null : caret().y"
          [style.bottom.px]="placeAbove() ? bottomOffset() : null"
        >
          @for (suggestion of suggestions(); track suggestion.label; let i = $index) {
            <li>
              <button
                class="suggestion"
                type="button"
                role="option"
                [id]="'sugestao-' + i"
                [class.suggestion--active]="i === activeIndex()"
                [attr.aria-selected]="i === activeIndex()"
                (pointerdown)="accept(suggestion, $event)"
              >
                <span [attr.class]="'kind tk tk--' + suggestion.kind">{{ suggestion.label }}</span>
                <span class="detail">{{ suggestion.detail }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>

    <p class="live" aria-live="polite">{{ liveMessage() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1;
      min-block-size: 0;
      overflow: hidden;
      background: var(--surface-editor);
      font-family: var(--font-mono);
      font-size: var(--text-code);
      line-height: var(--line-code);
    }

    .gutter {
      display: flex;
      flex-direction: column;
      padding-block: var(--space-3);
      padding-inline: var(--space-3) var(--space-2);
      color: var(--text-dim);
      text-align: end;
      user-select: none;
      overflow: hidden;
    }

    .line-number {
      display: block;
    }

    .area {
      position: relative;
      flex: 1;
      min-inline-size: 0;
    }

    .mirror,
    .input {
      margin: 0;
      padding: var(--space-3) var(--space-4);
      font: inherit;
      letter-spacing: normal;
      tab-size: 2;
      white-space: pre;
      overflow: auto;
      inline-size: 100%;
      block-size: 100%;
    }

    .mirror {
      position: absolute;
      inset: 0;
      color: var(--text-primary);
      pointer-events: none;
    }

    .input {
      position: relative;
      border: none;
      resize: none;
      background: transparent;
      color: transparent;
      caret-color: var(--text-primary);
    }

    .input::selection {
      background: #264f78;
      color: transparent;
    }

    /* Regua invisivel: com fonte monoespacada, uma medida resolve a posicao
       do cursor sem precisar de biblioteca. */
    .probe {
      position: absolute;
      inset-block-start: 0;
      visibility: hidden;
      white-space: pre;
      pointer-events: none;
    }

    /* Texto fantasma: mesma metrica do editor, so mais apagado. */
    .ghost {
      position: absolute;
      z-index: 4;
      color: var(--text-dim);
      font: inherit;
      white-space: pre;
      pointer-events: none;
    }

    .ghost-text {
      opacity: 0.75;
    }

    .ghost-actions {
      position: absolute;
      inset-inline-end: var(--space-4);
      z-index: 6;
      display: flex;
      gap: var(--space-2);
    }

    .ghost-accept,
    .ghost-dismiss {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      font-family: var(--font-ui);
      font-size: 0.75rem;
    }

    .ghost-accept {
      border-color: var(--focus-ring);
    }

    .ghost-dismiss {
      color: var(--text-muted);
    }

    .suggestions {
      position: absolute;
      z-index: 6;
      display: grid;
      max-block-size: 13.75rem;
      min-inline-size: 16rem;
      max-inline-size: min(28rem, 90%);
      margin: 0;
      padding: var(--space-1);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      box-shadow: 0 8px 24px #00000066;
      list-style: none;
      overflow-y: auto;
    }

    .suggestion {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: baseline;
      gap: var(--space-3);
      inline-size: 100%;
      padding: var(--space-2) var(--space-3);
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      text-align: start;
    }

    .suggestion--active {
      background: var(--surface-status);
    }

    .suggestion--active .detail {
      color: var(--text-inverse);
    }

    .kind {
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .suggestion--active .kind {
      color: var(--text-inverse);
    }

    .detail {
      color: var(--text-muted);
      font-family: var(--font-ui);
      font-size: 0.75rem;
      line-height: 1.3;
    }

    .live {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
    }

    .tk--tag {
      color: var(--syntax-tag);
    }
    .tk--bracket {
      color: var(--syntax-bracket);
    }
    .tk--selector {
      color: var(--syntax-selector);
    }
    .tk--property {
      color: var(--syntax-property);
    }
    .tk--value {
      color: var(--syntax-value);
    }
    .tk--atrule {
      color: var(--syntax-atrule);
    }
    .tk--keyword {
      color: var(--syntax-keyword);
    }
    .tk--function {
      color: var(--syntax-function);
    }
    .tk--string {
      color: var(--syntax-string);
    }
    .tk--number {
      color: var(--syntax-number);
    }
    .tk--comment {
      color: var(--syntax-comment);
      font-style: italic;
    }
    .tk--step {
      color: var(--syntax-selector);
    }

    .input:focus-visible {
      outline: 1px solid var(--focus-ring);
      outline-offset: -1px;
    }

    @media (min-inline-size: 1600px) {
      :host {
        font-size: var(--text-code-projector);
      }
    }
  `,
})
export class CodeEditor implements OnDestroy {
  readonly value = input.required<string>();
  readonly language = input.required<SourceFileId>();
  readonly label = input('Editor de código');
  /** Ferramenta da fase — define o que a sugestao automatica pode oferecer. */
  readonly concept = input.required<LevelConcept>();
  /** Desliga a sugestao automatica (fase concluida, solucao na tela). */
  readonly assistEnabled = input(true);
  /**
   * Cada valor novo pede o cursor de volta ao editor. E um input, e nao uma
   * chamada de fora, porque uma referencia guardada pela pagina pode apontar
   * para um editor ja substituido.
   */
  readonly focusRequest = input(0);
  readonly valueChange = output<string>();

  protected readonly draft = signal('');
  protected readonly tokens = computed(() => highlight(this.draft(), this.language()));
  protected readonly lineNumbers = computed(() =>
    Array.from({ length: this.draft().split('\n').length }, (_, i) => i + 1),
  );

  /** Posicao do cursor no texto, e o que a lista de sugestoes acompanha. */
  protected readonly caretIndex = signal(0);
  private readonly dismissed = signal(false);
  protected readonly activeIndex = signal(0);
  /** Muda a cada rolagem para a lista ser reposicionada junto com o texto. */
  private readonly scrolled = signal(0);

  protected readonly suggestions = computed<readonly Completion[]>(() =>
    completionsAt({
      text: this.draft(),
      caret: this.caretIndex(),
      file: this.language(),
    }).slice(0, MAX_SUGGESTIONS),
  );

  protected readonly isListOpen = computed(
    () => !this.dismissed() && this.suggestions().length > 0,
  );

  protected readonly caret = computed<CaretPoint>(() => {
    this.scrolled();
    return this.measureCaret(this.draft(), this.caretIndex());
  });

  protected readonly placeAbove = computed(() => {
    const { y } = this.caret();
    const area = this.input().nativeElement.clientHeight;
    return y + LIST_HEIGHT > area && y > LIST_HEIGHT / 2;
  });

  /** O fantasma comeca na linha do cursor, nao na linha de baixo. */
  protected readonly ghostTop = computed(() => {
    const { y, lineHeight } = this.caret();
    return y - lineHeight;
  });

  protected readonly bottomOffset = computed(() => {
    const { y, lineHeight } = this.caret();
    const area = this.input().nativeElement.clientHeight;
    return Math.max(area - y + lineHeight, 0);
  });

  /** Sugestao de bloco depois de 5 segundos parado; null quando nao ha nenhuma. */
  protected readonly ghost = signal<GhostSuggestion | null>(null);

  /** Opcao em foco, para o leitor de tela acompanhar as setas. */
  protected readonly activeOptionId = computed(() =>
    this.isListOpen() ? `sugestao-${this.activeIndex()}` : null,
  );

  protected readonly liveMessage = computed(() => {
    const ghost = this.ghost();
    if (ghost) return `Sugestão: ${ghost.summary}. Tab aceita, Esc descarta.`;

    const suggestions = this.suggestions();
    if (!this.isListOpen()) return '';

    const active = suggestions[this.activeIndex()];
    return `${suggestions.length} sugestão(ões). ${active?.label ?? ''}: ${active?.detail ?? ''}`;
  });

  private readonly gutter = viewChild.required<ElementRef<HTMLElement>>('gutter');
  private readonly mirror = viewChild.required<ElementRef<HTMLElement>>('mirror');
  private readonly probe = viewChild.required<ElementRef<HTMLElement>>('probe');
  private readonly input = viewChild.required<ElementRef<HTMLTextAreaElement>>('input');
  private readonly injector = inject(Injector);
  private timer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Reflete mudancas vindas de fora (reiniciar fase, mostrar solucao, troca de
    // aba). O texto que volta do proprio editor e ignorado: ele chega de novo
    // pelo `valueChange` e fecharia a lista de sugestoes no meio da digitacao.
    effect(() => {
      const incoming = this.value();
      if (incoming === untracked(this.draft)) return;

      this.draft.set(incoming);
      this.closeList();
    });

    // A assistencia volta a contar sozinha quando e reabilitada (por exemplo,
    // quando os cards de sintaxe saem da frente).
    effect(() => (this.assistEnabled() ? this.scheduleGhost() : this.dismissGhost()));

    effect(() => {
      if (this.focusRequest() <= 0) return;

      // Depois do proximo render: quem pede o foco normalmente acabou de fechar
      // algo que estava por cima do editor.
      afterNextRender(() => this.focusEditor(), { injector: this.injector });
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    clearTimeout(this.idleTimer);
  }

  protected onInput(event: Event): void {
    const field = event.target as HTMLTextAreaElement;
    const closed = autoClose({
      text: field.value,
      caret: field.selectionStart,
      file: this.language(),
    });

    if (closed) {
      this.write(closed.text, closed.caret);
      return;
    }

    this.write(field.value, field.selectionStart);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const ghost = this.ghost();

    if (ghost && event.key === 'Tab') {
      event.preventDefault();
      this.acceptGhost();
      return;
    }

    if (ghost && event.key === 'Escape') {
      event.preventDefault();
      this.dismissGhost();
      return;
    }

    // Qualquer outra tecla recomeca a contagem dos 5 segundos.
    this.scheduleGhost();

    if (!this.isListOpen()) return;

    const suggestions = this.suggestions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab': {
        const chosen = suggestions[this.activeIndex()];
        if (!chosen) return;

        event.preventDefault();
        this.accept(chosen);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.closeList();
        break;
    }
  }

  /** Aceitar por toque tambem: no tablet nao ha Tab nem setas. */
  protected accept(suggestion: Completion, event?: Event): void {
    // `pointerdown` evita que o textarea perca o foco antes do clique chegar.
    event?.preventDefault();

    const edit = applyCompletion(this.draft(), suggestion);
    this.write(edit.text, edit.caret);
    this.closeList();
  }

  protected closeList(): void {
    this.dismissed.set(true);
    this.activeIndex.set(0);
  }

  /** Aceita o bloco sugerido na posicao do cursor. */
  protected acceptGhost(event?: Event): void {
    event?.preventDefault();

    const suggestion = this.ghost();
    if (!suggestion) return;

    const text = this.draft();
    const caret = this.caretIndex();
    this.ghost.set(null);
    this.write(text.slice(0, caret) + suggestion.insert + text.slice(caret), caret + suggestion.insert.length);
    this.closeList();
  }

  protected dismissGhost(event?: Event): void {
    event?.preventDefault();
    clearTimeout(this.idleTimer);
    this.ghost.set(null);
  }

  /**
   * Reinicia a contagem de inatividade. So depois de 5 segundos parado a IDE
   * oferece o proximo trecho — antes disso ela nao interrompe quem esta pensando.
   */
  protected scheduleGhost(): void {
    clearTimeout(this.idleTimer);
    this.ghost.set(null);
    if (!this.assistEnabled()) return;

    this.idleTimer = setTimeout(() => this.offerGhost(), IDLE_MS);
  }

  private offerGhost(): void {
    // Com a lista de sugestoes aberta ja ha uma ajuda na tela; duas atrapalham.
    if (!this.assistEnabled() || this.isListOpen()) return;

    this.ghost.set(
      ghostSuggestion({
        text: this.draft(),
        caret: this.caretIndex(),
        file: this.language(),
        concept: this.concept(),
      }),
    );
  }

  /** Coloca o cursor no editor — usado quando a fase comeca. */
  focusEditor(): void {
    this.input().nativeElement.focus();
  }

  protected syncCaret(): void {
    this.caretIndex.set(this.input().nativeElement.selectionStart);
  }

  protected onScroll(event: Event): void {
    const source = event.target as HTMLTextAreaElement;
    this.gutter().nativeElement.scrollTop = source.scrollTop;
    this.mirror().nativeElement.scrollTop = source.scrollTop;
    this.mirror().nativeElement.scrollLeft = source.scrollLeft;
    this.scrolled.update((n) => n + 1);
  }

  /** Aplica um texto novo no editor mantendo o cursor onde ele deve ficar. */
  private write(text: string, caret: number): void {
    const field = this.input().nativeElement;

    this.draft.set(text);
    this.dismissed.set(false);
    this.activeIndex.set(0);

    if (field.value !== text) field.value = text;
    field.setSelectionRange(caret, caret);
    this.caretIndex.set(caret);

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.valueChange.emit(text), DEBOUNCE_MS);
    this.scheduleGhost();
  }

  /**
   * Posicao do cursor em pixels. A fonte e monoespacada, entao a largura de um
   * caractere (medida na regua invisivel) resolve a coluna, e a altura da linha
   * resolve a linha.
   */
  private measureCaret(text: string, caret: number): CaretPoint {
    const field = this.input().nativeElement;
    const probe = this.probe().nativeElement;
    const charWidth = probe.getBoundingClientRect().width / 10 || 8;
    const lineHeight = probe.getBoundingClientRect().height || 20;

    const before = text.slice(0, caret);
    const lines = before.split('\n');
    const column = lines.at(-1)?.length ?? 0;
    const styles = getComputedStyle(field);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padTop = parseFloat(styles.paddingTop) || 0;

    return {
      x: padLeft + column * charWidth - field.scrollLeft,
      y: padTop + lines.length * lineHeight - field.scrollTop,
      lineHeight,
    };
  }
}
