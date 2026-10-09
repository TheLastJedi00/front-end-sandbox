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

- [ ] **T0.1** — `previous-step.ts`: `previousStep(state, decks)` → `Partial<PresentationState> | null`, cobrindo todas as linhas da tabela acima. Testes para cada linha, incluindo o primeiro slide da abertura (`null`).
- [ ] **T0.2** — `class-progress-state.ts`: `classProgress(machines, completions, levelId, startedAt)` → `{ done, total, ratio, complete }`. Ignora o que é anterior a `startedAt`, conta uma conclusão por máquina e fase e só considera conclusões de máquinas presentes. `complete` exige `total ≥ 1`. Testes.

## Fase 1 — Progresso da turma

- [ ] **T1.1** — `machine-id.ts`: extrair o id da máquina de `SolutionAlerts` sem mudar a chave do `localStorage`. `SolutionAlerts` passa a usá-lo, e os testes atuais continuam verdes.
- [ ] **T1.2** — `class-progress.ts`: na máquina do aluno, grava a presença ao seguir a sessão (e de novo a cada `startedAt` novo) e grava a conclusão quando a `sandbox-page` avisar que a fase foi concluída. Só no navegador. Nenhuma escuta nova no aluno.
- [ ] **T1.3** — `class-progress.ts`: na máquina do apresentador, escuta `maquinas` e `conclusoes` desde `startedAt` (refaz a escuta quando `startedAt` muda) e expõe o `classProgress` da fase atual como signal.
- [ ] **T1.4** — `class-progress-popup`: popup fixo no canto, só para o apresentador e só durante o código da fase. Mostra "X de Y alunos terminaram", uma barra que enche com transição em CSS e o botão **Próxima fase** / **Ver o resultado**, sempre ativo. Ao completar, a barra brilha em pulso e o botão ganha destaque. Pode ser recolhido para a pílula "X/Y". Com `prefers-reduced-motion`, sem pulso: muda a cor e ganha um contorno. Anuncia "Todos terminaram" por `role="status"`.
- [ ] **T1.5** — `sandbox-page`: liga o popup e passa a conclusão para o `ClassProgress`. O bloco "Fase concluída!" do apresentador perde o botão de seguir, que agora fica no popup. O aluno continua vendo "O professor leva a turma para a próxima etapa".
- [ ] **T1.6** — Teste de integração com o Firestore real (no mesmo molde de `live-session.integration.spec.ts`, pulado sem credenciais): grava presença e conclusão e confirma que a escuta do apresentador recebe as duas.

## Fase 2 — Reiniciar de qualquer ponto

- [ ] **T2.1** — `session-badge`: botão **Reiniciar apresentação**, só para o apresentador, que abre um diálogo de confirmação próprio (`<dialog>` com foco preso e Esc para cancelar, sem `confirm()`), com o texto "Reiniciar volta todas as máquinas à abertura e apaga o código da turma". Confirmar chama `LiveSession.restart()` e leva para `/`.
- [ ] **T2.2** — `finish-page`: usar o mesmo diálogo, para o reinício ter um caminho só. Manter o botão grande da tela final.

## Fase 3 — Voltar uma etapa

- [ ] **T3.1** — `live-session.ts`: `back()` grava o `previousStep` do estado atual. A navegação de rota do apresentador segue o estado, como os alunos já fazem (`routeOf`).
- [ ] **T3.2** — `slide-deck`: input `canGoBack`. No primeiro slide, com ele ligado, "← Voltar" (e a seta ← do teclado) emite `back` em vez de ficar desabilitado. `concept-overlay` repassa o evento.
- [ ] **T3.3** — `home-page` e `sandbox-page` (conceito): ligam `canGoBack` só no apresentador e chamam `session.back()`. A abertura no primeiro slide continua com o botão desabilitado.
- [ ] **T3.4** — `sandbox-page` (código): botão **← Voltar** na barra de título do apresentador, ao lado do timer, que reabre o conceito no último slide. `finish-page`: botão **← Voltar** para o código da fase 3. O código dos alunos continua salvo.

## Fase 4 — Qualidade e entrega

- [ ] **T4.1** — Testar no navegador, rodando localmente, com uma aba de apresentador e duas de aluno (conta `claude@claude.com`): presença conta 2; a barra enche com uma e com duas conclusões; brilho ao completar; recolher e expandir o popup; reiniciar de uma fase com confirmação, que zera a contagem; voltar por todas as bordas da tabela (código → conceito → fase anterior → abertura, e fim → código), com os alunos seguindo e o código preservado.
- [ ] **T4.2** — `README.md`: seção do apresentador com o popup de progresso, o reiniciar e o voltar. Atualizar o roteiro onde ele fala em "Próxima fase".
- [ ] **T4.3** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

- **Q.1** — Um aluno que mostrou a solução conta como concluído, como diz o contexto. A pílula deveria mostrar à parte quantos usaram a solução (ex.: "7/12 · 2 com solução")? *Recomendado: não. O alerta da spec 004 já avisa, e o popup fica mais simples.*
- **Q.2** — Ao voltar do código para o conceito, o timer daquela fase é zerado (decisão do contexto). Quando o professor fechar o conceito de novo, o timer começa outra vez com 3 minutos cheios, como hoje. *Recomendado: manter, porque o caso é raro.*
- **Q.3** — O popup aparece assim que o código da fase abre, mesmo com "0 de 12", ou só a partir da primeira conclusão? *Recomendado: desde o início, porque o "0 de 12" já confirma que as máquinas se registraram.*
