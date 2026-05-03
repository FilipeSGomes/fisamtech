Você vai reescrever e reestruturar o site da FISAM TECH localizado 
em fisamtech.com. O site é HTML/CSS estático. Faça todas as 
alterações descritas abaixo mantendo a estrutura de arquivo única 
e sem adicionar dependências externas.

## ALTERAÇÕES OBRIGATÓRIAS

### 1. HERO SECTION
Substitua o headline atual por:

Título: "Você não precisa de mais um desenvolvedor. Precisa de alguém que entenda o problema antes de escrever uma linha de código."

Subtítulo: "A FISAM TECH é liderada por um Tech Lead com mais de 10 anos em sistemas críticos, setor financeiro e arquitetura de alta disponibilidade. Agora aplicando essa experiência em empresas que precisam de tecnologia funcionando de verdade."

Mantenha os dois botões atuais (WhatsApp e Ver frentes de atuação).

### 2. SEÇÃO "SOBRE"
Substitua o texto atual por:

"A FISAM TECH nasceu da decisão de aplicar experiência de nível enterprise em problemas reais de empresas que não têm acesso a esse nível técnico. Filipe Gomes lidera a empresa com mais de 10 anos de atuação como Tech Lead nos setores financeiro e bancário, com passagem por Capgemini Engineering, TQI, Banco Next e projetos na B3 e Bradesco. O que ele traz para cada projeto: capacidade de diagnosticar o problema antes de propor solução, e de construir o que vai durar, não o que vai precisar ser refeito em seis meses."

### 3. SEÇÃO DE SERVIÇOS
Reduza para exatamente 3 serviços. Remova todos os outros. Use as seguintes descrições:

Serviço 1:
Título: "Site que gera contato"
Descrição: "Criação de site institucional moderno, rápido e indexado no Google. Desenvolvido para converter visitante em contato comercial, com formulário funcional, WhatsApp integrado e estrutura que você consegue manter sem depender de agência."

Serviço 2:
Título: "Integração entre sistemas"
Descrição: "Conexão entre ferramentas que hoje não conversam entre si. ERP, CRM, planilha, WhatsApp, plataformas de pagamento. Reduz retrabalho manual, elimina erro de digitação e dá mais controle sobre a operação."

Serviço 3:
Título: "Sistema web sob medida"
Descrição: "Desenvolvimento de sistema desenhado para o seu processo, não adaptado de template genérico. Para empresas que cresceram além do que planilha e WhatsApp conseguem suportar e precisam de estrutura digital própria."

### 4. NOVA SEÇÃO: PARA QUEM É
Adicione esta seção após os serviços, antes de "Como pensamos":

Título da seção: "Para quem faz sentido conversar com a FISAM TECH"

Parágrafo: "Se a sua empresa ainda opera por WhatsApp, planilha ou processos manuais que funcionavam quando o volume era menor, mas estão começando a travar o crescimento, esse é o problema que a FISAM TECH resolve. Também atendemos gestores que já tentaram contratar desenvolvedor e receberam entrega que não funcionou na prática. A diferença está no diagnóstico: antes de qualquer proposta, a gente entende o que está quebrando e por quê."

### 5. NOVA SEÇÃO: CASOS DE USO
Adicione após a seção "Para quem é". Título: "Exemplos do que foi resolvido"

Adicione 3 cards com este formato (texto anônimo, sem nome de cliente):

Card 1:
"Empresa de serviços com atendimento por WhatsApp e agenda no papel. Entregamos sistema web de agendamento integrado ao WhatsApp, com confirmação automática e histórico de cliente. Tempo de implantação: 3 semanas."

Card 2:
"Comércio com controle de estoque em planilha e nota fiscal manual. Criamos integração entre sistema de emissão de nota e controle interno, eliminando lançamento duplo e reduzindo erro de estoque."

Card 3:
"Prestador de serviço sem presença digital. Entregamos site institucional com formulário de contato, Google Meu Negócio configurado e página otimizada para busca local. Primeiros contatos orgânicos em 18 dias."

### 6. SEÇÃO DO FUNDADOR
Substitua o texto atual por:

"Filipe Gomes é Tech Lead com mais de 10 anos de experiência em desenvolvimento backend, arquitetura de microsserviços e sistemas distribuídos. Atuou em projetos críticos nos setores financeiro e bancário, com passagem por Capgemini Engineering, TQI e Banco Next. Tem certificação Scrum, MBA em Gestão de Projetos e experiência prática com AWS, Kafka, Docker e CI/CD. Na FISAM TECH, aplica essa base técnica para resolver problemas reais de empresas que precisam de solução que funcione, não de entrega que impressiona na apresentação e quebra na operação."

### 7. FORMULÁRIO DE CONTATO
Adicione antes do botão final de WhatsApp um formulário simples com os campos:
- Nome (obrigatório)
- WhatsApp (obrigatório)  
- Mensagem: "Descreva em uma linha o problema que você quer resolver" (obrigatório)
- Botão: "Enviar mensagem"

O formulário deve usar:
action="https://formspree.io/f/xpqbpaop"
method="POST"

Não adicione enctype. Não adicione mailto.

### 8. RODAPÉ
Adicione ao rodapé, antes do CNPJ:
"São Paulo, SP | Atendimento remoto para todo o Brasil"

### 9. META TAGS (HEAD)
Substitua ou adicione as seguintes meta tags no <head>:

<title>FISAM TECH | Desenvolvimento Web e Integração de Sistemas para Empresas</title>
<meta name="description" content="A FISAM TECH desenvolve sites, sistemas web e integrações para pequenas e médias empresas que precisam de tecnologia funcionando na prática. Tech Lead com 10 anos em sistemas críticos. São Paulo.">
<meta name="keywords" content="desenvolvimento de sistemas, site para empresa, integração de sistemas, automação de processos, tech lead, São Paulo">

Adicione também estas tags Open Graph:
<meta property="og:title" content="FISAM TECH | Tecnologia que funciona na prática">
<meta property="og:description" content="Sites, sistemas e integrações para empresas que cresceram além do que planilha e WhatsApp conseguem suportar.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://fisamtech.com">

### 10. REGRAS GERAIS
- Não altere cores, fontes ou estrutura visual existente
- Não adicione imagens novas
- Não remova os links de WhatsApp existentes
- Mantenha cookies banner e links de privacidade
- Preserve a navegação atual
- O arquivo final deve ser HTML válido e funcional