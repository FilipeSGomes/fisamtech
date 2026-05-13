# FISAM TECH

Site institucional estático da FISAM TECH: desenvolvimento digital sob medida para pequenas e médias empresas que ainda dependem de WhatsApp, planilhas e processos manuais.

## Estrutura

- `index.html`: página principal, SEO básico, seções comerciais e formulário de contato.
- `styles.css`: identidade visual, layout responsivo e estados de acessibilidade.
- `main.js`: animações leves, banner de cookies e fallback do formulário para WhatsApp.
- `main.test.js`: testes unitários simples para os comportamentos em JavaScript.
- `privacidade.html` e `termos.html`: páginas legais.

## Validação local

```bash
node --test main.test.js
```

Como o site não usa build step, uma inspeção estática dos arquivos HTML/CSS/JS também faz parte da revisão antes de publicar.
