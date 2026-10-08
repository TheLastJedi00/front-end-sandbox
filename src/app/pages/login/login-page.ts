import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore, loginErrorMessage } from '../../core/auth/auth-store';

/**
 * Entrada da maquina na apresentacao. O professor faz login com a conta dele em
 * cada computador da sala; nao ha cadastro aqui, a conta nasce no console.
 */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">sandbox-front-end</p>
        <h1 class="title">Entrar na apresentação</h1>
        <p class="lead">Use a conta do professor. Ela liga esta máquina à aula ao vivo.</p>

        <label class="field">
          <span class="label">E-mail</span>
          <input
            class="input"
            type="email"
            formControlName="email"
            autocomplete="username"
            inputmode="email"
            required
          />
        </label>

        <label class="field">
          <span class="label">Senha</span>
          <input
            class="input"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            required
          />
        </label>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button class="submit" type="submit" [disabled]="form.invalid || sending()">
          {{ sending() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    .page {
      display: grid;
      place-items: center;
      min-block-size: 100dvh;
      padding: var(--space-4);
      background:
        radial-gradient(60rem 30rem at 15% -10%, #0b3a63 0%, transparent 70%),
        radial-gradient(48rem 26rem at 100% 100%, #2a1d4d 0%, transparent 70%),
        var(--surface-app);
    }

    .card {
      display: grid;
      gap: var(--space-4);
      inline-size: min(26rem, 100%);
      padding: var(--space-8);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--surface-panel);
      box-shadow: 0 2rem 6rem -2rem #000;
    }

    .eyebrow {
      margin: 0;
      color: var(--state-hint);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
    }

    .title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .lead {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .field {
      display: grid;
      gap: var(--space-1);
    }

    .label {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .input {
      padding: var(--space-3);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-editor);
      color: var(--text-primary);
      font: inherit;
    }

    .input:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 1px;
    }

    .error {
      margin: 0;
      color: var(--state-error);
      font-size: 0.875rem;
    }

    .submit {
      padding: var(--space-3);
      border: none;
      border-radius: var(--radius-md);
      background: var(--surface-status);
      color: var(--text-inverse);
      font-size: 1rem;
      font-weight: 600;
    }

    .submit:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.sending()) return;

    this.sending.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      await this.router.navigate(['/papel']);
    } catch (error) {
      this.error.set(loginErrorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }
}
