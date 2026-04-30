# PROMPT — Conformidade Legal: CNPJ, LGPD e Cookies

## Instrução de leitura
Leia APENAS os arquivos listados abaixo.
Não faça varredura do repositório.

## Arquivos para ler
- index.html
- styles.css
- main.js

## Contexto

Site institucional HTML estático da FISAM TECH.
Stack: HTML puro + CSS com variáveis + JS vanilla. Sem framework.
Design Apple-style com variáveis CSS já definidas em :root.
Footer existente usa classes: .site-footer, .footer-shell, .footer-brand,
.footer-links, .footer-contact.
JS atual tem apenas animações reveal e build-text — sem lógica de cookies.

## Dados reais para usar

```
Razão social: Fisam Tech Tecnologia Ltda - ME
CNPJ: 59.897.573/0001-02
Endereço: Rua Inácio Pires de Moraes, 549, Apt 42 Bloco 5 B
          Centro, Embu-Guaçu - SP, CEP 06900-070
Email LGPD: contato@fisamtech.com
WhatsApp: +55 11 97956-2271
Foro: Embu-Guaçu/SP
Data de vigência: Abril/2025
```

## Objetivo

Adicionar 4 elementos sem alterar design ou comportamento existente:

---

### 1. CNPJ + links legais no footer (index.html)

Adicionar dentro de `.footer-brand` abaixo do nome:
```html
<p>CNPJ: 59.897.573/0001-02</p>
```

Adicionar dentro de `.footer-links` os links:
```html
<a href="privacidade.html">Privacidade</a>
<a href="termos.html">Termos de Uso</a>
```

---

### 2. Banner de cookies (index.html + styles.css + main.js)

**HTML** — adicionar antes de `</body>`:
```html
<div class="cookie-banner" id="cookie-banner" role="alert" aria-live="polite">
  <p>
    Usamos cookies para melhorar sua experiência. Ao continuar navegando,
    você concorda com nossa
    <a href="privacidade.html">Política de Privacidade</a>.
  </p>
  <button id="cookie-accept" type="button">Aceitar</button>
</div>
```

**CSS** — adicionar ao final de styles.css usando variáveis existentes:
```css
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--brand-navy);
  color: var(--body-on-dark);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 200;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.cookie-banner p {
  font-size: 14px;
  color: var(--body-muted);
  margin: 0;
}

.cookie-banner a {
  color: var(--primary-on-dark);
  text-decoration: underline;
}

.cookie-banner button {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 160ms ease;
}

.cookie-banner button:hover {
  background: var(--primary-focus);
}

.cookie-banner.hidden {
  display: none;
}

@media (max-width: 700px) {
  .cookie-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
```

**JS** — adicionar ao final de main.js antes do bloco `if (typeof window`:
```javascript
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('fisam-cookies-accepted')) {
    banner.classList.add('hidden');
    return;
  }
  const btn = document.getElementById('cookie-accept');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.setItem('fisam-cookies-accepted', 'true');
      banner.classList.add('hidden');
    });
  }
}
```

Adicionar chamada dentro do bloco `if (typeof window !== "undefined")`:
```javascript
initCookieBanner();
```

---

### 3. Criar privacidade.html

Página simples com mesmo header e footer do index.html. Conteúdo:

```
Política de Privacidade — FISAM TECH

1. Quais dados coletamos
   Nome, e-mail e telefone fornecidos via formulário ou WhatsApp.

2. Finalidade
   Contato comercial, envio de propostas e suporte ao cliente.

3. Compartilhamento
   Não compartilhamos dados com terceiros sem consentimento.

4. Direitos do titular (LGPD)
   Acesso, correção, exclusão e portabilidade dos dados.
   Solicitações: contato@fisamtech.com

5. Cookies
   Usamos cookies técnicos para funcionamento do site.
   Não utilizamos cookies de rastreamento de terceiros.

6. Vigência
   Esta política entra em vigor em Abril/2025.

Contato: contato@fisamtech.com
```

---

### 4. Criar termos.html

Página simples com mesmo header e footer do index.html. Conteúdo:

```
Termos de Uso — FISAM TECH

1. Serviços
   A FISAM TECH oferece desenvolvimento de software,
   automações, integrações e consultoria tecnológica.

2. Responsabilidades do usuário
   Fornecer informações verdadeiras e usar os serviços
   de forma lícita.

3. Limitação de responsabilidade
   A FISAM TECH não se responsabiliza por danos
   decorrentes do uso indevido dos serviços.

4. Propriedade intelectual
   Todo conteúdo deste site é de propriedade da FISAM TECH.

5. Foro
   Comarca de Embu-Guaçu/SP.

6. Vigência
   Estes termos entram em vigor em Abril/2025.

Contato: contato@fisamtech.com
```

---

## Escopo permitido
- index.html → footer + banner HTML
- styles.css → estilos do banner apenas (append no final)
- main.js → função initCookieBanner + chamada (append no final)
- Criar privacidade.html (novo)
- Criar termos.html (novo)

## Escopo proibido
- Não altere nenhuma seção existente do index.html
- Não altere animações ou lógica existente do main.js
- Não altere variáveis CSS existentes
- Não adicione dependências externas

## Como testar
1. Abrir index.html — banner deve aparecer no rodapé
2. Clicar "Aceitar" — banner some
3. Recarregar — banner não aparece
4. Aba anônima — banner aparece novamente
5. Footer deve mostrar CNPJ e links de privacidade/termos
6. /privacidade.html deve carregar sem erro
7. /termos.html deve carregar sem erro
8. npm run build (se existir) deve passar

## Sinalização obrigatória
Se existir arquivo de build ou bundler (vite.config, webpack, etc),
reporte antes de criar arquivos .html separados.