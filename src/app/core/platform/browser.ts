import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

/**
 * O sandbox e 100% client-side: game loop, teclado e localStorage nao existem
 * durante a prerenderizacao. Tudo que toca `window` passa por aqui.
 */
export function injectIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}
