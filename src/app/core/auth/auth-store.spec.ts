import { loginErrorMessage } from './auth-store';

describe('loginErrorMessage', () => {
  it('credencial errada vira uma mensagem unica, sem dizer o que errou', () => {
    for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']) {
      expect(loginErrorMessage({ code })).toBe('E-mail ou senha incorretos.');
    }
  });

  it('sem rede, avisa da conexao', () => {
    expect(loginErrorMessage({ code: 'auth/network-request-failed' })).toContain('conexão');
  });

  it('erro desconhecido tem mensagem generica', () => {
    expect(loginErrorMessage(new Error('x'))).toBe('Não foi possível entrar. Tente de novo.');
    expect(loginErrorMessage(null)).toBe('Não foi possível entrar. Tente de novo.');
  });
});
