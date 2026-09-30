# Objetivo
- Tornar a apresentação **visualmente impactante**: slides com transições animadas e componentes que entram e se montam dentro do slide
- **Reforçar a sintaxe** de cada ferramenta nos slides, antes de a fase começar: tags no HTML, seletores e regras no CSS, estrutura condicional no JavaScript
- Corrigir os problemas encontrados no deck atual (spec 002)

# Contexto atual (o que já existe)
- `slides/slide-deck`: casca do deck com avançar/voltar, pontos de progresso, teclado, swipe e toque nas metades da tela
- `slides/slide`: um único componente que renderiza `eyebrow`, `title`, `lead`, `points` e `code` a partir de `slide-definitions.ts`
- Abertura com 4 slides; **um único slide de conceito por fase**, exibido no `concept-overlay` por cima da IDE
- Na IDE, os cards de sintaxe (`assist/syntax-cards`) aparecem antes da primeira tecla
- Animação hoje: só um `slide-in` (fade + translate) no corpo do slide

# Problemas a corrigir
- **A animação de entrada só roda no primeiro slide.** O `<app-slide>` é o mesmo componente durante todo o deck; trocar de slide só troca o `input`, então o `.body` não é recriado e o `slide-in` não se repete
- **A transição não tem direção:** voltar e avançar parecem iguais
- **O código dos slides não tem realce de sintaxe.** O `SlideCode` promete "a cor do papel que ela cumpre", mas as linhas são texto puro — justamente onde a sintaxe deveria ficar mais clara. O realce da IDE (`ide/code-editor/highlight.ts`) já existe e pode ser reaproveitado
- **O slide de conceito do CSS junta tudo num bloco só** (regra + `@animation`), sem separar o que é seletor, propriedade e valor
- **O slide de conceito é um só por fase:** não há espaço para explicar a sintaxe por partes
- **O autocomplete do HTML não escreve a tag, só o nome.** Em `assist/completion.ts`, a tag completa só é montada quando o caractere antes da palavra é `<`. Se o aluno digita `ba` sem o `<` — que é o caso mais comum de quem está aprendendo — aceitar a sugestão insere apenas `ball`, sem `<` e `>`. O mesmo vale para o fechamento: `</ba` vira `</ball`, sem o `>`

# Comportamento esperado do autocomplete no HTML
| O aluno digitou | Aceitar a sugestão resulta em | Cursor fica |
| --- | --- | --- |
| `ba` | `<ball></ball>` | entre a abertura e o fechamento |
| `<ba` | `<ball></ball>` (como já é hoje) | entre a abertura e o fechamento |
| `</ba` | `</ball>` | depois do `>` |

- Não duplicar sinais que já estão no texto (ex.: um `>` logo depois do cursor)
- A lista de sugestões mostra a tag como ela vai ficar (`<ball>`), para o aluno ver os sinais antes de aceitar
- Testes unitários de `completion` cobrindo os três casos

# Proposta
## 1. Deck com impacto visual
- **Transição entre slides** com direção (avançar sai para a esquerda, voltar sai para a direita) e o slide novo sempre reanimado
- **Entrada escalonada dos componentes** do slide: título, texto, cards e código entram em sequência, não todos juntos
- **Código que se monta:** as linhas do bloco de código aparecem uma a uma (efeito de digitação/revelação), já com realce de sintaxe
- **Anatomia animada:** em slides de sintaxe, as partes do código ganham destaque e um rótulo apontando para elas (ex.: "abertura", "fechamento", "seletor", "condição")
- **Etapas dentro do slide (builds):** "Avançar" revela a próxima parte do slide antes de ir para o próximo slide, para o apresentador explicar peça por peça
- Fundo com movimento sutil (gradiente/brilho na cor da linguagem da fase), sem competir com o conteúdo
- A abertura (4 slides) também recebe o novo visual

## 2. Reforço de sintaxe antes de cada fase
O slide único de conceito vira uma **sequência curta** (conceito + slides de sintaxe) no mesmo overlay, com navegação igual à do deck.

- **Fase 1 — HTML: tags**
  - Anatomia da tag: `<` nome `>` abre, `</` nome `>` fecha
  - Elemento vazio vs. elemento com conteúdo
  - Aninhamento: quem está dentro de quem, mostrado como árvore (`sky` → `ball`, `ground`)
- **Fase 2 — CSS: seletores e regras**
  - Anatomia da regra: seletor, `{ }`, propriedade, `:`, valor, `;`
  - O seletor escolhe o elemento pelo nome da tag que foi criada na fase 1 (a ligação HTML ↔ CSS)
  - `@animation` com `inicio`, `meio`, `fim` e como aplicá-la com `animation: jump`
- **Fase 3 — JavaScript: estrutura condicional**
  - Anatomia do `if`: palavra `if`, condição entre `( )`, o que fazer entre `{ }`
  - Condição verdadeira ou falsa: "se a tecla D está apertada" → sim/não
  - Vários `if` independentes, verificados a cada quadro do jogo
  - Chamar uma ação: `avancar()`, `element("ball").animation("jump")`

Os exemplos usam **exatamente o vocabulário que a fase aceita** (o mesmo de `assist/vocabulary`), para nada do slide dar erro na IDE.

## 3. Conteúdo declarativo
- Os novos tipos de slide (anatomia, árvore, sequência de etapas) continuam declarados em `slide-definitions.ts`, como hoje
- Cards de sintaxe da IDE continuam existindo: o slide ensina, o card lembra. O conteúdo não deve se contradizer

# Restrições
- **Animações só em CSS** (keyframes, transitions, `animation-delay`), como decidido na spec 002 — sem GSAP ou outra biblioteca
- Respeitar `prefers-reduced-motion` (já existe regra global em `styles.scss`): sem movimento, o conteúdo aparece completo e legível
- Funcionar projetado em 16:9 e no tablet (toque, swipe)
- **Sem limite de slides por fase por enquanto** (decisão do usuário em 2026-09-30); o apresentador continua podendo pular a sequência inteira. O encaixe nos 15 minutos será revisto depois
- UI em português; palavras-chave de código em inglês
- Sem dependência nova, sem rede

# Fora de escopo
- Mudar as fases, a validação ou a engine do jogo
- Novos recursos de assistência na IDE (a correção do autocomplete de tags entra; recurso novo não)
- Editor de slides

# Decisões assumidas
- A sequência de sintaxe **substitui** o slide único de conceito, dentro do mesmo `concept-overlay` (continua sendo overlay, não rota)
- As etapas (builds) avançam pelo mesmo controle de "Avançar"/seta/toque; com `prefers-reduced-motion`, todas as etapas já aparecem reveladas
- O realce de sintaxe dos slides reaproveita o tokenizador da IDE, para a cor de cada token ser a mesma nos slides e no editor
