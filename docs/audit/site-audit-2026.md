# Diagnóstico do site institucional FISAM TECH

Data da auditoria: 10/11/2026.
Empresa: FISAM TECH TECNOLOGIA LTDA, CNPJ 59.897.573/0001-02, contato@fisamtech.com.
Assinatura de marca usada como referência: "Engenharia que conecta tecnologia e negócio."

Método: navegação real em https://www.fisamtech.com com o browser do Cursor (snapshot de acessibilidade, screenshots e emulação de viewport em 1440×900 e 390×844) e leitura do HTML, headers, `robots.txt` e `sitemap.xml` via curl. O código foi lido no workspace, sem alteração de aplicação.

Divergência de deploy: o HTML público de produção coincide com as mensagens e as rotas de marketing deste repositório. O commit local mais recente adiciona Super Admin e um `disallow` no `robots.ts`. Em produção, `GET /pt-br/super-admin/login` respondeu 404 e o `robots.txt` ao vivo só contém `Allow: /` mais o sitemap. O diagnóstico abaixo separa o que está no ar do que existe só no código.

Nenhum formulário foi enviado. Nenhum pagamento foi iniciado. Nenhuma denúncia foi registrada.

## 1. Resumo executivo

O visitante brasileiro entende, em uma frase, que a FISAM TECH faz engenharia de software. Não entende com precisão para quem é o serviço, o que recebe em troca de R$ 4.990 e se a empresa já executou contratos próprios. O primeiro passo está partido em três verbos (iniciar diagnóstico, iniciar qualificação, agendar) que caem no mesmo formulário pago, enquanto o FAQ sugere que no Brasil o diagnóstico pode não ser cobrado. No celular, o banner de cookies e o banner de região cobrem o botão principal e escondem a opção "Somente necessários".

A identidade visual navy e champanhe já sustenta uma empresa de engenharia. O que impede confiança é a prova, o preço e o caminho até o contato, não a paleta.

Há um furo no fechamento: a página de sucesso diz que o calendário está liberado, mas em produção o desbloqueio provisório é recusado e o e-mail do webhook não leva o link do agendamento. Quem paga pode não conseguir marcar a sessão.

## 2. Mapa do produto

### Stack

Next.js 15, React 19, next-intl 4, Zod, CSS próprio em `src/app/globals.css` (sem Tailwind e sem biblioteca de componentes). Dados em Supabase e/ou Postgres (`src/lib/db/index.ts`). Pagamentos em `packages/payments` (Mercado Pago transparente na América Latina, Stripe Embedded em USD, EUR e GBP). E-mail via Resend quando `RESEND_API_KEY` existe; sem a chave, o envio só registra log. Hospedagem observada: Vercel, resposta em `gru1`.

### Idiomas

Prefixo obrigatório. Idiomas: `en`, `pt-br`, `pt-pt`, `es`, `fr`, `de`. Idioma padrão do código: `en` (`src/lib/config/index.ts`). A raiz `https://www.fisamtech.com/` respondeu 307 para `/pt-br` nesta auditoria, com cookies `CURRENCY=BRL` e `COUNTRY=BR`, porque o header de país da Vercel indicou Brasil. `https://fisamtech.com/pt-br` responde 308 para `https://www.fisamtech.com/pt-br`.

Textos públicos: `src/messages/{locale}.json`. Não há MDX nem CMS. Listas de clientes, produtos e experiência do fundador estão em constantes em `src/lib/config/index.ts`. Páginas legais misturam o título traduzido com parágrafos em inglês escritos direto no TSX.

### Rotas públicas

| Rota | Função | Arquivo |
| --- | --- | --- |
| `/{locale}` | Home | `src/app/[locale]/page.tsx` |
| `/{locale}/services/systems-architecture` | Serviço | `src/app/[locale]/services/[slug]/page.tsx` |
| `/{locale}/services/backend-engineering` | Serviço | mesmo |
| `/{locale}/services/critical-integrations` | Serviço | mesmo |
| `/{locale}/services/legacy-modernization` | Serviço | mesmo |
| `/{locale}/services/genai-governance` | Serviço | mesmo |
| `/{locale}/cases` | Cases | `src/app/[locale]/cases/page.tsx` |
| `/{locale}/qualify` | Formulário de qualificação | `src/app/[locale]/qualify/page.tsx`, `src/components/funnel/QualifyForm.tsx` |
| `/{locale}/parceiros` e `/{locale}/partners` | Mesma página de sócios | `src/app/[locale]/parceiros/page.tsx` |
| `/{locale}/checkout` | Checkout | `src/components/funnel/CheckoutClient.tsx` |
| `/{locale}/checkout/success` e `/pending` | Pós-pagamento | páginas em `src/app/[locale]/checkout/` |
| `/{locale}/book` | Calendário com token | `src/app/[locale]/book/page.tsx` |
| `/{locale}/privacy`, `/terms`, `/cookies`, `/compliance`, `/denuncia` | Legal e denúncia | páginas homônimas |

O card "Campo, tablet e mobile web" na home não tem rota. Não existe página `/contato`. A chave `nav.contact` não é usada no header.

APIs: `POST /api/leads`, `POST /api/checkout/create`, `POST /api/webhooks/stripe`, `POST /api/webhooks/mercadopago`, `POST /api/booking/unlock`, `POST /api/denuncia`.

Super Admin (código local, 404 em produção nesta data): `/pt-br/super-admin/login` e módulos de leads, empresas, contatos, oportunidades, propostas, usuários, papéis, auditoria, MFA e configurações, com APIs em `/api/admin/*`. Middleware em `src/middleware.ts` exige o cookie `fisam_admin_session` fora da tela de login e força `pt-br`.

Sitemap ao vivo: 90 URLs (6 idiomas × 15 caminhos), host `https://www.fisamtech.com`. Inclui qualify, parceiros, partners e as cinco páginas de serviço. Não inclui checkout nem book.

## 3. Análise de comunicação

Escala usada nas respostas: sim, parcial, não. Evidência entre aspas, com rota e origem.

### Hero (`/pt-br`, `src/messages/pt-br.json` → `hero`)

"Engenharia que conecta tecnologia e negócio." e "Sistemas sob medida, backend e integrações para operações que precisam evoluir."

1. Parcial. A assinatura e a lista "Java · Spring Boot · APIs · Cloud" dizem engenharia de software. "Sistemas sob medida" ainda cabe em quase qualquer software house.
2. Não. "Operações que precisam evoluir" não delimita porte, setor nem momento (MVP, legado, integração).
3. Não. O problema concreto só aparece duas seções abaixo.
4. Parcial. "Base técnica para o próximo passo" não descreve um entregável.
5. Não. Não há nome de entrega, prazo nem prova neste bloco.
6. Parcial. Há três saídas: "Iniciar diagnóstico técnico" (`/qualify`), WhatsApp e "Ver nosso trabalho". O diagnóstico, mais abaixo, é pago. O botão não diz isso.

### Credenciais (`#credentials`, `credentials` no JSON e grade na home)

"Mercado" com valor "Bradesco · B3 · Next". O parágrafo ao lado diz que são experiência prévia do fundador, não clientes.

1. Sim, no parágrafo: arquitetura backend, sistemas distribuídos, integrações.
2. Parcial. "Sistemas críticos" e "alta disponibilidade" apontam operação exigente, sem dizer o comprador.
3. Não. É currículo, não problema do visitante.
4. Parcial. "Diagnóstico antes do código" anuncia método.
5. Frágil. "10+ anos" e os nomes de bancos estão na posição visual de prova da empresa. O texto corrige, a grade não. Não há evidência externa no repositório.
6. Não. A seção não tem ação.

### Problemas (`problems`)

"Sistemas que não escalam. A arquitetura do primeiro release virou gargalo." Também integrações, legado e "GenAI sem governança".

1. Sim, pelo conjunto dos quatro cards.
2. Parcial. Quatro compradores diferentes no mesmo bloco: quem cresceu, quem integra ERP, quem tem legado, quem usa GenAI.
3. Parcial. Os títulos reconhecem dores reais. Os corpos têm uma linha e não descrevem consequência de negócio.
4. Não. Nenhum card diz o que muda depois do trabalho.
5. Não.
6. Não. Não há link para o serviço correspondente.

Em `es`, `fr` e `de`, `problems.title` e os quatro itens estão idênticos ao inglês ("Problems we are built for"). Confirmado no HTML de `/es`.

### Serviços na home (`#services`)

"Integração entre Sistemas Corporativos": "sem retrabalho, sem perda de dado." Backend: "baixa tolerância a falhas." O índice visual é "01 / ENGINEERING", em inglês, no HTML de `/pt-br`.

1. Sim, como catálogo de capacidades.
2. Parcial. O mix vai de microsserviços críticos a "Campo, tablet e mobile web", sem página.
3. Parcial. Os títulos repetem os problemas, com outras palavras.
4. Não. Não há escopo, prazo, formato de entrega nem exclusões.
5. Não. São afirmações de capacidade.
6. Parcial. Cinco cards levam a "Saiba mais". O sexto não leva a lugar nenhum.

### Páginas de serviço (`/pt-br/services/backend-engineering` e irmãs)

O corpo publicado é o mesmo parágrafo do card. O botão está fixo em inglês: "Technical Discovery" (`src/app/[locale]/services/[slug]/page.tsx`). Title da aba: "FISAM TECH". Description: "Architecture and engineering for critical systems", herdada de `src/app/layout.tsx`.

1. Parcial. O título nomeia o serviço. A página não acrescenta nada.
2. Não além do que a home já disse.
3. Não.
4. Não.
5. Não.
6. O botão existe e vai para `/qualify`, com rótulo em inglês numa página em português.

### Cases na home (`casesHome`)

Cards de SigaBR e 637 Tennis Club só repetem "Clientes FISAM TECH". FISAM Quote e Kontrolla são links de produto.

1. Não acrescenta o que a empresa faz.
2. Não. Clube de tênis e produto próprio ficam ao lado da promessa de sistemas críticos, sem explicar a relação.
3. Não.
4. Não. A home não mostra o resultado do case.
5. Fraca. Há nomes. Não há escopo, data, papel da FISAM nem prova verificável.
6. "Ver cases" existe.

### Página de cases (`/pt-br/cases`, `src/app/[locale]/cases/page.tsx`)

Eyebrow fixo: "Evidence". Lead: "framing honesto, sem logos ou métricas inventadas." SigaBR: "Horas manuais viraram minutos, com rastreabilidade." Lista do fundador separada, com o aviso de que não são clientes. CTA: "Technical Discovery →".

1. Parcial. Dá exemplos (despachante, quadras, produtos próprios).
2. Parcial. Os exemplos puxam para operação de campo e SaaS pequeno, não para o comprador de sistema crítico.
3. Não.
4. Parcial no texto do SigaBR, com métrica sem fonte.
5. Afirmação do próprio site. Sem link de evidência, depoimento ou documento.
6. O link existe, em inglês, para `/qualify`.

### Processo (`#process`, `howWeWork`)

Entender, documentar, dividir, construir. Uma frase cada.

1. Parcial. Mostra uma ordem de trabalho genérica.
2. Não.
3. Não.
4. Não. "Código que sustenta o crescimento, com rastreabilidade" não diz o que o cliente recebe em cada etapa.
5. Não.
6. Não.

### Por que a FISAM (`why`)

"Clareza para decidir. Engenharia para executar." Três bullets de método.

1. Não adiciona oferta.
2. Não.
3. Não.
4. Parcial. Reforça diagnóstico antes da proposta.
5. "Experiência em ambientes críticos" reaproveita a trajetória do fundador.
6. Não.

### Fundador (`founder` + `FOUNDER_PRIOR_EXPERIENCE`)

O texto distingue a trajetória. A mesma lista aparece duas vezes seguidas no HTML: uma no parágrafo `founder.prior` e outra no `join` da constante. Gerdau entra no corpo e na lista, e fica de fora da grade "Mercado".

1. Parcial. Explica quem opera a empresa.
2. Não.
3. Não.
4. Não.
5. É a única prova desenvolvida. Continua sendo experiência anterior, como o próprio texto declara. "10+ anos" e "projetos críticos para Bradesco, B3, Itaú, Gerdau" não têm fonte fora do site.
6. Não.

### Diagnóstico técnico (`#discovery`)

"A partir de R$4,990.00". "O agendamento é liberado após a confirmação do pagamento." Inclusos: diagnóstico do cenário, riscos e próximos passos. Sem duração, participantes, formato do documento ou política de cancelamento.

1. Sim. É uma sessão paga de diagnóstico.
2. Não. Qualquer desafio técnico cabe.
3. Não neste bloco.
4. Parcial. Três bullets, sem artefato nomeado.
5. Não.
6. "Iniciar qualificação" vai para `/qualify`, que avisa o checkout. O preço está visível, no formato numérico en-US.

Em `/en` o mesmo bloco mostra `$99.00`. Em `/es` e `/de`, `€99.00`. No código, USD, EUR e GBP estão marcados `note: "TEST"` em `packages/payments/src/config/index.ts`. O site publica esses valores como preço.

### FAQ

"No Brasil o modelo comercial pode incluir WhatsApp e planos em BRL. Internacionalmente, o Technical Discovery é pago." A seção de preço, na mesma página, cobra e condiciona a agenda ao pagamento. A pergunta sobre Bradesco existe porque a grade de credenciais gera a dúvida.

1. Não esclarece a oferta. Introduz uma exceção não explicada.
2. Não.
3. Não.
4. Não. Não diz se a sessão brasileira é gratuita, paga ou as duas.
5. A resposta sobre bancos é correta e tardia.
6. Não.

### Fechamento

"Agendar Diagnóstico Técnico" aponta para `/qualify`, não para um calendário. O lead diz "Após o pagamento, libere o agendamento".

1. Já dito acima.
2. Não.
3. Não.
4. Não.
5. Não.
6. O rótulo promete agendamento. O destino é formulário e depois checkout.

### Parceiros (`/pt-br/parceiros`)

"Submeta, faça o pitch e, se aprovada, desenvolvemos seu MVP juntos." Passo 3: "Viramos sócios" e "equity". "Retorno em até 7 dias." "Aprovamos uma fração pequena das inscrições."

1. Esta página descreve outra oferta: estúdio de equity para MVP, não engenharia contratada.
2. Fundadores com ideia, não empresas com sistema em operação.
3. Parcial para quem quer construir um produto. Não para quem quer profissionalizar um sistema que já existe.
4. "Primeiro MVP" sob termos ainda não publicados.
5. Nenhuma parceria nomeada.
6. Formulário e, no código, abertura do WhatsApp com os dados.

O header só mostra Parceiros em `pt-br` e `es` (`SiteHeader.tsx`). O rodapé mostra em todos os idiomas.

### Qualificação (`/pt-br/qualify`, conferida no browser)

"Depois, você segue para o checkout." Faixas de orçamento: "2.500 – 10.000" até "500.000+", sem símbolo de moeda. A frase de privacidade não é um link.

1. Parcial. Fica claro que é a porta do diagnóstico.
2. Não há filtro de perfil além de cargo, empresa e faixa.
3. O campo "Desafio técnico" deixa o visitante escrever o problema. A página não o reconhece antes.
4. Não descreve a sessão.
5. Não.
6. Sim, se a pessoa aceitar ir ao pagamento. O botão diz "Continuar para checkout".

### Checkout (`/pt-br/checkout` sem `leadId`, conferido no browser)

Título: "Não foi possível iniciar o checkout". Corpo: "Missing leadId".

O fluxo feliz não foi percorrido. O estado de erro está em inglês e não oferece volta para a qualificação.

## 4. Problemas priorizados

| # | Problema | Impacto | Dificuldade | Onde |
| --- | --- | --- | --- | --- |
| 1 | No primeiro acesso em 390px, cookies e região cobrem o CTA e escondem "Somente necessários" | Alto | Baixa | `/pt-br`, `.cookie-banner` e `.geo-banner` em `globals.css` |
| 2 | Preço, FAQ e rótulos discordam: R$ 4.990 pago, FAQ "pode incluir WhatsApp", botão "Agendar" vai ao checkout | Alto | Baixa | home `discovery`, `faq`, `cta` |
| 3 | USD/EUR/GBP de teste (US$ 99, € 99) estão no ar. BRL sai como `R$4,990.00` | Alto | Baixa para o formato. Média para decidir o preço real | `packages/payments/src/config/index.ts`, `formatMoney` |
| 4 | Grade "Mercado: Bradesco · B3 · Next" é lida como carteira de clientes | Alto | Baixa | home, `credentials.marketValue` |
| 5 | Prova própria é nome sem evidência. SigaBR traz métrica sem fonte. Produto próprio mistura com cliente | Alto | Média | `/cases`, `FISAM_CLIENTS`, `cases.sigabr` |
| 6 | Depois do pagamento o calendário pode não abrir: sucesso chama unlock provisório, recusado em produção, e o e-mail não manda o token | Alto | Média | `checkout/success/page.tsx`, `api/booking/unlock`, webhooks |
| 7 | Página de parceiros vende equity de MVP e compete com a oferta de engenharia contratada | Alto | Média | `/parceiros` |
| 8 | Páginas internas não explicam o serviço e publicam title/description em inglês | Alto | Baixa | serviços, qualify, legal, `src/app/layout.tsx` |
| 9 | es/fr/de mantêm problemas, serviços e boa parte do miolo em inglês. Description de fr e de é a inglesa, com "systems that cannot fail" | Alto | Média | `src/messages/es.json`, `fr.json`, `de.json` |
| 10 | Não há um próximo passo único nem o entregável da sessão (duração, quem participa, o que se leva) | Alto | Média | hero, discovery, qualify |
| 11 | Promessas absolutas: "sem retrabalho, sem perda de dado", "sem parar a operação", "systems that cannot fail" | Médio | Baixa | cards de serviço e meta `en` |
| 12 | "baixa tolerância a falhas" pode ser lido como sistema que falha fácil | Médio | Baixa | `services.backend.body` |
| 13 | Canonical só na home e só relativo (`/pt-br`). Demais páginas sem canonical e sem hreflang no HTML | Médio | Baixa | `page.tsx` `generateMetadata`, demais páginas |
| 14 | Banner anuncia cookies de analytics que o código não instala | Médio | Baixa | `CookieBanner.tsx`, `src/lib/analytics/index.ts` |
| 15 | Política de privacidade em inglês e incompleta frente ao que o sistema faz | Médio | Média | `privacy/page.tsx` |
| 16 | Checkout sem lead mostra "Missing leadId" | Baixo | Baixa | `CheckoutClient.tsx` |
| 17 | Lista do fundador duplicada na home | Baixo | Baixa | `page.tsx` e `founder.prior` |
| 18 | Skip link diz "Skip" e o nav tem `aria-label="Main"` | Baixo | Baixa | `layout.tsx`, `SiteHeader.tsx` |

### Expressões a revisar

Não são proposta de texto. São as que hoje enfraquecem precisão ou soam a jargão, slogan vazio, inglês interno ou promessa sem prova.

- "operações que precisam evoluir", "base técnica para o próximo passo"
- "Problemas para os quais existimos"
- "Prova social"
- "Engajamento de entrada"
- "framing honesto"
- "rotulada como tal"
- "players financeiros e industriais"
- "conversa técnica séria"
- "Clareza para decidir. Engenharia para executar."
- "sem retrabalho, sem perda de dado"
- "Migração gradual sem parar a operação" como garantia
- "baixa tolerância a falhas"
- "Horas manuais viraram minutos"
- "systems that cannot fail" (description de `en`, reutilizada em `fr` e `de`)
- "Technical Discovery", "Evidence", "Missing leadId", "OK" após o envio de parceiros
- "01 / ENGINEERING"
- "Viramos sócios", "fração pequena", "retorno em até 7 dias"
- "tablet-first", "guardrails", "RAG" sem dizer o resultado para quem não é engenheiro

A assinatura "Engenharia que conecta tecnologia e negócio." está alinhada ao posicionamento pedido e não entra nesta lista.

A hipótese comercial de profissionalizar MVPs, inclusive feitos com IA, não está no site. O card de GenAI fala em copilotos e RAG com governança. O card de escala fala em "primeiro release". Nenhum dos dois diz que a FISAM assume um MVP existente para torná-lo operável. A página de parceiros empurra o oposto: construir o MVP como sócia.

## 5. Análise visual e design system

### O que a produção mostra

Em 1440px a home tem header fixo navy, navegação em linha, hero em duas colunas (texto cerca de 624px, diagrama cerca de 511px), sem scroll horizontal. Tipografia medida: corpo IBM Plex Sans, título Oxanium. Em 390px o menu vira botão, o hero fica em uma coluna, o título fica em 39px e também não há scroll horizontal. O hero é legível. A grade, o filete champanhe e o diagrama dão cara de escritório técnico, não de template genérico.

O que quebra a primeira impressão no celular é a sobreposição, não a marca. Os dois banners usam `bottom` abaixo de 640px e o de região (`z-index: 85`) cobre o de cookies (`z-index: 80`). No screenshot de 390px, "Iniciar diagnóstico técnico" fica atrás do cartão de cookies e "Somente necessários" fica atrás do cartão de região. No desktop de 1440px o banner de região começa em `top: 60px` e invade o header de 84px. O de cookies ocupa a faixa inferior central (560×184).

Contraste calculado com as cores do CSS ativo, pares principais:

| Par | Razão aproximada |
| --- | --- |
| Champanhe `#dabb76` sobre navy `#0b1524` | 9,9 |
| Texto do hero `#b8c3d3` sobre navy | 10,3 |
| Link do menu `#b8c4d4` sobre navy | 10,4 |
| Nota do hero `#95a5ba` sobre navy | 7,3 |
| Corpo do card `#617087` sobre branco | 5,0 |
| Muted `#627085` sobre `#f8f9fb` | 4,8 |
| Resposta do FAQ `#5d6c81` sobre `#f0f3f7` | 4,8 |

Os pares grandes passam AA. O texto secundário de card e FAQ fica perto do limite. Não é o defeito principal. O foco visível existe (`:focus-visible` e outline champanhe nos campos). `prefers-reduced-motion` zera transição e animação. Hover de card (`translateY(-3px)`) e de botão (`-2px`) é curto. Não há animação decorativa contínua.

Páginas internas (qualify, serviço, legal, cases) abandonam a composição da home. Ficam título, parágrafo e formulário sobre fundo claro, com o mesmo header e rodapé. O formulário de qualificação, visto a 390px, está alinhado, com labels acima dos campos e área de toque confortável. A hierarquia da home está correta: um `h1`, seções em `h2`, cards em `h3`. O logo do header tem `alt=""` e o nome ao lado, o que é aceitável. A foto do fundador tem alt.

### Inventário do sistema

Tokens que a página realmente usa, no segundo bloco de `:root` e no bloco de tipografia de `src/app/globals.css`:

- Navy `#0b1524`, superfície `#111e30` e `#101d2e`
- Champanhe `#dabb76`, ouro de texto `#795a2e`, foco `#b3945d`
- Tinta `#172337`, corpo `#263348`, muted `#627085`
- Fundos claros `#f8f9fb`, `#f7f8fa`, `#ffffff`
- `--font-display: Oxanium`, `--font-body: IBM Plex Sans`, `--font-mono: IBM Plex Mono`
- Botão com raio 7px e altura mínima 48px no bloco navy
- Shell de 1200px, cards com raio 10px, seções com cerca de 96px de padding no desktop e 64px abaixo de 700px

Componentes reutilizáveis: `SiteHeader`, `SiteFooter`, `LocaleRegionSwitcher`, `GeoSuggestionBanner`, `CookieBanner`, `ArchitectureVisual`, `QualifyForm`, `PartnersForm`, `WhistleblowingForm`, `CheckoutClient`, `FisamCheckout`. Não há design system em pacote. O estilo é um único CSS com três camadas empilhadas: um tema claro inspirado em interface de produto (SF Pro, botão pílula, azul `#0066cc`), depois o tema navy, depois as fontes auto-hospedadas. As duas primeiras camadas continuam no arquivo. Quem editar a de cima pode achar que mudou o site e não mudar a produção.

Inconsistências: botões da primeira camada são pílula e os da marca são retângulo curto. O switcher de região ainda usa pílula. Inputs usam raio 12px. O card de arquitetura é navy e os outros são brancos, de propósito. Páginas internas não usam eyebrow, índice nem a grelha da home. "01 / ENGINEERING" e vários CTAs furam o idioma. O Super Admin, no código, repete navy e as mesmas fontes, o que é coerente, mas não está no ar.

Preservar: marca wordmark com o monograma, navy, champanhe, Oxanium nos títulos, Plex Sans no texto, Plex Mono em eyebrow e índices, diagrama de arquitetura com teclado e toque, foto do fundador com a sombra deslocada, rodapé com CNPJ e e-mail, contraste do botão champanhe com texto navy.

Veredito: evoluir a identidade atual. Ela já comunica competência, precisão e um escritório específico. Substituí-la jogaria fora o único ativo visual que diferencia a empresa. O trabalho é completar o sistema nas páginas internas, apagar a camada CSS morta e corrigir banners, idioma e prova. A aparência de empresa consolidada falha no conteúdo (cases de uma linha, páginas de serviço vazias, preço de teste), não na paleta.

## 6. SEO, performance, acessibilidade, mobile

### SEO observado

Home `/pt-br`: title "FISAM TECH | Arquitetura e desenvolvimento para sistemas críticos". Description cita arquitetura, integrações, GenAI e avisa que Bradesco, B3, Itaú, Next e Capgemini não são clientes. `h1` único e igual à assinatura. Canonical `href="/pt-br"`, relativo. `hreflang` no HTML também relativo (`/en`, `/pt-br`, `/pt-pt`, `/es`, `/fr`, `/de`). O header HTTP `Link` e o sitemap usam URLs absolutas em `www.fisamtech.com`, com `x-default` na raiz, que redireciona.

Não há `og:title`, `og:description`, `og:image` nem Twitter Card na home. Não há JSON-LD na home. As páginas de serviço injetam `Service` no corpo, com `provider.url` em `https://fisamtech.com` (apex, não www).

Title e description próprios só foram vistos na home e em `/cases`. Qualify, serviços, parceiros, checkout e todas as legais caem no title "FISAM TECH" e na description inglesa do layout raiz.

`/fr` e `/de` publicam a description inglesa, inclusive "software for systems that cannot fail". `/es` tem description em espanhol. `/pt-pt` tem description em português e `h1` "Engenharia que liga tecnologia e negócio."

`robots.txt` ao vivo:

```
User-Agent: *
Allow: /
Sitemap: https://www.fisamtech.com/sitemap.xml
```

O `src/app/robots.ts` do HEAD também pede disallow de `/*/super-admin` e `/api/admin`. Isso não está na resposta ao vivo, coerente com o Super Admin ainda não publicado. `sitemap.ts` grava `lastModified: new Date()` em toda URL, então a data é a da geração, não a da mudança de conteúdo.

### Performance observável

Home prerenderizada (`x-nextjs-prerender: 1`), cache HIT na Vercel, HTML em torno de 70 KB. CSS em um arquivo. Fontes woff2 servidas do próprio domínio, com `font-display: swap`. Imagens da home: monograma e, mais abaixo, foto do fundador em webp com fallback png e `loading="lazy"`. Não medi Lighthouse nem LCP.

O chunk `356`, referenciado pela home, contém o código de `@stripe/stripe-js` porque `page.tsx` importa `formatMoney` do barrel `@fisamtech/payments`, que também exporta `FisamCheckout`. No browser desta auditoria, a home disparou `https://js.stripe.com/v3` e um iframe de sinais de fraude da Stripe. O HTML entregue pelo curl não contém essa tag. O único `loadStripe()` do código está dentro de `FisamCheckout`, que a home não monta. Fica registrado o request observado e o vazamento de bundle. Não ficou provado que todo visitante execute o script remoto antes do checkout.

### Acessibilidade observável

`html lang="pt-br"` correto na versão brasileira. Há link de pular conteúdo, com texto "Skip", embora `nav.skip` já tenha "Pular para o conteúdo". Navegação com `aria-label="Main"`. Menu móvel tem nome "Abrir menu" / "Fechar menu" e fecha com Escape. Diagrama: botões com `aria-pressed` e região `aria-live`. FAQ usa `details`/`summary`. Formulários de qualificação e denúncia associam label e campo. O aviso de privacidade da qualificação não é link. Erro do checkout não usa `role="alert"` (o da qualificação usa). Não foi feita varredura automática completa nem teste com leitor de tela.

O checkbox "Quero permanecer anônimo" é controlado por React e vem marcado. Os campos de identificação só entram no DOM quando ele é desmarcado (`WhistleblowingForm.tsx`). Não cliquei para desmarcar.

### Mobile

390px: sem overflow horizontal, menu no botão, CTAs em coluna por causa de `width: 100%` e `flex-wrap`. O defeito é a oclusão dos banners, descrita na seção 5. Abaixo de 700px a grade de processo deixa de ser quatro colunas, credenciais viram duas e serviços viram uma. Isso está no CSS e é adequado. O rodapé empilha. Não há página sem header nem rodapé.

## 7. Fluxos que um redesign não pode quebrar

### Qualificação e lead

`QualifyForm` faz `POST /api/leads` com nome, e-mail, empresa, cargo, desafio, `budget_range`, moeda, país (cookie `COUNTRY` ou inferido da moeda), locale e `source: "qualification"`. Zod em `src/app/api/leads/route.ts`. Grava em `leads` via Supabase ou `DATABASE_URL`. Se nenhum dos dois existe, devolve id efêmero e `degraded: true`, e a interface segue para o checkout mesmo assim. O cliente exige desafio e faixa. O schema do servidor deixa os dois opcionais.

Depois redireciona para `/{locale}/checkout?leadId&currency&country`.

### Checkout e pagamento

`POST /api/checkout/create` chama `createPaymentSession` com `serviceId: "technical_discovery"`. Brasil e moedas latino-americanas vão para Mercado Pago. USD, EUR e GBP vão para Stripe. `successUrl` é `/{locale}/checkout/success?leadId`. Pendente do Mercado Pago troca para `/checkout/pending`. Cancelamento volta para `/qualify`.

`FisamCheckout` carrega `https://sdk.mercadopago.com/js/v2` ou Stripe.js. Webhooks: `src/app/api/webhooks/stripe/route.ts` e `src/app/api/webhooks/mercadopago/route.ts`. Eles gravam `payments`, e em status aprovado assinam token, gravam `bookings` e tentam e-mail.

Preços em centavos em `PRICES.technical_discovery`. BRL 499000. USD/EUR 9900 e GBP 8900 com nota TEST. ARS, MXN, COP, CLP, PEN e UYU com nota HYPOTHESIS. A home não usa essas moedas latino-americanas. Ela escolhe moeda pelo idioma: pt-br BRL, restante USD ou EUR.

Não confirmei se as chaves de Stripe e Mercado Pago estão preenchidas em produção. Sem `leadId`, o checkout só mostra o erro.

### Agenda

`/book?token` valida token em `src/lib/booking/token.ts` e embute o Google Calendar (`NEXT_PUBLIC_GOOGLE_CALENDAR_URL` ou o link padrão em `CALENDAR_LINKS`). Sem token válido, a página diz que o link expirou.

A página de sucesso, se recebe `leadId`, chama `POST /api/booking/unlock` com `provisional: true`. Em `NODE_ENV=production` isso exige `paymentId` e responde 403. O webhook cria o token e não o devolve à página. O e-mail usa `sendEmail`, que ignora os markdown de `/emails` e monta uma tabela com as variáveis recebidas. O webhook manda `leadId` e, no Stripe, a frase "Use the success page link or email follow-up". Não manda URL com token. O template `emails/booking_unlocked.md` cita `{{calendar_url}}`, mas esse arquivo não é renderizado.

Há ainda uma frase em inglês cravada na página de sucesso, abaixo do botão.

### Parceiros

`PartnersForm` grava lead com `source: "partners"` e em seguida abre `https://wa.me/5511979562271` com nome, e-mail, telefone, ideia, problema e estágio. Se a API falha, o WhatsApp abre assim mesmo. O estado de sucesso na página é a string "OK".

### Denúncia

`WhistleblowingForm` faz `POST /api/denuncia`. Campos: categoria, descrição (20 a 10000 caracteres), data aproximada, relação, anônimo, e, se identificado, nome, e-mail, telefone e consentimento. Grava `whistleblowing_reports` e tenta e-mail para contato@fisamtech.com com protocolo e trecho de 280 caracteres. A resposta de sucesso da interface usa só `data.protocol`. Se o insert falha, `insertWhistleblowingReport` ainda devolve protocolo e `degraded: true`. A interface não lê `degraded`. Não enviei denúncia, então não sei se o banco de produção persistiu.

### Cookies de preferência e analytics

Middleware define `NEXT_LOCALE`, `CURRENCY` e `COUNTRY` por um ano, `SameSite=lax`, antes de qualquer clique no banner. O consentimento fica em `localStorage` (`fisam_cookie_consent`), não em cookie. `track()` só faz `console` fora de produção e, se existirem, `dataLayer.push` e `window.plausible`. Não há script de Plausible, GA, GTM, Meta ou Hotjar no HTML nem nos chunks procurados (`plausible` e `dataLayer` aparecem só como chamadas opcionais).

### Autenticação interna

No código, login, sessão `fisam_admin_session`, MFA (otpauth), RBAC e auditoria em `src/lib/super-admin/**` e `src/app/api/admin/**`. O layout de `[locale]` envolve essas rotas, então um redesign do header global as afeta. Em produção, a tela de login respondeu 404 nesta data. Não testei credencial.

### O que não quebrar, em lista curta

- `POST /api/leads` e o contrato do corpo
- `POST /api/checkout/create`, webhooks e a tabela de preços por moeda
- Token de `/book` e `BOOKING_SECRET`
- `POST /api/denuncia` e a tabela `whistleblowing_reports`
- Cookies `NEXT_LOCALE`, `CURRENCY`, `COUNTRY`
- WhatsApp `5511979562271` no header brasileiro
- Redirects legados em `next.config.ts`: `/cases.html`, `/parceiros`, `/privacidade.html`, `/termos.html`
- Super Admin e `/api/admin`, mesmo enquanto a produção responder 404

## 8. Inventário factual para privacidade, cookies, termos, compliance e denúncia

Isto descreve o que o código e o site mostram. Onde falta decisão, está marcado. Não há neste repositório prazo de retenção, base legal escolhida, DPO nem certificação.

### Dados que o sistema pede

| Origem | Dados | Destino no código |
| --- | --- | --- |
| Qualificação | Nome, e-mail, empresa, cargo, desafio, faixa de orçamento, moeda, país inferido, idioma | Tabela `leads`, evento `events` |
| Parceiros | Nome, e-mail, WhatsApp, ideia, problema, estágio | `leads` e mensagem no WhatsApp |
| Checkout | `leadId`, país, moeda, idioma, e-mail e nome se enviados. Dados de cartão ficam no provedor | Stripe ou Mercado Pago, tabela `payments` |
| Agenda | Token, `lead_id`, URL do calendário | Tabela `bookings`, iframe Google |
| Denúncia | Categoria, relato, data, relação, opcionalmente nome, e-mail, telefone, consentimento | `whistleblowing_reports` e e-mail interno |
| Navegação | País do header `x-vercel-ip-country` ou `cf-ipcountry`, idioma, moeda | Cookies. O IP em si não é gravado pelo código visto |
| Admin (código, não verificado no ar) | Usuário, senha, segredo MFA, ações de auditoria | Tabelas do Super Admin |

Não há cadastro de conta para o visitante do site institucional.

### Cookies e scripts de terceiros

| Nome | Onde | Finalidade aparente | Domínio |
| --- | --- | --- | --- |
| `NEXT_LOCALE` | Middleware e switcher | Idioma | primeiro-party, 1 ano |
| `CURRENCY` | Middleware e switcher | Moeda e roteamento de pagamento | primeiro-party, 1 ano |
| `COUNTRY` | Middleware e switcher | País sugerido | primeiro-party, 1 ano |
| `fisam_admin_session` | Login admin | Sessão interna | primeiro-party, só no código admin |
| `fisam_cookie_consent` | localStorage | Lembrar o clique do banner | não é cookie |
| Chave de região confirmada | localStorage | Não repetir o banner | não é cookie |
| Stripe.js | Checkout, e request observado na home desta sessão | Pagamento e sinais de fraude | `js.stripe.com` |
| SDK Mercado Pago | Checkout quando o provedor é MP | Pagamento | `sdk.mercadopago.com` |
| Google Calendar | `/book` com token válido | Agendamento | Google |
| WhatsApp | Links `wa.me` | Conversa e, em parceiros, envio do formulário | Meta |

Não foram encontrados pixels de anúncio, Google Tag Manager, GA4, Meta Pixel, Hotjar ou Clarity.

### Operadores vistos no código

| Função | Provedor | Indício de transferência internacional |
| --- | --- | --- |
| Hospedagem | Vercel | Empresa dos EUA. A resposta desta auditoria saiu de `gru1` |
| Banco | Supabase e/ou Postgres (`DATABASE_URL`) | Supabase é empresa dos EUA. Região do projeto não está no código |
| E-mail | Resend (`api.resend.com`), remetente contato@fisamtech.com | Empresa dos EUA. Sem a chave, o e-mail não sai |
| Pagamento internacional | Stripe | EUA / Irlanda, conforme a conta, não especificada no código |
| Pagamento BRL e LATAM | Mercado Pago | Processamento local da conta. A empresa é argentina |
| Agenda | Google Calendar | Google |
| Mensagem | WhatsApp | Meta |
| Analytics de produto | Tabela `events` no próprio banco, se configurado | Mesmo destino do banco |

Não verifiquei as variáveis de ambiente de produção. Não sei se Supabase, Resend, Stripe e Mercado Pago estão ativos no deploy atual. O modo degradado existe para lead e denúncia.

### O que as páginas legais dizem e o que o sistema faz

Privacidade (`/pt-br/privacy`): o lead traduzido avisa que a revisão jurídica está pendente e que o texto não é certificação. O corpo está em inglês. Cita formulários de qualificação e parceiros, metadados de pagamento, cookies de idioma e moeda, Stripe, Mercado Pago e calendário. Não cita denúncia, WhatsApp, Vercel, Supabase, Resend, header de país, tabela `events` nem Super Admin. Não há prazo de retenção, bases legais, encargos nem canal além de contato@fisamtech.com. DPO: decisão empresarial pendente. O programa de compliance nomeia Filipe Godinho Gomes como sócio-administrador e compliance officer, não como encarregado.

Termos (`/pt-br/terms`): corpo em inglês. Diz que o diagnóstico é pago e que a agenda abre após o webhook. Diz que reembolso e jurisdição internacional serão fechados com assessoria. Foro brasileiro: "Embu das Artes / Embu-Guaçu region as historically stated, pending intl counsel update." Reembolso, foro definitivo e contrato da sessão: decisão empresarial pendente. A página não descreve o programa de sócios nem equity.

Cookies: nomeia `NEXT_LOCALE`, `CURRENCY` e `COUNTRY`. Diz que analytics opcional fica desligado até o consentimento e que marketing não vem ligado. Isso combina com a ausência de pixel. Não combina com o texto do banner, que fala em "cookies de analytics" como se existissem. Não menciona Stripe.js, Mercado Pago nem o iframe do Google. CMP completo: decisão pendente. O próprio texto diz que o CMP pode ser trocado depois.

Compliance (`/pt-br/compliance`): página em português, vigência 09/11/2026, CNPJ, código de ética, anticorrupção (Lei 12.846/2013), conflito, setor público (Lei 14.133/2021), brindes, LGPD por remissão, canal de denúncias e a frase de que não é certificação ISO nem auditoria independente. Isso está publicado. Não há selo no site.

Denúncia: existe fluxo, não só página. Formulário, validação, protocolo `FT-WB-{data}-{sufixo}`, tentativa de e-mail ao compliance officer. Lacunas: persistência depende do banco, o alerta depende da Resend, a interface mostra protocolo mesmo no modo degradado, e a política de privacidade não descreve esse tratamento com o mesmo detalhe da página de compliance. Não testei o POST.

## 9. Afirmações que pedem evidência ou mais precisão

| Afirmação no site | Situação |
| --- | --- |
| Bradesco, B3, Itaú, Banco Next, Capgemini Engineering, Gerdau | O site e `FOUNDER_PRIOR_EXPERIENCE` dizem que são trajetória do fundador, não clientes da FISAM. Não há evidência externa no repositório. A grade "Mercado" apresenta os nomes como indicador da empresa. |
| "10+ anos" e "Tech Lead" | Afirmação do site sobre o fundador. Sem fonte anexada. |
| SigaBR é cliente e integrou DETRAN via RENAVAM e Banco Rendimento. "Horas manuais viraram minutos" | Afirmação do site (`cases.sigabr`). Sem contrato, data, métrica de origem ou link. |
| 637 Tennis Club é cliente, SaaS de quadras | Afirmação do site (`cases.tennis`). Sem evidência anexada. |
| FISAM Quote, Kontrolla, FNRH, FinTrack, FISAM Tour e Ponto "em operação" | O site lista URLs. Não abri cada produto para auditar operação. São produtos da casa, não clientes. |
| "sem retrabalho, sem perda de dado" | Promessa absoluta. Sem condição nem evidência. |
| "Migração gradual sem parar a operação" | Promessa absoluta no card de legado. |
| "systems that cannot fail" | Description de `/en`, `/fr` e `/de`. Promessa absoluta. |
| Preço "a partir de" R$ 4.990, US$ 99, € 99 | Publicado. USD, EUR e GBP estão marcados TEST no código. O visitante não vê essa ressalva. |
| "Retorno em até 7 dias" e "viramos sócios" | Compromisso operacional e societário sem termo publicado. |
| "Aprovamos uma fração pequena" | Sem número. |
| Diagnóstico gratuito no Brasil "pode incluir" | Não há regra no código que isente o Brasil do checkout. A home cobra. |
| Meios de pagamento Mercado Pago e Stripe | O código implementa os dois. Não confirmei chaves ativas em produção. |
| Canal de denúncias confidencial, com protocolo | O fluxo existe no código. Persistência e e-mail dependem de ambiente não verificado. |
| Programa de compliance vigente em 09/11/2026 | Publicado na página. Não é certificação. A própria página diz isso. |
| Foro Embu das Artes / Embu-Guaçu | Texto dos termos diz que é histórico e está pendente de revisão. |

Não há depoimentos, logos de cliente, números de projeto, NPS nem certificações no site. Isso é consistente com a regra do código de não inventar clientes. O problema é outro: o que sobrou não sustenta a compra, e algumas frases ainda prometem resultado absoluto.

## 10. Recomendações de correção

Ainda sem implementar e sem redigir o texto final.

### Quick wins

1. Empilhar os banners sem sobreposição. No celular, o de região acima do de cookies, com os dois botões de cookies visíveis, e nenhum dos dois sobre o CTA principal. No desktop, o de região abaixo do header.
2. Unificar a oferta da sessão: ou é paga em todos os mercados, ou o Brasil tem outro caminho. O FAQ, o preço e os três rótulos precisam contar a mesma história. O botão que diz "Agendar" só deve dizer isso quando houver calendário.
3. Formatar BRL com `Intl.NumberFormat('pt-BR')` em `formatMoney`. Hoje o locale é `undefined`, e a home prerenderizada sai `R$4,990.00`.
4. Tirar do ar os preços marcados TEST, ou rotular de forma visível até a decisão comercial. Decisão do valor internacional: pendente.
5. Trocar a grade "Mercado: Bradesco · B3 · Next" por um rótulo que não pareça carteira. Manter a distinção que o parágrafo já faz.
6. Apagar a segunda lista de empresas na seção do fundador.
7. Traduzir as strings cravadas: "Skip", "Main", "ENGINEERING", "Technical Discovery", "Evidence", "Missing leadId", o parágrafo inglês da página de sucesso e o "E-mail" / "OK" de parceiros.
8. Title e description próprios em qualify, serviços, parceiros e páginas legais, no idioma da rota. Canonical absoluto em `https://www.fisamtech.com`.
9. Corrigir as descriptions de `fr` e `de`, que hoje são o texto inglês com "cannot fail".
10. Ligar "política de privacidade" no formulário de qualificação à rota `/privacy`.
11. No checkout sem `leadId`, mostrar a frase traduzida e um link de volta para `/qualify`.
12. Fazer a página de sucesso usar o token que o webhook já grava, ou não dizer que a agenda está liberada até o token existir. Incluir o link no e-mail que o webhook envia.
13. Não mostrar protocolo de denúncia como sucesso quando `degraded` for verdadeiro.

### Mudanças estruturais

1. Decidir o comprador principal. Hoje a home fala com quatro dores, um serviço de campo sem página e um programa de equity. A hipótese de profissionalizar MVP, inclusive feito com IA, precisa entrar como oferta explícita ou ficar de fora. Se entrar, a página de parceiros não pode ser o único lugar em que MVP aparece, e não deve ser no frame de sociedade.
2. Reescrever cases com o que for documentável: problema, o que a FISAM fez, o que mudou, o que é produto próprio e o que é experiência do fundador. Sem métrica até haver fonte. Sem logo até haver autorização.
3. Cada serviço precisa de página com problema, resultado, limites e prova. O card de campo ou ganha página ou sai do grid.
4. Definir o entregável do diagnóstico: duração, quem participa, o que o cliente leva, o que fica de fora, reembolso. Isso é decisão comercial e jurídica, não só de copy. Os termos hoje declaram essa pendência.
5. Completar es, fr e de. Cerca de 110 strings nesses arquivos são cópia do inglês, inclusive a seção inteira de problemas e a de serviços.
6. Reescrever privacidade, termos e cookies no idioma de cada rota, cobrindo denúncia, WhatsApp, Vercel, banco, Resend, Stripe, Mercado Pago e Google Calendar. Retenção, bases e DPO continuam decisão pendente. Não publicar o que o jurídico não fechou.
7. Separar o CSS morto (tema claro, SF Pro, azul `#0066cc`) do tema navy que está no ar, e aplicar o mesmo ritmo visual às páginas internas sem inventar outra marca.
8. Parar de importar `formatMoney` do barrel que também exporta o checkout, para a home não carregar Stripe.js.
9. Publicar o Super Admin só quando for a hora, e então alinhar o `robots.txt` ao disallow que o HEAD já descreve. Até lá, tratar essas rotas como contrato do código, não como superfície pública.

## O que não foi verificado

- Pagamento real com Stripe ou Mercado Pago, e se as chaves de produção estão configuradas.
- Webhook recebido de verdade e e-mail entregue pela Resend.
- Se o banco de produção persiste leads e denúncias ou se cai no modo degradado.
- Login, MFA e telas do Super Admin. Em produção a URL de login respondeu 404.
- Conteúdo do Google Calendar além da existência do link no código.
- Operação real dos produtos nas URLs listadas.
- Veracidade contratual de SigaBR, 637 Tennis Club e da trajetória no Bradesco, B3, Itaú, Next, Capgemini e Gerdau.
- Lighthouse, leitor de tela e auditoria de contraste pixel a pixel fora dos pares calculados.
- Se o request a `js.stripe.com` na home acontece para todos os visitantes ou só quando o chunk é avaliado neste browser.

Confirmação: nenhum arquivo de aplicação, estilo, rota, mensagem ou página legal foi alterado. O único arquivo gravado é este relatório.
