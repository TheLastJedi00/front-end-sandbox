# Tasks — 006 Progresso da turma e controle do apresentador

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/progresso-da-turma` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

Duas subcoleções novas na sessão (aprovadas pelo usuário) e uma função pura de "passo anterior".
O documento `sessoes/{uid}` e as regras do Firestore não mudam.

```
src/app/core/session/
  machine-id.ts               # NOVO — id aleatorio da maquina (sai de SolutionAlerts, que passa a usar este)
  class-progress.ts           # NOVO — presenca e conclusoes: gravacao (aluno) e escuta (apresentador)
  class-progress-state.ts     # NOVO — contagem pura: concluidos / presentes, desde `startedAt`
  previous-step.ts            # NOVO — o passo anterior da aula, puro, sobre PresentationState
  live-session.ts             # back(): grava o passo anterior
  session-badge/              # botao "Reiniciar apresentacao" (so apresentador) + confirmacao
  class-progress-popup/       # NOVO — popup com barra, contagem, brilho e botao de seguir
src/app/slides/slide-deck/    # input `canGoBack` + output `back` no primeiro slide
src/app/pages/home, sandbox, finish   # ligam o voltar e o popup
```

### Dados novos

| Caminho | Quem grava | Campos | Quando |
| --- | --- | --- | --- |
| `sessoes/{uid}/maquinas/{maquina}` | aluno | `{ at }` | ao seguir a sessão como aluno, e de novo se `startedAt` mudar |
| `sessoes/{uid}/conclusoes/{maquina}-{fase}` | aluno | `{ levelId, machine, at }` | uma vez, quando a missão da fase fica concluída |

O apresentador escuta as duas com `where('at', '>=', startedAt)`. A conta é feita localmente.

### O passo anterior

| Estado atual | Passo anterior |
| --- | --- |
| `abertura`, deck ≠ início | `retreat` no deck da abertura |
| `abertura`, deck no início | nenhum |
| `fase N`, conceito aberto, deck ≠ início | `retreat` no deck do conceito |
| `fase N`, conceito aberto, deck no início, N > 1 | `fase N−1`, conceito fechado, timer parado |
| `fase 1`, conceito aberto, deck no início | `abertura`, último slide completo |
| `fase N`, conceito fechado (código) | `fase N`, conceito aberto no último slide completo, timer parado |
| `fim` | `fase 3`, conceito fechado, timer parado |

O "← Voltar" dentro do deck continua local (etapa por etapa, como hoje). A função nova só cuida das
bordas entre estágios.

---

## Fase 0 — Regras puras

- [x] **T0.1** — `previous-step.ts`: `previousStep(state, decks)` → `Partial<PresentationState> | null`, cobrindo todas as linhas da tabela acima. Testes para cada linha, incluindo o primeiro slide da abertura (`null`).
- [x] **T0.2** — `class-progress-state.ts`: `classProgress(machines, completions, levelId, startedAt)` → `{ done, total, ratio, complete }`. Ignora o que é anterior a `startedAt`, conta uma conclusão por máquina e fase e só considera conclusões de máquinas presentes. `complete` exige `total ≥ 1`. Testes.

## Fase 1 — Progresso da turma

- [x] **T1.1** — `machine-id.ts`: extrair o id da máquina de `SolutionAlerts` sem mudar a chave do `localStorage`. `SolutionAlerts` passa a usá-lo, e os testes atuais continuam verdes.
- [x] **T1.2** — `class-progress.ts`: na máquina do aluno, grava a presença ao seguir a sessão (e de novo a cada `startedAt` novo) e grava a conclusão quando a `sandbox-page` avisar que a fase foi concluída. Só no navegador. Nenhuma escuta nova no aluno.
- [x] **T1.3** — `class-progress.ts`: na máquina do apresentador, escuta `maquinas` e `conclusoes` desde `startedAt` (refaz a escuta quando `startedAt` muda) e expõe o `classProgress` da fase atual como signal.
- [x] **T1.4** — `class-progress-popup`: popup fixo no canto, só para o apresentador e só durante o código da fase. Mostra "X de Y alunos terminaram", uma barra que enche com transição em CSS e o botão **Próxima fase** / **Ver o resultado**, sempre ativo. Ao completar, a barra brilha em pulso e o botão ganha destaque. Pode ser recolhido para a pílula "X/Y". Com `prefers-reduced-motion`, sem pulso: muda a cor e ganha um contorno. Anuncia "Todos terminaram" por `role="status"`.
- [x] **T1.5** — `sandbox-page`: liga o popup e passa a conclusão para o `ClassProgress`. O bloco "Fase concluída!" do apresentador perde o botão de seguir, que agora fica no popup. O aluno continua vendo "O professor leva a turma para a próxima etapa".
- [x] **T1.6** — Teste de integração com o Firestore real (no mesmo molde de `live-session.integration.spec.ts`, pulado sem credenciais): grava presença e conclusão e confirma que a escuta do apresentador recebe as duas.

## Fase 2 — Reiniciar de qualquer ponto

- [x] **T2.1** — `session-badge`: botão **Reiniciar apresentação**, só para o apresentador, que abre um diálogo de confirmação próprio (`<dialog>` com foco preso e Esc para cancelar, sem `confirm()`), com o texto "Reiniciar volta todas as máquinas à abertura e apaga o código da turma". Confirmar chama `LiveSession.restart()` e leva para `/`.
- [x] **T2.2** — `finish-page`: usar o mesmo diálogo, para o reinício ter um caminho só. Manter o botão grande da tela final.

## Fase 3 — Voltar uma etapa

- [x] **T3.1** — `live-session.ts`: `back()` grava o `previousStep` do estado atual. A navegação de rota do apresentador segue o estado, como os alunos já fazem (`routeOf`).
- [x] **T3.2** — `slide-deck`: input `canGoBack`. No primeiro slide, com ele ligado, "← Voltar" (e a seta ← do teclado) emite `back` em vez de ficar desabilitado. `concept-overlay` repassa o evento.
- [x] **T3.3** — `home-page` e `sandbox-page` (conceito): ligam `canGoBack` só no apresentador e chamam `session.back()`. A abertura no primeiro slide continua com o botão desabilitado.
- [x] **T3.4** — `sandbox-page` (código): botão **← Voltar** na barra de título do apresentador, ao lado do timer, que reabre o conceito no último slide. `finish-page`: botão **← Voltar** para o código da fase 3. O código dos alunos continua salvo.

## Fase 4 — Qualidade e entrega

- [x] **T4.1** — Testar no navegador, rodando localmente, com uma aba de apresentador e duas de aluno (conta `claude@claude.com`): presença conta 2; a barra enche com uma e com duas conclusões; brilho ao completar; recolher e expandir o popup; reiniciar de uma fase com confirmação, que zera a contagem; voltar por todas as bordas da tabela (código → conceito → fase anterior → abertura, e fim → código), com os alunos seguindo e o código preservado.
- [x] **T4.2** — `README.md`: seção do apresentador com o popup de progresso, o reiniciar e o voltar. Atualizar o roteiro onde ele fala em "Próxima fase".
- [x] **T4.3** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Tomadas pela recomendação (o usuário mandou executar sem responder):**

- **Q.1 — A pílula não separa quem usou a solução.** O aviso de solução da spec 004 já informa o professor. ✅
- **Q.2 — Voltar para o código zera o timer da fase**, e ele recomeça com 3 minutos quando o conceito fecha de novo. ✅
- **Q.3 — O popup aparece desde "0 de N"**, o que confirma que as máquinas se registraram. ✅

**Decididas durante a execução (recomendação tomada, destacadas no PR):**

- **Q.4 — A tela do apresentador só muda de rota depois que a sessão chega lá.** Navegar antes
  faria a página da fase achar que o apresentador entrou sozinho e reabrir o conceito do começo
  (`enterLevel`). O `SessionFollower` guarda a rota de destino do "Voltar" e navega quando o
  snapshot local já mostra o estado novo.
- **Q.5 — O horário gravado pelo aluno nunca é anterior ao `startedAt`** (`max(agora, startedAt)`).
  Um relógio alguns segundos atrasado faria a máquina parecer de uma aula passada e não ser contada.
- **Q.6 — A abertura não ganhou `canGoBack`.** Antes do primeiro slide dela não há passo
  anterior, e o "Voltar" interno do deck já funcionava. Só o conceito das fases liga a saída para
  trás.
- **Q.7 — `aluno2.localhost` entrou nos `allowedHosts` do `ng serve`**, para testar com dois
  alunos no mesmo computador (cada origem tem o próprio `localStorage`, e com ele o próprio id
  de máquina).

**Teste no navegador** (apresentador em `localhost`, alunos em `aluno.localhost` e
`aluno2.localhost`, porta 4300): reinício com confirmação; "0 de 2" ao abrir o código da fase 1;
"1 de 2" depois de um aluno mostrar a solução; "2 de 2" com brilho depois de o outro escrever o
código; pílula recolhida "2/2"; código → conceito (último slide, timer parado, código do aluno
preservado); primeiro slide do conceito da fase 1 → último slide da abertura; primeiro slide do
conceito da fase 2 → código da fase 1; fim → código da fase 3; reinício a partir do código da
fase 3 → de volta a "0 de 2". Os alunos acompanharam em todos os passos. Uma aba de aluno em
segundo plano demorou a seguir, porque o Chrome desacelera abas inativas, e alcançou ao ser
ativada.

**Observação:** o popup volta aberto quando o conceito é reaberto e fechado de novo. O estado de
recolhido vive no componente, que é recriado. Não pareceu valer guardá-lo.
