# Reunião SES-GO / Economia — cenários 2027

Apresentação web estática com abertura, Cenário I, Cenário II, Comparativo e simulação, HEAL e encerramento. A identidade visual da capa e as logos oficiais da SES-GO são preservadas. Não há cronômetro nem dependências externas.

## Desenvolvimento e publicação

Use Node.js 24 ou >= 20.

```sh
npm run dev
```

Servidor na porta 5173. Navegue pelo menu, pelas setas ou pelo teclado. No computador, a apresentação abre com uma tela ajustada à janela. **Modo leitura** permite consultar o conteúdo com rolagem normal; no celular, ele é o padrão. **Pautas** abre o menu no modo apresentação. **Esc** fecha o menu ou retorna ao modo leitura. O histórico do navegador preserva a navegação. Ao voltar ao Comparativo, a distribuição escolhida permanece; ao recarregar, a simulação volta a 6 / 6 / 0.

Nos campos de meses e nas tabelas com rolagem horizontal, as teclas não trocam de tela. **Imprimir / PDF** inclui as seis telas em A4 paisagem, com os valores da simulação selecionada; os campos e botões ficam fora do PDF. Se a distribuição de meses estiver inválida, a página da simulação informa que o cálculo não foi realizado, sem imprimir resultados antigos. **Tela cheia** continua disponível quando o navegador permite.

```sh
npm test
npm run build
npm run preview
```

O build copia `index.html`, `styles.css`, `app.js`, `budget.js` e as logos para `dist/`. No Netlify, use a branch `main`, build `npm run build` e diretório de publicação `dist`. O arquivo `netlify.toml` registra esses parâmetros e os cabeçalhos HTTP. Em um projeto já conectado ao GitHub, **Deploys → Trigger deploy → Deploy site** publica a versão mais recente.

## Base e método de cálculo

Os valores mensais e as quantidades de DP foram transcritos da imagem fornecida nesta solicitação. A coluna C, intitulada LOA 2027 na imagem, é usada como referência da PLOA solicitada para os cenários. `budget.js` é a fonte dos valores e dos cálculos; todos os custos são calculados em centavos inteiros.

- PLOA anual de cada unidade = valor mensal informado × 12.
- Custeio necessário anual = soma do custeio mensal de cada fase × quantidade de meses naquela fase.
- Diferença anual = custeio necessário − PLOA anual.
- Percentual de acréscimo = diferença anual ÷ PLOA anual.

Não são aplicados reajustes ou valores de investimento adicionais. As fases seguem a ordem I → II → III, começando em janeiro de 2027. A referência anual resulta em **R$ 141.999.999,96**, pois preserva os centavos dos valores mensais fornecidos, sem arredondar para R$ 142 milhões.

| Unidade | PLOA mensal | Fase I mensal | Fase II mensal | Fase III mensal | DP I | DP II | DP III |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| P. Formosa | R$ 1.908.333,33 | R$ 2.058.789,40 | R$ 2.169.724,00 | R$ 2.295.347,84 | 16 | 26 | 30 |
| P. Goianésia | R$ 1.875.000,00 | R$ 1.958.267,82 | R$ 2.069.202,42 | R$ 2.261.387,02 | 16 | 26 | 36 |
| P. Goiás | R$ 1.983.333,33 | R$ 2.093.186,93 | R$ 2.204.121,53 | R$ 2.396.306,13 | 10 | 20 | 30 |
| P. Posse | R$ 2.341.666,67 | R$ 2.627.874,89 | R$ 2.738.809,49 | R$ 2.864.433,33 | 16 | 26 | 30 |
| P. Quirinópolis | R$ 1.933.333,33 | R$ 2.088.387,67 | R$ 2.199.322,27 | R$ 2.324.946,11 | 16 | 26 | 30 |
| P. SLMB | R$ 1.791.666,67 | R$ 1.860.858,34 | R$ 1.971.792,94 | R$ 2.163.977,54 | 10 | 20 | 30 |
| **Total** | **R$ 11.833.333,33** | **R$ 12.687.365,05** | **R$ 13.352.972,65** | **R$ 14.306.397,97** | **84** | **144** | **186** |

DP é apresentada conforme a sigla da planilha, sem atribuir uma expansão não informada. Os quadros de ambos os cenários mostram as três fases e destacam quais têm meses previstos. A quantidade de DP de cada fase não é multiplicada pelos meses, nem somada às demais fases para criar um total anual. A coluna de hemodiálise da imagem não é usada como valor financeiro adicional.

## Cenários e simulação

| Cenário | Distribuição em 2027 | Necessário anual | Diferença para a PLOA | Acréscimo |
| --- | --- | ---: | ---: | ---: |
| I | Fase I de jan. a dez. | R$ 152.248.380,60 | R$ 10.248.380,64 | 7,22% |
| II | I: jan.–mar.; II: abr.–jun.; III: jul.–dez. | R$ 163.959.400,92 | R$ 21.959.400,96 | 15,46% |
| Simulação inicial | I: jan.–jun.; II: jul.–dez. | R$ 156.242.026,20 | R$ 14.242.026,24 | 10,03% |

A aba Comparativo permite editar os meses das três fases e escolher as distribuições prontas 12 / 0 / 0, 3 / 3 / 6 e 6 / 6 / 0. Cada campo aceita inteiros de 0 a 12 e a soma deve ser exatamente 12. Campos vazios, fracionados, negativos, maiores que 12 ou uma soma diferente de 12 impedem a exibição de resultados. A tabela compara os dois cenários fixos com a simulação; o cronograma, os custos por unidade, a diferença e os cabeçalhos do quadro de DP acompanham os meses escolhidos.

## HEAL

A aba HEAL usa valores mensais e fica separada dos totais das seis policlínicas.

| Indicador | Valor mensal |
| --- | ---: |
| PLOA | R$ 8.158.333,33 |
| Custeio atual | R$ 9.308.858,76 |
| Diferença: atual − PLOA | **R$ 1.150.525,43** |

A diferença equivale a 14,10% acima da PLOA mensal. O gráfico compara os dois valores na mesma escala.

Edite dados e cálculos em `budget.js`, textos e navegação em `index.html` / `app.js` e a aparência em `styles.css`. As logos oficiais locais vêm da [Sala de Imprensa da SES-GO](https://goias.gov.br/saude/sala-de-imprensa/).
