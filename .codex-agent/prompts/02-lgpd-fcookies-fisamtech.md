# PROMPT — Conformidade Legal: CNPJ, LGPD e Cookies

## Instrução de leitura
Leia APENAS os arquivos listados abaixo.
Não faça varredura do repositório.

## Arquivos para ler
- index.html (raiz do site)
- style.css ou styles.css (arquivo principal de estilos)
- Qualquer arquivo JS principal (app.js, main.js ou similar)

## Contexto

Site institucional da FISAM TECH precisa de adequação legal mínima
obrigatória no Brasil: exibição de CNPJ, conformidade com LGPD
e banner de aceite de cookies.

## Objetivo

Adicionar 3 elementos sem alterar o design existente:

### 1. CNPJ no rodapé
Adicionar CNPJ da empresa no footer existente.
```
FISAM TECH LTDA
CNPJ: XX.XXX.XXX/XXXX-XX
```
(substituir pelos dados reais antes de publicar)

### 2. Links legais no rodapé
Adicionar dois links no footer:
- Política de Privacidade → /privacidade.html
- Termos de Uso → /termos.html

### 3. Banner de cookies (LGPD)
Banner fixo na parte inferior da tela com:
- Texto: "Usamos cookies para melhorar sua experiência.
  Ao continuar navegando, você concorda com nossa
  Política de Privacidade."
- Botão "Aceitar" → esconde o banner e salva em localStorage
- Link "Saiba mais" → abre /privacidade.html
- Aparece apenas se usuário ainda não aceitou

### 4. Página privacidade.html
Criar página simples com política de privacidade padrão LGPD contendo:
- Quais dados são coletados (nome, email, telefone)
- Finalidade do uso
- Direitos do titular (acesso, correção, exclusão)
- Contato para solicitações: contato@fisamtech.com
- Data de vigência

### 5. Página termos.html
Criar página simples com termos de uso contendo:
- Descrição dos serviços oferecidos
- Responsabilidades do usuário
- Limitação de responsabilidade
- Foro: comarca de São Paulo/SP
- Data de vigência

## Escopo permitido
- index.html → adicionar CNPJ no footer + links legais
- style.css → adicionar estilos do banner de cookies apenas
- Qualquer JS principal → adicionar lógica do banner
- Criar privacidade.html (novo arquivo)
- Criar termos.html (novo arquivo)

## Escopo proibido
- Não altere layout, cores ou design existente
- Não adicione dependências externas
- Não altere nenhuma outra página além das listadas

## Estilo do banner de cookies

```css
/* Adaptar às cores existentes do site */
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  color: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 9999;
  font-size: 14px;
}

.cookie-banner.hidden {
  display: none;
}

.cookie-banner button {
  background: var(--cor-principal, #5b2a86);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
}
```

## Lógica JS do banner

```javascript
// Mostrar banner apenas se não aceitou ainda
const cookieBanner = document.getElementById('cookie-banner');
if (localStorage.getItem('cookies-accepted')) {
  cookieBanner.classList.add('hidden');
}

document.getElementById('cookie-accept').addEventListener('click', () => {
  localStorage.setItem('cookies-accepted', 'true');
  cookieBanner.classList.add('hidden');
});
```

## Como testar
1. Abrir index.html — banner deve aparecer
2. Clicar "Aceitar" — banner deve sumir
3. Recarregar página — banner não deve aparecer
4. Abrir em aba anônima — banner deve aparecer novamente
5. Verificar CNPJ no rodapé
6. Verificar links de privacidade e termos no rodapé
7. Acessar /privacidade.html — deve carregar sem erro
8. Acessar /termos.html — deve carregar sem erro

## Dados para preencher antes de publicar
- CNPJ real da FISAM TECH
- Razão social completa
- Data de vigência dos documentos
- Email de contato para LGPD

## Sinalização obrigatória
Se o site usar framework (React, Vue, etc) em vez de HTML estático,
reporte antes de criar os arquivos .html separados.