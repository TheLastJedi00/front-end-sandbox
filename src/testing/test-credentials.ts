export interface TestCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Le a conta do usuario de teste, servida so no `ng test` a partir do
 * `test-credentials.json` da raiz (ignorado pelo git). Sem o arquivo, devolve
 * `null` e os testes de integracao com o Firestore real sao pulados.
 */
export async function loadTestCredentials(): Promise<TestCredentials | null> {
  try {
    const response = await fetch('/test-credentials.json');
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null) return null;

    const { email, password } = data as Record<string, unknown>;
    return typeof email === 'string' && typeof password === 'string' ? { email, password } : null;
  } catch {
    return null;
  }
}
