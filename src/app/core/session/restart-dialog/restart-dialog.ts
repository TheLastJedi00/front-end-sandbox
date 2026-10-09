import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LiveSession } from '../live-session';

/**
 * Confirmacao do "Reiniciar apresentacao". Reiniciar apaga o codigo de toda a
 * turma, entao pede um segundo clique — num `<dialog>` modal, que prende o
 * foco e fecha com Esc, e nao no `confirm()` do navegador.
 */
@Component({
  selector: 'app-restart-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="dialog" aria-labelledby="restart-title" (click)="onBackdrop($event)">
      <h2 id="restart-title" class="title">Reiniciar a apresentação?</h2>
      <p class="text">
        Reiniciar volta todas as máquinas à abertura e apaga o código da turma.
      </p>
      <div class="actions">
        <button class="button" type="button" autofocus (click)="close()">Cancelar</button>
        <button class="button button--danger" type="button" (click)="confirm()">
          Reiniciar
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .dialog {
      inline-size: min(26rem, calc(100vw - 2rem));
      padding: var(--space-6);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      background: var(--surface-panel);
      color: var(--text-primary);
      box-shadow: 0 2rem 6rem -2rem #000;
    }

    .dialog::backdrop {
      background: color-mix(in srgb, #000 65%, transparent);
    }

    .title {
      margin: 0 0 var(--space-2);
      font-size: 1.125rem;
    }

    .text {
      margin: 0 0 var(--space-6);
      color: var(--text-muted);
      line-height: 1.5;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    .button {
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      color: var(--text-primary);
      font-weight: 600;
    }

    .button:hover {
      border-color: var(--focus-ring);
    }

    .button--danger {
      border-color: var(--state-error);
      background: color-mix(in srgb, var(--state-error) 22%, transparent);
    }
  `,
})
export class RestartDialog {
  private readonly session = inject(LiveSession);
  private readonly router = inject(Router);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected async confirm(): Promise<void> {
    this.close();
    void this.session.restart();
    await this.router.navigate(['/']);
  }

  /** Clicar fora da caixa (no fundo escurecido) e o mesmo que cancelar. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
