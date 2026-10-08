# Objetivo
- O professor **controla a apresentação ao vivo em todos os computadores da sala**: quando ele avança um slide, troca de fase ou encerra, todas as máquinas acompanham
- Para isso, o professor **faz login em cada máquina** que vai acompanhar a apresentação, e as máquinas ficam ligadas a uma sessão em tempo real no **Firebase (Auth + Firestore)**
- As **fases de programação ganham um timer de 3 minutos**, sincronizado entre todas as máquinas
- É uma apresentação simples numa escola, não um produto: o risco é baixo e a solução deve ser a mais direta possível

# Contexto atual (o que já existe)
- Rotas: `/` (deck de abertura), `/sandbox/:levelId` (fases 1 a 3) e `/fim`, todas prerenderizadas (SSR com `RenderMode.Prerender`)
- `slides/slide-deck`: a posição é `DeckPosition` (`slide` + `step`), calculada por funções puras em `slides/deck-navigation.ts` (`advance`, `retreat`, `advanceWhole`, `retreatWhole`)
- `slides/concept-overlay`: mini-deck de conceito e sintaxe que abre cada fase, por cima da IDE
- `pages/sandbox/sandbox-page`: a fase em si; ao concluir, o aluno mesmo clica em "Próxima fase"
- Estado local em `localStorage`: código de cada fase (`CodeStorage`), fases concluídas (`ProgressStore`) e conceitos já vistos (`BriefingStore`)
- Hoje cada máquina anda sozinha: **não há rede, backend nem login** (restrição das specs 002 e 003, que esta spec revoga)

# Proposta
## 1. Login do professor
- Nova rota `/login` com e-mail e senha (Firebase Auth, provedor **E-mail/senha**)
- Todas as rotas da apresentação passam a exigir login; sem sessão, a máquina vai para `/login`
- A sessão do Firebase fica guardada no navegador: um F5 no meio da aula **não** desloga
- Uma conta só, a do professor, usada em todas as máquinas. Não há cadastro na tela, a conta é criada no console do Firebase

## 2. Tela de escolha: apresentador ou aluno
Logo depois do login, a máquina cai numa **tela de escolha** (rota `/papel`) com duas opções grandes, fáceis de tocar. É essa escolha que define quem é quem:

- **Entrar como apresentador:** a máquina do professor (normalmente a do projetor). Os controles de navegação dela escrevem o estado da apresentação no Firestore
- **Entrar como aluno:** as máquinas da turma. Elas só leem o estado e seguem o apresentador; os controles de navegação do deck e "Próxima fase" ficam ocultos

- Sem papel escolhido, nenhuma rota da apresentação abre: a máquina volta para `/papel`
- A escolha fica guardada na máquina, para não precisar escolher de novo depois de um F5
- Para trocar de papel, a máquina sai da sessão (logout) e escolhe de novo

## 3. Sessão ao vivo no Firestore
- Um documento por professor: `sessoes/{uid}`. Como todas as máquinas usam a conta do professor, todas leem o **mesmo documento**, sem código de sala
- As máquinas dos alunos ouvem o documento com `onSnapshot`, o canal em tempo real nativo do Firestore (conexão persistente com streaming, sem polling e sem servidor próprio)
- O apresentador grava a cada ação de navegação. As máquinas dos alunos aplicam o estado recebido

O que é sincronizado:

| Campo | Significado |
| --- | --- |
| `stage` | `abertura` · `fase` · `fim` |
| `levelId` | fase atual (1 a 3), quando `stage = fase` |
| `deck` | `{ slide, step }` do deck que está na tela (abertura ou conceito da fase) |
| `conceptOpen` | se o mini-deck de conceito ainda está aberto por cima da IDE |
| `timer` | estado do timer da fase (ver seção 4) |
| `updatedAt` | `serverTimestamp()` da última gravação |

O que **não** é sincronizado: o código que cada aluno escreve, dicas, "Mostrar solução", "Reiniciar fase" e os cards de sintaxe. Isso continua local, em cada máquina.

## 4. Timer de 3 minutos nas fases de programação
- O timer começa quando o apresentador fecha o mini-deck de conceito e a turma entra na IDE
- Duração fixa de **3 minutos** por fase (constante no código, não é configurável na tela)
- O timer fica visível em todas as máquinas, na barra de título da IDE, e muda de cor no último minuto
- O apresentador pode **pausar/retomar** e **reiniciar** o timer
- Ao chegar a zero: aviso de "Tempo esgotado" em todas as máquinas. O editor **continua funcionando**; quem decide avançar é o professor
- Sincronia: o documento guarda quando o timer termina (`endsAt`), ou quanto falta enquanto ele está pausado (`remainingMs`). Cada máquina calcula a contagem regressiva sozinha, sem gravar no Firestore a cada segundo

## 5. Testes ligados direto ao Firestore
- Além dos testes unitários (funções puras de mapeamento estado ↔ apresentação e de cálculo do timer), há **testes de integração que conectam ao projeto Firebase real**, sem emulador
- Eles fazem login com um **usuário de teste**, gravam e leem o próprio `sessoes/{uid}` e confirmam que um `onSnapshot` recebe a mudança gravada
- As credenciais do usuário de teste **não vão para o repositório**: ficam num arquivo ignorado pelo git, e sem esse arquivo os testes de integração são pulados (os unitários continuam rodando)
- O mesmo usuário de teste (`claude@claude.com`, criado no console) é usado para validar o fluxo no navegador local: login, papel, sincronização entre duas abas (uma como apresentador, outra como aluno) e timer

# Configuração do Firebase
- Projeto: `front-end-sandbox-91f5f`. A configuração web (`apiKey`, `projectId` etc.) é um identificador público do app, não um segredo, e pode ficar no código
- No console: ativar o provedor **E-mail/senha**, criar a conta do professor e a do usuário de teste (`claude@claude.com`), criar o banco Firestore e publicar as regras
- Regras do Firestore, versionadas no repositório:
  - `sessoes/{uid}`: leitura e escrita só quando `request.auth.uid == uid`
  - Todo o resto: negado

# Restrições
- SDK modular oficial `firebase` (sem AngularFire), carregado **só no navegador**: o prerender (SSR) continua funcionando sem tocar no Firebase
- Sem Analytics: o `getAnalytics` do snippet do console fica de fora, porque não tem uso aqui e quebra no servidor
- Sem backend próprio nem Cloud Functions: o navegador fala direto com o Firestore
- Consumo pequeno, dentro da cota gratuita: cada ação do apresentador vira uma leitura por máquina (ex.: 30 máquinas × ~150 ações ≈ 4,5 mil leituras por aula, e o plano gratuito tem 50 mil leituras por dia)
- Se a rede cair, a máquina continua com o último estado recebido e o aluno continua programando, porque o código é local. Quando a rede volta, a máquina retoma a sincronização
- Mantém o que veio das specs anteriores: OnPush, signals, animação só em CSS, `prefers-reduced-motion`, toque e 16:9, UI em português

# Fora de escopo
- Contas de aluno, cadastro, recuperação de senha ou várias turmas com professores diferentes ao mesmo tempo
- Ver ou corrigir o código dos alunos na máquina do professor
- Placar, ranking ou qualquer dado de aluno guardado no Firestore
- Emulador do Firebase, CI e deploy

# Decisões assumidas
- **A mesma conta do professor em todas as máquinas**, com o papel (apresentador/aluno) escolhido por máquina. Por isso a sessão é `sessoes/{uid}` e não precisa de código de sala
- Se duas máquinas entrarem como apresentador, vale a última gravação. Não há trava de apresentador único
- **O timer não bloqueia o editor** ao zerar, só avisa. Avançar continua sendo decisão do professor
- **O relógio das máquinas é considerado confiável** (diferença de poucos segundos entre elas é aceitável). O timer usa `endsAt` absoluto, sem compensação de relógio
- O progresso local (`ProgressStore`, `BriefingStore`) deixa de mandar na navegação quando a máquina entrou como aluno: quem diz em que fase e em que slide a máquina está é a sessão
- Os testes de integração usam um usuário de teste próprio, separado da conta do professor, para não mexer na sessão da aula
