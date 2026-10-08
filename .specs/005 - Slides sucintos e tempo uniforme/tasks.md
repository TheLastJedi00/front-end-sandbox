# Tasks — 005 Slides sucintos e tempo uniforme

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/slides-sucintos` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

Nada de componente novo de slide, nem mudança na sessão ao vivo. O que muda:

```
src/app/slides/
  slide-shape.ts            # NOVO — limites da forma (3 slides, 3 etapas, texto) como função pura
  slide-definitions.ts      # abertura e as três sequências reescritas: 3 slides cada
  slide-definitions.spec.ts # todo deck respeita a forma
  slide-pace.ts             # NOVO — SLIDE_TARGET_MS e o estado do ritmo (puro)
  slide-deck/               # barra de ritmo, só quando pedida (apresentador)
src/app/pages/home, slides/concept-overlay   # ligam a barra no apresentador
README.md                   # roteiro de 15 minutos refeito
```

### A forma, em números

| | Limite |
| --- | --- |
| Slides por deck (abertura e cada fase) | exatamente **3** |
| Etapas por slide (`stepsOf`) | no máximo **3** |
| Título | até 6 palavras |
| `lead` | até 80 caracteres, sem "avance…" |
| Texto de ponto / nota de anatomia | até 60 caracteres |
| Linhas de código (`code` ou `anatomy`) | até 5 |
| Meta por slide | `SLIDE_TARGET_MS = 20_000` |

Agrupar partes da anatomia não precisa mudar o modelo: cada parte já é um trecho contíguo de uma
linha, então o trecho só fica maior (ex.: `color:` em vez de `color` + `:`).

---

## Fase 0 — A forma como regra

- [ ] **T0.1** — `slides/slide-shape.ts`: constantes da forma e `shapeIssues(deck)` → lista de problemas legíveis ("css-regra: 5 etapas, máximo 3"). Testes da própria função com decks de exemplo (dentro e fora dos limites).

## Fase 1 — Conteúdo enxuto

- [ ] **T1.1** — **Abertura** em 3 slides: "Você vai escrever um jogo" · "Três linguagens, três papéis" (HTML, CSS, JS) · "Como funciona" (slide, 3 minutos, jogo).
- [ ] **T1.2** — **HTML** em 3 slides: conceito · anatomia da tag (abertura, conteúdo, fechamento) · dentro de quem (árvore `sky` → `ball`, `ground`).
- [ ] **T1.3** — **CSS** em 3 slides: conceito com seletor ↔ tag · anatomia da regra (seletor, propriedade, valor) · animação (`@animation jump`, momentos, `animation: jump`).
- [ ] **T1.4** — **JavaScript** em 3 slides: conceito (reage ao jogador, sim ou não) · anatomia do `if` (`if`, condição, ação) · cada tecla, um `if`.
- [ ] **T1.5** — `slide-definitions.spec.ts`: todo deck passa em `shapeIssues` sem nenhum problema. Revisar os cards de sintaxe (`assist/syntax-cards.ts`) para nada contradizer os slides novos; o "erro comum" de cada card fica.

## Fase 2 — Ritmo do apresentador

- [ ] **T2.1** — `slides/slide-pace.ts`: `SLIDE_TARGET_MS` e `paceOf(elapsedMs)` → fração da meta e estado (`no-ritmo` · `perto` a partir de 75% · `passou`). Testes.
- [ ] **T2.2** — `slides/slide-deck`: input `showPace`; com ele, uma barra fina no rodapé enche até a meta de 20s e muda de cor ao passar dela. Zera a cada **troca de slide** (não de etapa). Usa o `Clock` da spec 004. Com `prefers-reduced-motion`, sem transição na barra.
- [ ] **T2.3** — Abertura e conceito das fases ligam `showPace` só na máquina do apresentador. Nada é gravado no Firestore.

## Fase 3 — Qualidade e entrega

- [ ] **T3.1** — Testar no navegador, rodando localmente, com as duas origens (apresentador e aluno): os três decks com 3 slides, etapas, barra de ritmo só no apresentador, sincronização intacta. Cronometrar uma passada da abertura e de um conceito na meta de 20s por slide.
- [ ] **T3.2** — `README.md`: seção "A apresentação" com os números novos e "Roteiro de 15 minutos" refeito (uma frase por slide + a tabela de tempos do contexto).
- [ ] **T3.3** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Decididas pelo usuário em 2026-10-08 (todas pela recomendação):**

- **Q.1 — Base da branch:** a PR #4 foi mergeada antes; a branch foi rebaseada sobre a `main`. ✅
- **Q.2 — A barra de ritmo conta por slide**, zerando a cada troca de slide. ✅
- **Q.3 — No máximo 3 etapas por slide**, não exatamente 3. ✅
- **Q.4 — A tela final fica como está**, fora dos decks. ✅
