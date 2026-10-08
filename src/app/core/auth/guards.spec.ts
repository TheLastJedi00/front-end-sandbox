import { entryRoute } from './guards';

describe('entryRoute', () => {
  it('sem login vai para /login, mesmo com papel guardado', () => {
    expect(entryRoute(false, false)).toBe('/login');
    expect(entryRoute(false, true)).toBe('/login');
  });

  it('logado sem papel vai para /papel', () => {
    expect(entryRoute(true, false)).toBe('/papel');
  });

  it('logado e com papel vai para a apresentacao', () => {
    expect(entryRoute(true, true)).toBe('/');
  });
});
