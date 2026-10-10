# Reunião SES-GO / Economia

Apresentação web por tópicos, preparada para importar no Netlify a partir deste repositório. Site estático, sem dependências externas ou credenciais.

## Desenvolvimento

Use Node.js 24 (ou versão >= 20).

```sh
npm run dev
```

Servidor na porta 5173. Navegue pelo menu, pelas setas da tela ou pelas teclas ← / →. Home e End levam à primeira e à última tela. O botão **Imprimir / PDF** inclui as seis telas; **Tela cheia** ativa o modo de apresentação quando suportado pelo navegador.

```sh
npm run build
npm run preview
```

O build gera `dist/`. Não há instalação de pacotes: todos os scripts usam módulos nativos do Node.js.

## Importar no Netlify

1. No Netlify, importe o repositório `RafaelHirt/reuniaoeconomia` do GitHub.
2. Selecione a branch `main` e mantenha o diretório base na raiz.
3. Use **Build command:** `npm run build` e **Publish directory:** `dist`.
4. Publique. O arquivo `netlify.toml` já registra esses parâmetros, a versão do Node e os cabeçalhos HTTP.

Não são necessárias variáveis de ambiente. A publicação no Netlify será feita pelo proprietário do site.

## Conteúdo

- Abertura e pauta.
- Pauta I — Condicionantes: textos fornecidos do Despacho da Economia, agrupados por PC Posse, PC SLMB e HEF, sem gráficos ou análises adicionais.
- Pauta II — Aditivos em tramitação na Economia atualmente: Rede HEMO (SEI nº 202600010051458, manifestação com check) e PC SLMB (despacho técnico de 29/09/2026, pendente GAB/Economia).
- Pauta III — Prazo de análises: destaque à primeira manifestação da Economia, em dias após a SEAD; CRESM (53 dias), PC de Goianésia (44), HUGOL (28) e HEF (27), em ordem decrescente.

Os valores, prazos e referências SEI foram fornecidos para a reunião, sem consulta independente aos documentos. A data de 29/09/2026 e a manifestação da Rede HEMO foram informadas pelo usuário. Os textos das condicionantes são reproduzidos a partir do conteúdo fornecido, com separação dos números SEI em rodapés.

A identidade visual usa verde, amarelo e uma assinatura textual inspirada em Goiás / SES-GO. A assinatura é textual; a imagem da marca enviada na conversa ainda precisa de um arquivo acessível para incorporação. Não se utiliza um símbolo que simule o logotipo oficial.

Edite o texto em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.
