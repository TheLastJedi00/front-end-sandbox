import { loadTestCredentials } from './test-credentials';

describe('loadTestCredentials', () => {
  it('le a conta de teste quando o arquivo existe, ou devolve null sem ele', async () => {
    const credentials = await loadTestCredentials();
    if (credentials === null) {
      pending('test-credentials.json ausente: testes de integracao pulados');
      return;
    }
    expect(credentials.email).toContain('@');
    expect(credentials.password.length).toBeGreaterThan(0);
  });
});
