import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * Configuracao web do projeto. Nao e segredo: identifica o app para o Firebase,
 * e quem protege os dados sao as regras do Firestore (`firestore.rules`).
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAKRQ_8-ND70vPQgboJin7Dy65Qt7h8Gec',
  authDomain: 'front-end-sandbox-91f5f.firebaseapp.com',
  projectId: 'front-end-sandbox-91f5f',
  storageBucket: 'front-end-sandbox-91f5f.firebasestorage.app',
  messagingSenderId: '35866380210',
  appId: '1:35866380210:web:b67880bea66c09c84dc6ab',
};

export interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;
}

let services: FirebaseServices | null = null;

/**
 * Inicia o Firebase na primeira chamada e devolve sempre a mesma instancia.
 * So pode ser chamado no navegador: no prerender nao ha sessao nem rede, e os
 * servicos que dependem daqui ficam inertes (ver `injectIsBrowser`).
 */
export function firebase(): FirebaseServices {
  if (services) return services;

  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  services = {
    app,
    // Login guardado no navegador: um F5 no meio da aula nao desloga.
    auth: initializeAuth(app, { persistence: browserLocalPersistence }),
    db: getFirestore(app),
  };
  return services;
}
