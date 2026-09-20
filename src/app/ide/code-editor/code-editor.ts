import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { SourceFileId } from '../../core/models';
import { highlight } from './highlight';

const DEBOUNCE_MS = 150;

/**
 * Editor proprio: um `<textarea>` transparente sobre um `<pre>` espelhado.
 * A sintaxe aceita aqui e minuscula, entao nao vale trazer um Monaco/CodeMirror
 * inteiro — e o editor simples evita prometer ao aluno uma IDE completa.
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
      <textarea
        class="input"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        wrap="off"
        [attr.aria-label]="label()"
        [value]="draft()"
        (input)="onInput($event)"
        (scroll)="onScroll($event)"
      ></textarea>
    </div>
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
  readonly valueChange = output<string>();

  protected readonly draft = signal('');
  protected readonly tokens = computed(() => highlight(this.draft(), this.language()));
  protected readonly lineNumbers = computed(() =>
    Array.from({ length: this.draft().split('\n').length }, (_, i) => i + 1),
  );

  private readonly gutter = viewChild.required<ElementRef<HTMLElement>>('gutter');
  private readonly mirror = viewChild.required<ElementRef<HTMLElement>>('mirror');
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Reflete mudancas vindas de fora (reiniciar fase, mostrar solucao, troca de aba).
    effect(() => this.draft.set(this.value()));
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.draft.set(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.valueChange.emit(text), DEBOUNCE_MS);
  }

  protected onScroll(event: Event): void {
    const source = event.target as HTMLTextAreaElement;
    this.gutter().nativeElement.scrollTop = source.scrollTop;
    this.mirror().nativeElement.scrollTop = source.scrollTop;
    this.mirror().nativeElement.scrollLeft = source.scrollLeft;
  }
}
