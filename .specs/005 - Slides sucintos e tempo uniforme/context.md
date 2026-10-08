# Objetivo
- Deixar os slides **sucintos e diretos ao ponto**: menos texto, menos etapas, uma ideia por slide
- **Mesma quantidade de slides em todas as etapas** (abertura e as três fases), para cada uma levar o mesmo tempo
- Uma **meta de tempo por slide** fácil de definir, para a apresentação inteira caber em **15 minutos** sem depender de cortes na hora

# Contexto atual (o que já existe)
- Decks declarados em `slides/slide-definitions.ts`: abertura com **4** slides, HTML com **5**, CSS com **7** e JS com **6** (22 no total)
- Cada slide pode ter etapas: um ponto por etapa e, depois, uma parte da anatomia por etapa (`stepsOf` em `slides/deck-navigation.ts`). Hoje há slides com até **7 etapas** (anatomia da regra CSS e do `if`)
- Textos de apoio (`lead`) chegam a ~100 caracteres e alguns pedem ação ("Avance para ver cada parte")
- Cada fase tem um slide de "erros comuns", que repete o que os cards de sintaxe da IDE já mostram ("Erro comum: …")
- Desde a spec 004, as fases de programação têm **timer fixo de 3 minutos**: 9 dos 15 minutos já estão tomados
- O roteiro de 15 minutos montado sobre o deck atual só fecha **pulando** os slides de erros e cortando na hora. Sobram ~6 minutos para 22 slides, cerca de 15s por slide, com etapas de durações muito diferentes

# Problemas a corrigir
- **Cada etapa da aula dura um tempo diferente:** o CSS tem quase o dobro de slides e etapas do HTML. O apresentador não tem uma meta única para seguir
- **Slides com muitas etapas:** 7 cliques num slide só quebram o ritmo e não cabem em 15–20s
- **Texto demais para projetar:** quem está no fundo da sala não lê duas linhas de `lead` enquanto o apresentador fala
- **Conteúdo repetido:** os slides de erros duplicam os cards de sintaxe, e o erro só faz sentido quando aparece no código do aluno

# Proposta
## 1. Uma forma única para todas as etapas
Abertura e fases passam a ter **3 slides cada** (12 no total), e cada slide tem **no máximo 3 etapas**.

| Etapa da aula | Slide 1 | Slide 2 | Slide 3 |
| --- | --- | --- | --- |
| **Abertura** | Você vai escrever um jogo | As três linguagens (HTML, CSS, JS — 3 etapas) | Como funciona: slide, 3 minutos, jogo (junta "o navegador lê as três" e "o que vem agora") |
| **Fase 1 — HTML** | O conceito: HTML cria as coisas | Anatomia da tag em 3 partes: abertura, conteúdo, fechamento | Dentro de quem: a árvore `sky` → `ball`, `ground` |
| **Fase 2 — CSS** | O conceito, já ligado ao HTML: o seletor aponta para a tag | Anatomia da regra em 3 partes: seletor, propriedade, valor | Animação em 3 partes: `@animation jump`, os momentos `inicio`/`meio`/`fim`, aplicar com `animation: jump` |
| **Fase 3 — JS** | O conceito: JavaScript reage ao jogador (sim ou não) | Anatomia do `if` em 3 partes: `if`, condição, ação | Cada tecla, um `if`: D, A e espaço |

- O que sai: os slides de **erros comuns** (o erro continua no card de sintaxe da IDE e no painel de problemas), "elemento vazio vs. com conteúdo" (vira a parte "conteúdo" da anatomia), "cada elemento ganha o seu bloco" e "verdadeiro ou falso" como slides separados
- Anatomias com mais partes são **agrupadas**, não cortadas: na regra CSS, `{ }`, `:` e `;` acendem junto com a parte a que pertencem. O código mostrado continua inteiro e correto
- Os exemplos continuam usando **só o vocabulário que a fase aceita** (`assist/vocabulary`)

## 2. Texto curto, feito para projetar
Limites para todo slide, conferidos por teste:

| Campo | Limite |
| --- | --- |
| Título | até **6 palavras** |
| `lead` | até **80 caracteres**, uma frase, sem instrução de navegação ("avance para…") |
| Texto de um ponto | até **60 caracteres** |
| Nota de uma parte da anatomia | até **60 caracteres** |
| Código | até **6 linhas** (a animação inteira + a linha que a aplica) |

## 3. Meta de tempo por slide
- Uma constante só, `SLIDE_TARGET_MS = 20_000` (**20 segundos por slide**), definida junto dos decks
- Com a forma única, a conta fica simples e igual para todas as etapas: **3 slides × 20s = 1 minuto** por etapa

| Tempo | O quê |
| --- | --- |
| 0:00–1:00 | Abertura (3 slides) |
| 1:00–2:00 | Conceito da Fase 1 — HTML (3 slides) |
| 2:00–5:00 | Fase 1 programando (timer de 3:00) |
| 5:00–6:00 | Conceito da Fase 2 — CSS (3 slides) |
| 6:00–9:00 | Fase 2 programando |
| 9:00–10:00 | Conceito da Fase 3 — JS (3 slides) |
| 10:00–13:00 | Fase 3 programando |
| 13:00–14:00 | Tela final |
| 14:00–15:00 | **1 minuto de folga** |

- **Ritmo na tela do apresentador:** uma barra discreta no deck mostra o tempo no slide atual contra a meta de 20s e muda de cor ao passar dela. Só a máquina do apresentador vê, e nada vai para o Firestore: é uma régua para o professor, não um timer da turma
- Com `prefers-reduced-motion` a barra fica estática (só a cor muda)

## 4. Roteiro no README
- O "Roteiro de 15 minutos" do README é refeito sobre o novo deck: o que dizer em cada slide, em uma frase, e a tabela de tempos acima
- Sai a nota da spec 003 de que "as sequências ainda não têm limite de slides"

# Restrições
- **Sem componente novo de slide**: o enxugamento é de conteúdo em `slide-definitions.ts`. Os componentes da spec 003 (code-listing, code-anatomy, element-tree) continuam
- A sincronização da spec 004 não muda: o deck continua sendo `slide` + `step`, só com menos de cada
- Testes que garantem a forma, em `slide-definitions.spec.ts`: cada deck tem exatamente 3 slides, cada slide tem no máximo 3 etapas, os limites de texto da seção 2 e as regras que já existem (anatomia existe no código, ids únicos)
- Cards de sintaxe e slides não podem se contradizer (regra da spec 003): onde um slide sair, o card continua dizendo o mesmo
- Mantém o que veio das specs anteriores: animação só em CSS, `prefers-reduced-motion`, 16:9 e toque, UI em português e palavras-chave em inglês

# Fora de escopo
- Mudar o timer de 3 minutos, as fases, a validação ou a engine
- Timer por slide sincronizado entre as máquinas, ou avanço automático de slide
- Meta de tempo configurável na tela
- Editor de slides

# Decisões assumidas
- **3 slides por etapa e no máximo 3 etapas por slide** (decisão do usuário: mesma quantidade em todas as etapas). Com isso, cada etapa da aula dura o mesmo minuto
- **Meta de 20s por slide**: sobra 1 minuto de folga nos 15 e não há o que pular
- **Os slides de erros saem** em vez de encolher: o erro é ensinado quando aparece, pelo painel de problemas e pelo card de sintaxe
- A barra de ritmo é **só do apresentador e só local**, sem custo de leitura ou gravação no Firestore
- A posição sincronizada antiga (`deck.slide`/`deck.step` de um deck mais longo) continua segura: `clampPosition` traz qualquer posição para dentro do deck novo
