# Tasks — 002 Apresentação guiada e Assistência

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/apresentacao-assistencia` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

O que muda em relação à spec 001 (nada do `engine/` precisa ser reescrito):

```
src/app/
  slides/                   # NOVO — deck de apresentação
    slide-deck/             # casca do deck: navegação, teclado, toque, progresso
    slide/                  # um slide (título, corpo, ilustração)
    slide-definitions.ts    # conteúdo declarativo: abertura + slide de cada fase
  assist/                   # NOVO — assistência dentro da IDE (TypeScript puro)
    vocabulary.ts           # vocabulário permitido por fase e por arquivo
    completion.ts           # sugestão de palavra e fechamento de tag/bloco
    ghost-suggestion.ts     # próximo trecho de código, determinístico ("IA")
    syntax-cards.ts         # cards de sintaxe por fase
  ide/
    code-editor/            # ganha autocomplete + texto fantasma
    syntax-cards/           # NOVO — cards exibidos antes de o aluno digitar
  levels/                   # fases redivididas por ferramenta
```

Princípios mantidos: `assist/` é puro e testável (sem DOM do Angular), componentes `OnPush`,
estado em signals, nenhuma dependência nova.

---

## Fase 0 — Redivisão das fases por ferramenta

- [x] **T0.1** — `core/models/validation`: separar os `LevelCheckId` de estrutura (HTML) dos de cor (CSS) e reagrupar os comentários por fase.
- [x] **T0.2** — `levels/level-definitions`: **Fase 1 = HTML puro** — só a aba `index.html`, checks `sky-exists`, `ball-inside-sky`, `ground-inside-sky`; sem cores no enunciado, nas dicas e na solução.
- [x] **T0.3** — `levels/level-definitions`: **Fase 2 = CSS** — starter já com o HTML pronto, checks de cor (`sky-blue`, `ball-red`, `ground-green`) somados aos de animação; enunciado cobrindo aparência e movimento.
- [x] **T0.4** — `levels/level-definitions`: **Fase 3 = JS** — ajustar starter/solução para herdar o CSS completo da nova Fase 2 (comportamento do jogo inalterado).
- [x] **T0.5** — `engine/validation/level-validator`: adequar a avaliação à nova distribuição de checks (a Fase 1 não olha mais para o CSS).
- [x] **T0.6** — Atualizar os testes do validador e das fases para a nova divisão.
- [x] **T0.7** — `core/services/code-storage`: invalidar o código salvo de versões anteriores, para o aluno não reabrir a Fase 1 com CSS num formato que não existe mais (ver **Q.2**).

## Fase 1 — Deck de apresentação

- [x] **T1.1** — `slides/slide`: componente de um slide — título, corpo, ilustração opcional, entrada animada em CSS puro, legível projetado em 16:9.
- [x] **T1.2** — `slides/slide-deck`: casca do deck — avançar/voltar, indicador de posição, botão "Pular para o jogo".
- [x] **T1.3** — `slides/slide-deck`: navegação por teclado (setas, espaço, `Esc`) e por toque (swipe e áreas de toque), já que os alunos usam tablets.
- [x] **T1.4** — `slides/slide-definitions`: conteúdo da abertura — o que é front-end e como HTML, CSS e JS se relacionam (estrutura, aparência, comportamento).
- [x] **T1.5** — Substituir a tela de abertura atual: `pages/home` passa a renderizar o deck e, ao fim, encaminha para `sandbox/1`.
- [x] **T1.6** — Identidade visual do deck: gradientes, tipografia grande e animação de entrada, reaproveitando os design tokens do tema da IDE.

## Fase 2 — Slide de conceito antes de cada fase

- [x] **T2.1** — `slides/slide-definitions`: um slide de conceito por fase (HTML, CSS, JS) mostrando a sintaxe que será usada logo em seguida.
- [x] **T2.2** — `core/models/level`: o vinculo com o slide e o proprio `concept` (tipo `LevelConcept` extraido), via `conceptSlide(concept)` — um segundo campo diria a mesma coisa.
- [x] **T2.3** — `pages/sandbox`: exibir o slide da fase ao entrar nela, antes da IDE, com "Começar" e "Pular" (ver **Q.1**).
- [x] **T2.4** — O slide não reaparece ao voltar para uma fase já iniciada na mesma sessão, para o apresentador não perder tempo.

## Fase 3 — Assistência: cards de sintaxe

- [x] **T3.1** — `assist/syntax-cards`: cards declarativos por fase (o que é a sintaxe, exemplo mínimo, erro comum).
- [x] **T3.2** — `ide/syntax-cards`: componente que mostra os cards sobre a área do editor antes de o aluno digitar.
- [x] **T3.3** — Os cards somem na primeira tecla digitada e voltam por um botão discreto na barra da IDE.

## Fase 4 — Assistência: autocomplete e sugestão de palavra

- [x] **T4.1** — `assist/vocabulary`: vocabulário permitido por fase e por arquivo (`sky`, `ball`, `ground`, `color`, `animation`, `inicio|meio|fim`, `position`, `key`, `avancar`, `recuar`, `element`).
- [x] **T4.2** — `assist/completion`: dado o texto e a posição do cursor, devolver as sugestões ordenadas para o token em digitação.
- [x] **T4.3** — `assist/completion`: fechamento automático de tag (`<ball>` → `</ball>`) e de bloco (`{` → `}`) com o cursor no lugar certo.
- [x] **T4.4** — `ide/code-editor`: lista de sugestões ancorada no cursor, navegável por setas, `Enter`/`Tab` aceita, `Esc` fecha — sem quebrar o realce espelhado nem a rolagem sincronizada.
- [x] **T4.5** — Aceitar sugestão por toque, para quem está no tablet.
- [x] **T4.6** — Testes unitários de `vocabulary` e `completion`.

## Fase 5 — Sugestão de código simulando IA

- [x] **T5.1** — `assist/ghost-suggestion`: a partir da fase e do código já escrito, devolver o próximo trecho plausível — determinístico, local, sem rede.
- [x] **T5.2** — `ide/code-editor`: temporizador de **5 segundos** sem digitação que dispara a sugestão; qualquer tecla cancela e reinicia a contagem.
- [x] **T5.3** — `ide/code-editor`: renderizar a sugestão como texto fantasma no `<pre>` espelhado, com `Tab` para aceitar e `Esc` para descartar.
- [x] **T5.4** — Botão equivalente na tela ("Aceitar sugestão") para o uso no tablet.
- [x] **T5.5** — Não sugerir quando a fase já está concluída nem quando a solução está sendo mostrada.
- [x] **T5.6** — Testes unitários de `ghost-suggestion` cobrindo cada fase e o código parcialmente escrito.

## Fase 6 — Qualidade e entrega

- [x] **T6.1** — Acessibilidade: deck navegável por teclado com foco visível, `aria-live` na lista de sugestões e no texto fantasma, cards anunciáveis por leitor de tela.
- [x] **T6.2** — Performance: nenhuma sugestão calculada por frame; deck animado só em CSS; `OnPush` em tudo que for novo.
- [x] **T6.3** — Atualizar o `README.md` — nova divisão das fases, deck e recursos de assistência no roteiro de 15 minutos.
- [x] **T6.4** — Testar no navegador, rodando localmente: deck de abertura, slide de cada fase e as três fases de ponta a ponta com a assistência ativa (exigência do SDD).
- [x] **T6.5** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Decididas pelo usuário em 2026-09-19:**

- **Q.1 — (a) Overlay** dentro de `sandbox/:levelId`. ✅
- **Q.2 — Versionar a chave do `localStorage`** e descartar o código antigo silenciosamente. ✅
- **Q.3 — Bloco.** A sugestão fantasma completa o **bloco inteiro**, não apenas a linha atual. ✅
- **Q.4 — Posicionamento adaptativo** da lista de sugestões (acima do cursor quando o teclado virtual cobre a área). ✅
- **Q.5 — Reiniciar o progresso.** É uma apresentação, sem histórico. ✅
- **Q.6 — Usar o `concept` da fase** como rótulo da barra de progresso. ✅
