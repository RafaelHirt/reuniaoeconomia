# Reunião SES-GO / Economia

Apresentação web sobre o custeio mensal de seis policlínicas, preparada para importar no Netlify. Site estático, sem dependências externas ou credenciais.

## Desenvolvimento

Use Node.js 24 (ou versão >= 20).

```sh
npm run dev
```

Servidor na porta 5173. A apresentação tem três telas: abertura, comparativo mensal e encerramento. A capa preserva a identidade visual Saúde & Economia, com verde, amarelo e a logo oficial da SES-GO.

Navegue pelo menu, pelas setas da tela ou pelas teclas ← / →. Home e End levam à primeira e à última tela. O histórico do navegador preserva a navegação. No computador, a abertura usa modo apresentação, com uma tela por vez ajustada à janela. **Pautas** abre o menu; **Modo leitura** restaura a navegação lateral e os textos no tamanho normal. **Esc** fecha o menu ou volta ao modo leitura. No celular, a abertura usa modo leitura e a tabela permite rolagem horizontal, mantendo a coluna da unidade visível. Quando o foco está na tabela, as setas permitem percorrê-la sem mudar de tela. Nos seletores de comparação, as teclas alteram o valor selecionado sem navegar entre telas.

**Imprimir / PDF** inclui as três telas em A4 paisagem, com a tabela completa e a comparação selecionada na página central. Os seletores não aparecem na impressão; a fórmula e os resultados aparecem. **Tela cheia** ativa o modo de apresentação quando suportado pelo navegador.

```sh
npm run build
npm run preview
```

O build gera `dist/` com os arquivos estáticos. Os scripts usam módulos nativos do Node.js e não exigem instalação de pacotes.

## Conteúdo

O comparativo reproduz os valores das imagens fornecidas para Formosa, Goianésia, Goiás, Posse, Quirinópolis e SLMB. As colunas são Unidade, Custeio Mensal Atual, Custeio Mensal LOA 2027, Custeio mensal no aditivo — 1ª fase e Diferença mensal.

A comparação inicial é **Custeio Mensal Atual menos Custeio Mensal LOA 2027**. Os seletores **Primeiro valor** e **Subtrair** permitem escolher entre custeio atual, LOA 2027 e aditivo. **Inverter ordem** troca os dois valores. A última coluna, seu cabeçalho, a fórmula e o total são atualizados juntos, com cálculo em centavos inteiros a partir dos valores exibidos na tabela.

A fórmula sempre indica a ordem da subtração. Valores negativos são preservados: aditivo − LOA 2027 totaliza R$ 854.031,72; LOA 2027 − aditivo totaliza −R$ 854.031,72. Todos os valores são mensais, em reais, sem anualização. A seleção é mantida ao navegar entre telas e volta a atual − LOA 2027 ao recarregar. Sem JavaScript, a tabela continua exibindo a comparação inicial.

| Unidade | Custeio Mensal Atual | Custeio Mensal LOA 2027 | Aditivo — 1ª fase | Diferença mensal (Atual − LOA 2027) |
| --- | ---: | ---: | ---: | ---: |
| P. Formosa | R$ 2.401.345,13 | R$ 1.908.333,33 | R$ 2.058.789,40 | R$ 493.011,80 |
| P. Goianésia | R$ 2.280.862,07 | R$ 1.875.000,00 | R$ 1.958.267,82 | R$ 405.862,07 |
| P. Goiás | R$ 2.677.633,67 | R$ 1.983.333,33 | R$ 2.093.186,93 | R$ 694.300,34 |
| P. Posse | R$ 3.069.301,80 | R$ 2.341.666,67 | R$ 2.627.874,89 | R$ 727.635,13 |
| P. Quirinópolis | R$ 2.327.041,25 | R$ 1.933.333,33 | R$ 2.088.387,67 | R$ 393.707,92 |
| P. SLMB | R$ 1.966.844,75 | R$ 1.791.666,67 | R$ 1.860.858,34 | R$ 175.178,08 |
| **Total** | **R$ 14.723.028,67** | **R$ 11.833.333,33** | **R$ 12.687.365,05** | **R$ 2.889.695,34** |

Os valores foram transcritos das imagens desta solicitação. A planilha `unidades ampliadas.xlsx`, disponível nos anexos do ambiente, trata da pauta anterior e não é a fonte deste comparativo.

## Importar no Netlify

1. No Netlify, importe o repositório `RafaelHirt/reuniaoeconomia` do GitHub.
2. Selecione a branch `main` e mantenha o diretório base na raiz.
3. Use **Build command:** `npm run build` e **Publish directory:** `dist`.
4. Publique. `netlify.toml` já registra esses parâmetros, a versão do Node e os cabeçalhos HTTP.

Não são necessárias variáveis de ambiente para o site. O Netlify publica os arquivos de `dist/` após o build da branch configurada.

Edite os textos e valores em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.

As logos oficiais transparentes são servidas localmente em `assets/logo-ses-clara.png` e `assets/logo-ses-escura.png`. Fonte: [Sala de Imprensa da SES-GO](https://goias.gov.br/saude/sala-de-imprensa/), arquivo [Bloco_Logo SES.zip](https://goias.gov.br/saude/wp-content/uploads/sites/34/sala-de-imprensa/Bloco_Logo%20SES.zip).
