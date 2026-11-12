# Reunião SES-GO / Economia

Apresentação web sobre o custeio mensal de seis policlínicas, preparada para importar no Netlify. Site estático, sem dependências externas ou credenciais.

## Desenvolvimento

Use Node.js 24 (ou versão >= 20).

```sh
npm run dev
```

Servidor na porta 5173. A apresentação tem três telas: abertura, comparativo mensal e encerramento. A capa preserva a identidade visual Saúde & Economia, com verde, amarelo e a logo oficial da SES-GO.

Navegue pelo menu, pelas setas da tela ou pelas teclas ← / →. Home e End levam à primeira e à última tela. O histórico do navegador preserva a navegação. No computador, a abertura usa modo apresentação, com uma tela por vez ajustada à janela. **Pautas** abre o menu; **Modo leitura** restaura a navegação lateral e os textos no tamanho normal. **Esc** fecha o menu ou volta ao modo leitura. No celular, a abertura usa modo leitura e a tabela permite rolagem horizontal, mantendo a coluna da unidade visível. Quando o foco está na tabela, as setas permitem percorrê-la sem mudar de tela.

**Imprimir / PDF** inclui as três telas em A4 paisagem, com a tabela completa na página central. **Tela cheia** ativa o modo de apresentação quando suportado pelo navegador.


```sh
npm run build
npm run preview
```

O build gera `dist/` com os arquivos estáticos. Os scripts usam módulos nativos do Node.js e não exigem instalação de pacotes.

## Conteúdo

O comparativo reproduz os valores das imagens fornecidas para Formosa, Goianésia, Goiás, Posse, Quirinópolis e SLMB. As colunas são Unidade, Custeio atual, Custeio LOA 2027, Custeio mensal no aditivo — 1ª fase e Diferença — 1ª fase.

A diferença corresponde a **custeio mensal no aditivo menos custeio LOA 2027**, calculada por unidade e no total. Todos os valores são mensais, em reais; não há anualização.

| Unidade | Custeio atual | Custeio LOA 2027 | Aditivo — 1ª fase | Diferença — 1ª fase |
| --- | ---: | ---: | ---: | ---: |
| P. Formosa | R$ 2.401.345,13 | R$ 1.908.333,33 | R$ 2.058.789,40 | R$ 150.456,07 |
| P. Goianésia | R$ 2.280.862,07 | R$ 1.875.000,00 | R$ 1.958.267,82 | R$ 83.267,82 |
| P. Goiás | R$ 2.677.633,67 | R$ 1.983.333,33 | R$ 2.093.186,93 | R$ 109.853,60 |
| P. Posse | R$ 3.069.301,80 | R$ 2.341.666,67 | R$ 2.627.874,89 | R$ 286.208,22 |
| P. Quirinópolis | R$ 2.327.041,25 | R$ 1.933.333,33 | R$ 2.088.387,67 | R$ 155.054,34 |
| P. SLMB | R$ 1.966.844,75 | R$ 1.791.666,67 | R$ 1.860.858,34 | R$ 69.191,67 |
| **Total** | **R$ 14.723.028,67** | **R$ 11.833.333,33** | **R$ 12.687.365,05** | **R$ 854.031,72** |

Os valores foram transcritos das imagens desta solicitação. A planilha `unidades ampliadas.xlsx`, disponível nos anexos do ambiente, trata da pauta anterior e não é a fonte deste comparativo.

## Importar no Netlify

1. No Netlify, importe o repositório `RafaelHirt/reuniaoeconomia` do GitHub.
2. Selecione a branch `main` e mantenha o diretório base na raiz.
3. Use **Build command:** `npm run build` e **Publish directory:** `dist`.
4. Publique. `netlify.toml` já registra esses parâmetros, a versão do Node e os cabeçalhos HTTP.

Não são necessárias variáveis de ambiente para o site. O Netlify publica os arquivos de `dist/` após o build da branch configurada.

Edite os textos e valores em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.

As logos oficiais transparentes são servidas localmente em `assets/logo-ses-clara.png` e `assets/logo-ses-escura.png`. Fonte: [Sala de Imprensa da SES-GO](https://goias.gov.br/saude/sala-de-imprensa/), arquivo [Bloco_Logo SES.zip](https://goias.gov.br/saude/wp-content/uploads/sites/34/sala-de-imprensa/Bloco_Logo%20SES.zip).
