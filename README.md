# PERCEBER 2.0

Plataforma de triagem e investigação de características associadas ao autismo em pessoas adultas.
**Não diagnostica.** Organiza autorrelato por domínio, mostra sinais de triagem com incertezas e
limites, e ajuda a pessoa a decidir se quer levar isso a uma avaliação profissional.

Esta versão é a evolução do PERCEBER 1.0 (perceber.vercel.app). A identidade continua a mesma,
agora apoiada num Design System completo, com as abas e perfis do documento de criação.

## Como rodar

```bash
npm install
npm run dev          # desenvolvimento em http://localhost:5173
npm run check        # TypeScript + ESLint (inclui jsx-a11y) + testes + build
npm run test:e2e     # fluxo completo em Chromium + axe (WCAG 2.2 AA); capturas em e2e/out
```

Requer Node 20+. Não há backend: o estado fica no `localStorage` do navegador (chave `perceber:v2`),
o que deixa o protótipo navegável, mas **não é armazenamento adequado para dados de saúde reais**
(ver "Pendências").

## Arquitetura

```
src/
  domain/     regras puras e testadas: itens, motor adaptativo, pontuação, sinais,
              consentimentos, papéis, auditoria, módulos, referências, dados sintéticos
  features/   uma pasta por área (landing, onboarding, assessment, results, report,
              sharing, professionals, research, governance, profile, help, references)
  ui/         componentes do Design System (Button, Field, Dialog, Tabs, Table, Toast,
              Surface, PageHeader, SignalMeter, Disclosure, ContourMap, padrões de sinal)
  layout/     AppShell (navegação), Curtain (transição), A11yPanel, RoleSwitcher
  lib/        roteador por hash, persistência, movimento, sha256, formatação
  state/      store único com persistência e preferências
  styles/     tokens.css (fonte única dos tokens) e index.css (base e utilitários)
```

React 19, TypeScript, Tailwind CSS 4 (`@theme`), GSAP para movimento, lucide para ícones.
Fontes servidas localmente (`@fontsource`), sem dependência de Google Fonts.

### Rotas

| Rota | Quem acessa | Conteúdo |
|---|---|---|
| `/` | todos | Início / Como funciona, com o aviso de que não confirma nem exclui diagnóstico |
| `/comecar` | participante | Consentimentos separados (6 finalidades) e "Sobre você" |
| `/antes-de-comecar` | participante | Elegibilidade e segurança, com interrupção e orientação em caso de risco |
| `/avaliacoes` | participante | Módulos com nome, versão, construto, tempo, status de uso e limitações |
| `/avaliacao/:id` | participante | Questionário em modo foco: uma pergunta por vez, pausa, voltar, pular |
| `/resultado/:id` | participante | Sinal de triagem, mapa por domínio, pontuação explicada, incertezas |
| `/relatorio/:id` | participante | "Percepção inicial baseada nas respostas", exportação com identificador e hash |
| `/painel` | participante | Módulos, histórico, compartilhamentos ativos, comparação entre avaliações |
| `/compartilhar` | participante | Código de acesso com prazo, escopo mínimo, histórico e revogação |
| `/perfil` | participante | Dados mínimos, preferências, consentimentos, direitos do titular |
| `/profissionais` | participante, profissional | Diretório de profissionais validados |
| `/portal` | profissional | Abertura por código, leitura mínima, observações sem diagnóstico |
| `/pesquisa` | pesquisador | Protocolo, dicionário de dados, agregados com supressão de células pequenas |
| `/governanca` | administração, comitê | Auditoria com verificação de integridade, liberação de módulos |
| `/referencias`, `/ajuda` | todos | Base científica com filtros; ajuda, glossário, FAQ e canais de crise |

O seletor de perfil no topo existe só para demonstração. Num sistema real, o papel viria da autenticação.

## Design System

Toda decisão visual sai de `src/styles/tokens.css`. Os componentes não usam cores, tamanhos ou
raios avulsos.

**Cor.** Azul profundo (`deep #0a1a47`) para profundidade e áreas institucionais. Azul elétrico
(`accent #2563eb`) só para ação, foco e seleção. Superfícies claras: névoa `#f5f8ff` e papel branco.
O texto tem três níveis, todos com contraste AA medido: `ink` 15:1, `muted` 9:1 e `subtle` 5,4:1.
Abaixo disso, só estado desabilitado.

**Sinais de triagem.** A escala vai do ciano ao azul-marinho (baixa, moderada, elevada, avaliação
sugerida), sem vermelho de alerta. Cada nível tem também um padrão próprio (grade, ondas, nós,
infinito), para nunca depender só da cor.

**Tipografia.** Lexend para títulos, Plus Jakarta Sans para interface e leitura, JetBrains Mono
para rótulos de dados. Lexend tem traço arredondado e aberto, desenhado para reduzir o esforço
visual de leitura; substituiu a Fraunces, cuja serifa em cunha deixava os títulos com um ar
cortante demais para o tom acolhedor do produto. São 10 degraus em `rem`, com `clamp()` nos
títulos e 2 pesos de Lexend (300 nos títulos grandes, 400 nos demais).

**Forma e profundidade.** 6 raios (6 → 32 px e pílula), 4 sombras e textura de grão leve.
As curvas de nível (`ContourMap`) materializam a metáfora da *cartografia da percepção* no início
e no resultado. O questionário fica limpo de propósito.

**Movimento.** Três durações (160 / 280 / 560 ms) e curva `ease-calm`. A cortina de tela cheia
aparece só em dois momentos: ao entrar na avaliação e ao revelar o resultado. Tudo respeita
`prefers-reduced-motion` e a opção manual "Reduzir animações". Nenhum conteúdo depende de
animação para ficar visível.

**Temas e preferências** (persistem no navegador): tema claro, crepúsculo ou do sistema; alto
contraste; tamanho de texto de 90% a 150% (escala de fato, porque tudo está em `rem`); reduzir
animações; avanço automático no questionário.

## Acessibilidade (WCAG 2.2 AA como referência)

- Teclado em todo o fluxo, com atalhos 1 a 5 no questionário e foco visível e consistente
  (`--focus-width`, mais espesso em alto contraste).
- Mudança de rota anunciada e foco no título; regiões `aria-live` para avisos.
- Erros de formulário anunciados (`role="alert"`) e ligados ao campo por `aria-describedby`.
- Alvos de toque de pelo menos 44 px nos controles principais e campos com contorno de 3:1.
- Sem rolagem horizontal a 390 px, mesmo com texto a 150%.
- `npm run test:e2e` passa o axe em 27 telas e estados (desktop, mobile, escuro, alto contraste
  a 150%) com **0 violações**.

Testes automáticos não substituem testes com pessoas: autistas, com TDAH, dislexia, baixa visão,
deficiência motora e escolaridades diferentes (ver pendências).

## Princípios preservados

- Nenhuma tela afirma que a pessoa é ou não é autista. Em todo resultado aparecem quatro coisas:
  o sinal de triagem, o construto medido, a incerteza e a lembrança de que a decisão é
  profissional.
- Não há "percentual de autismo" nem "probabilidade". Ponto de corte é mostrado como faixa
  provisória, não como fronteira.
- Itens não respondidos e a qualidade dos dados aparecem sempre.
- Os consentimentos são granulares, versionados, registrados com data e texto exibido, e
  revogáveis.
- O compartilhamento é sempre por código, com prazo, escopo mínimo e revogação imediata.
  Nunca por link público.

## Pendências, riscos e evidências necessárias antes de qualquer uso real

1. **Validação psicométrica.** Itens, pesos e faixas são de autoria própria e ainda **não têm
   estudo empírico**. Faltam validade de conteúdo com especialistas, entrevistas cognitivas,
   piloto, estrutura interna, confiabilidade por escore e população, invariância/DIF e normas.
   Até lá, o módulo fica em "Pesquisa".
2. **Backend e segurança.** O protótipo guarda tudo no navegador. Uso real exige servidor com
   criptografia em trânsito e em repouso, MFA real para profissionais, pesquisadores e
   administração, logs imutáveis no servidor, separação física entre identidade e dados de
   pesquisa, backups testados e plano de incidentes. A cadeia de hash da auditoria e o hash dos
   relatórios aqui são demonstrativos.
3. **Ética e LGPD.** Faltam submissão ao CEP/CONEP antes de coletar para pesquisa, definição do
   controlador e do encarregado, RIPD (relatório de impacto) e revisão jurídica dos textos de
   consentimento.
4. **CFP e SATEPSI.** Nenhum teste psicológico é usado. Antes de oferecer uso profissional, é
   preciso revisar a conformidade com a Resolução CFP 31/2022 e as normas de serviços mediados
   por tecnologia.
5. **Validação de profissionais.** O diretório usa cadastros fictícios. Falta o fluxo real de
   verificação de registro no conselho.
6. **Testes com pessoas.** Faltam testes de usabilidade e acessibilidade com participantes
   diversos, incluindo pessoas autistas na equipe de revisão.
7. **Dados sintéticos.** A área de pesquisa usa amostra sintética gerada localmente, marcada
   como tal. Ela não representa nenhuma população.
8. **Crise.** Os canais listados (CVV 188, SAMU 192) devem ser revisados periodicamente.
