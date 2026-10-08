# Tasks — 004 Controle ao vivo com Firebase

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/controle-ao-vivo` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

O `engine/`, as fases e o conteúdo dos slides não mudam. O que muda:

```
src/app/
  core/
    firebase/firebase.ts        # NOVO — config + init preguiçoso, só no navegador
    auth/
      auth-store.ts             # NOVO — usuário logado como signal, login/logout
      guards.ts                 # NOVO — authGuard e roleGuard
    session/
      role-store.ts             # NOVO — papel da máquina (apresentador | aluno) no localStorage
      presentation-state.ts     # NOVO — modelo do documento + parse/defaults (puro)
      phase-timer.ts            # NOVO — start/pause/resume/reset/restante (puro)
      live-session.ts           # NOVO — onSnapshot -> signal; gravações do apresentador
      session-follower.ts       # NOVO — aluno: leva o router para onde a sessão está
      solution-alerts.ts        # NOVO — aluno avisa "mostrou a solução"; apresentador recebe
  pages/
    login/                      # NOVO — /login (formulário reativo)
    role/                       # NOVO — /papel (apresentador ou aluno)
    home, sandbox, finish       # passam a ler/gravar a sessão conforme o papel
  slides/slide-deck/            # modo controlado: posição vem de fora, controles ocultos no aluno
  ide/phase-timer/              # NOVO — relógio na barra de título
firestore.rules, firebase.json  # NOVO — regras versionadas
```

Princípios mantidos: lógica pura e testável fora dos componentes, `OnPush`, signals, `inject()`,
animação só em CSS. Firebase **só no navegador**: no prerender os guards liberam e os serviços
ficam inertes.

### Documento `sessoes/{uid}`

```ts
interface PresentationState {
  stage: 'abertura' | 'fase' | 'fim';
  levelId: number;                 // 1..3, usado quando stage = 'fase'
  deck: { slide: number; step: number };
  conceptOpen: boolean;
  timer: {
    status: 'parado' | 'rodando' | 'pausado';
    endsAt: number | null;         // epoch ms, quando rodando
    remainingMs: number;           // quanto falta, quando pausado/parado
  };
  updatedAt: Timestamp;            // serverTimestamp()
}

// sessoes/{uid}/alertas/{auto-id} — gravado pelo aluno, lido pelo apresentador
interface SolutionAlert {
  levelId: number;
  machine: string;                 // id aleatório da máquina, guardado no localStorage
  at: Timestamp;                   // serverTimestamp()
}
```

---

## Fase 0 — Firebase no projeto

- [ ] **T0.1** — Dependência `firebase` (SDK modular) e `core/firebase/firebase.ts` com a config do projeto `front-end-sandbox-91f5f`. Init preguiçoso e só no navegador; sem Analytics. `npm run build` continua prerenderizando.
- [ ] **T0.2** — `firestore.rules` e `firebase.json` no repositório: `sessoes/{uid}` e as subcoleções dele lidos/gravados só pelo próprio `uid`; resto negado. Deploy das regras com `firebase deploy --only firestore:rules` (ver **Q.4**).
- [ ] **T0.3** — Credenciais de teste: `test-credentials.json` ignorado pelo git, servido só no `ng test` (assets da config de teste), com um `test-credentials.example.json` versionado. Helper que lê o arquivo e marca os testes de integração como pulados quando ele não existe (ver **Q.3**).

## Fase 1 — Login e papel

- [ ] **T1.1** — `core/auth/auth-store`: `user` como signal vindo de `onAuthStateChanged`, `ready` para saber quando o Firebase já respondeu, `login(email, senha)` e `logout()`. Persistência local (F5 não desloga).
- [ ] **T1.2** — `pages/login`: rota `/login` com formulário reativo (e-mail, senha), botão desabilitado enquanto envia, erros do Firebase traduzidos para português ("E-mail ou senha incorretos", "Sem conexão"…).
- [ ] **T1.3** — `core/session/role-store` + `pages/role`: rota `/papel` com dois botões grandes, **Entrar como apresentador** e **Entrar como aluno**; a escolha fica no `localStorage`.
- [ ] **T1.4** — `core/auth/guards`: sem login → `/login`; sem papel → `/papel`; já logado e com papel, `/login` e `/papel` levam à apresentação. No servidor (prerender) os guards liberam. Rotas novas no `app.routes.server.ts`.
- [ ] **T1.5** — Botão discreto **Sair** (logout + limpa o papel) acessível no deck e na IDE.

## Fase 2 — Sessão ao vivo

- [ ] **T2.1** — `core/session/presentation-state`: modelo, estado inicial e `parsePresentationState(unknown)` tolerante a documento ausente ou incompleto. Testes unitários.
- [ ] **T2.2** — `core/session/phase-timer`: `PHASE_DURATION_MS = 180_000`, `startTimer`, `pauseTimer`, `resumeTimer`, `resetTimer`, `remainingMs(timer, now)`, `isExpired`. Funções puras com testes (inclusive pausar/retomar e o zero).
- [ ] **T2.3** — `core/session/live-session`: escuta `sessoes/{uid}` com `onSnapshot` e expõe o estado como signal; métodos de gravação do apresentador (`setDoc` com `merge` + `updatedAt: serverTimestamp()`); `connected`/`pendingWrites` para indicar sincronia.
- [ ] **T2.4** — Testes de integração **no Firestore real** com o usuário de teste: login, gravar e ler `sessoes/{uid}`, `onSnapshot` recebendo a mudança, e a regra negando o documento de outro `uid`. Limpam o que gravaram.

## Fase 3 — Apresentação sincronizada

- [ ] **T3.1** — `slides/slide-deck`: modo controlado — `position` pode vir de fora e cada movimento sai por um `output`; com `readonly`, botões, teclado, toque e swipe ficam desligados (o aluno só assiste). Testes da navegação continuam passando.
- [ ] **T3.2** — Abertura (`/`): apresentador grava `stage: 'abertura'` e cada `deck`; aluno exibe a posição recebida. Ao terminar o deck, o apresentador leva todos para a fase 1.
- [ ] **T3.3** — `core/session/session-follower`: na máquina do aluno, quando `stage`/`levelId` mudam, o router vai para `/`, `/sandbox/:id` ou `/fim`. Quem entra no meio da aula cai direto onde a turma está.
- [ ] **T3.4** — Fase (`/sandbox/:id`): o mini-deck de conceito abre e fecha conforme `conceptOpen`, com o `deck` sincronizado; "Próxima fase" e "Pular" só no apresentador. No aluno, o `BriefingStore` deixa de decidir se o conceito aparece.
- [ ] **T3.5** — Fim (`/fim`): sincronizado; "Jogar de novo"/"Voltar ao início" só no apresentador, que ganha **Reiniciar apresentação** (zera a sessão e volta todos à abertura).
- [ ] **T3.6** — Apresentador que dá F5 retoma de onde a sessão está, em vez de recomeçar a abertura.
- [ ] **T3.7** — Alerta de solução (ver **Q.1**): no aluno, "Mostrar solução" continua livre e grava um alerta em `sessoes/{uid}/alertas`; no apresentador, um popup na tela ("Uma máquina mostrou a solução da fase N") que some sozinho e pode ser fechado. Só contam alertas da aula atual (depois do último "Reiniciar apresentação"), e alertas próximos viram um só ("3 máquinas…").

## Fase 4 — Timer de 3 minutos

- [ ] **T4.1** — `ide/phase-timer`: relógio `mm:ss` na barra de título da IDE, calculado localmente a partir de `endsAt` (sem gravar por segundo); cor de alerta no último minuto; anúncio `aria-live` a cada minuto e no zero.
- [ ] **T4.2** — O timer inicia quando o apresentador fecha o conceito e zera ao trocar de fase. Controles **Pausar/Retomar** e **Reiniciar** só no apresentador.
- [ ] **T4.3** — Ao zerar: aviso "Tempo esgotado" em todas as máquinas, sem bloquear o editor.

## Fase 5 — Qualidade e entrega

- [ ] **T5.1** — Testar no navegador, rodando localmente, com `claude@claude.com`: login, `/papel`, duas abas (apresentador + aluno) seguindo abertura → conceito → fase → fim, timer (pausar, retomar, zerar), F5 nas duas abas e queda de rede.
- [ ] **T5.2** — Atualizar o `README.md`: login, papéis, sessão ao vivo, timer, como configurar o Firebase e rodar os testes de integração.
- [ ] **T5.3** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Decididas pelo usuário em 2026-10-08:**

- **Q.1 — "Mostrar solução" e "Reiniciar fase" continuam livres no aluno**, mas mostrar a solução **alerta o professor com um popup na tela dele** (T3.7). ✅
- **Q.2 — Tempo esgotado só avisa**, sem botão de +1 min. ✅
- **Q.3 — Credenciais em `test-credentials.json`**, ignorado pelo git e servido só no `ng test`, com a conta `claude@claude.com`. ✅
- **Q.4 — As regras são publicadas por deploy** (`firebase deploy --only firestore:rules`). O login do `firebase-tools` é interativo e fica com o usuário (`! npx firebase-tools login`). ✅
- **Q.5 — O aluno fica no conceito** até o professor fechar para todos. ✅
