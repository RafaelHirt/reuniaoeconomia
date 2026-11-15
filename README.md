# Glosas HUGO · Dashboard COMACG

O site abre diretamente no dashboard principal, com os oito processos fornecidos, valores, períodos e andamento. Identidade visual institucional com logos locais da SES-GO. Endereço informado pelo usuário: https://glosas-hugo.netlify.app. A capa anterior da reunião SUBPAS foi substituída pelo painel; a apresentação anterior continua disponível em `/reuniao-subpas/`.

## Desenvolvimento e publicação

Node.js 24 (mínimo 20). Sem dependências de execução externas.

- `npm run dev`: servidor de desenvolvimento na porta 5173; permite `PORT`.
- `npm test`: verificações dos cálculos da apresentação preservada.
- `npm run build`: gera `dist/` com o dashboard e a apresentação anterior.
- `npm run preview`: serve `dist/`.

O Netlify usa `main`, comando `npm run build` e pasta `dist`, conforme `netlify.toml`. O repositório continua sendo `RafaelHirt/reuniaoeconomia`. A ferramenta foi renomeada para **Glosas HUGO** no título, na navegação e nos metadados de compartilhamento.

## Dados e funcionamento

`data.json` contém os oito registros. Valores são centavos inteiros. Os processos `202600010056169` e `202600010089970` têm valor `null`, aparecem como “Valor não apurado” e não compõem os totais. O total apurado é **R$ 29.037.553,29**, incluindo **R$ 11.277.071,58** da glosa suspensa. O resumo exibe o total apurado e a quantidade de processos. O gráfico de situações distingue seis andamentos completos: despacho após análise da SPAIS e SUREG (2), despacho com análise de recurso hierárquico (1), aguardando despacho SPAIS (1), relatório após análise da SPAIS e SUREG (1), relatório preliminar (2) e glosa suspensa (1). As legendas mostram o texto integral, a quantidade e o percentual do recorte, e filtram a lista por clique. Situações sem processos no recorte não são exibidas. As situações são reproduzidas dos dados fornecidos, sem inferências a partir da data atual.

Busca, ano do período e situação atualizam os indicadores, gráficos e lista. O ano é o período de referência, não o prefixo do número do processo. A lista pode ser ordenada por processo, período, valor ou situação, em ambos os sentidos, pelo seletor ou pelos cabeçalhos da tabela. Valores não apurados permanecem ao final da ordenação por valor. Filtros e ordenação ficam preservados na URL. CSV exporta o recorte na ordem escolhida; valores ausentes aparecem como “Valor não apurado”, também nos detalhes e na impressão. A impressão inclui o resumo e a lista filtrada. As setas abrem os detalhes de cada processo.

## Acesso ao SEI interno

Os números são links para o SEI interno de Goiás, aberto em nova aba. O clique também copia o número para a pesquisa rápida, quando o navegador permite acesso à área de transferência. O botão “Abrir SEI interno” aparece nos detalhes.

Os dados recebidos contêm números de processos, sem URLs individuais ou IDs internos do SEI. Assim, os links abrem `https://sei.go.gov.br/sei/`; não são apresentados como links diretos aos autos. Para abrir um processo específico, adicionar a URL real de acesso ao campo opcional `seiUrl` de cada registro de `data.json`. Não inferir `id_procedimento` a partir do número do processo. O login e as permissões são controlados pelo SEI.

A base é estática. Para atualizar dados ou links, editar `data.json` e publicar uma nova versão. Fonte dos dados: informações fornecidas pelo usuário.

O botão **Voltar à visão geral**, junto aos gráficos quando há filtros, restaura todos os processos e preserva a ordenação escolhida. Nos detalhes, **Voltar ao painel** fecha a janela e mantém a seleção. Situações com um processo e o cartão da glosa suspensa mostram o número SEI com acesso ao sistema. A caixa de informações das colunas também inclui **Abrir SEI interno**, acessível com mouse ou teclado. Esses acessos abrem outra aba e copiam o número para pesquisa, respeitando URLs individuais quando cadastradas.


## Fluxo de monitoramento e decisão

Os detalhes de cada processo incluem uma linha de oito etapas: relatório preliminar; manifestação da Parceria Privada; manifestação SPAIS; manifestação SUREG; relatório conclusivo; recurso da Parceria Privada; manifestação da GMAE/CG; decisão Gabinete. Selecionar uma etapa exibe sua explicação, sem alterar o andamento nem a fase registrada.

A fase é definida por **processo** em `data.json`, no campo inteiro `workflowStep` (1 a 8). Não é inferida pelo texto do status: dois processos com o mesmo andamento podem estar em fases diferentes. Se o campo estiver ausente ou inválido, o painel mostra “Etapa não indicada”. Ao atualizar a fase, manter o andamento e o número SEI do período correspondente.

Fases fornecidas pelo usuário:

| Período | Processo | Fase |
| --- | --- | ---: |
| Ago–dez/2024 | 202500010000059 | 8 |
| Jan–mar/2025 | 202500010036854 | 7 |
| Abr–jun/2025 | 202500010057071 | 7 |
| Jul–set/2025 | 202500010086387 | 3 |
| Out–dez/2025 | 202600010009060 | 5 |
| Jan–mar/2026 | 202600010045963 | 5 |
| Abr–jun/2026 | 202600010056169 | 1 |
| Jul–set/2026 | 202600010089970 | 1 |

As cores distinguem etapas anteriores na sequência, fase atual e etapas seguintes. Não são um histórico de datas ou uma comprovação independente da conclusão de cada etapa. A glosa suspensa fica na fase 8, conforme a informação do usuário, com a suspensão destacada em âmbar; não aparece como processo concluído.

A janela amplia o fluxo no computador e apresenta as etapas na vertical em telas menores. No celular, a explicação aparece junto à etapa selecionada. Voltar e Abrir SEI permanecem disponíveis durante a leitura. A fase atual também aparece na caixa do gráfico de valores. Um botão de retorno com destaque aparece ao lado de Imprimir quando há filtros ativos e restaura a visão geral preservando a ordenação.


## Pipeline na visão geral

A seção **Processos por fase atual** mostra as oito fases e suas quantidades, inclusive fases sem processos. As contagens usam a fase atual de cada registro, sem acumular processos nas etapas anteriores. A visão geral apresenta as fases da **8 à 1**, da esquerda para a direita. Nessa ordem, a distribuição inicial é **1 / 2 / 0 / 2 / 0 / 1 / 0 / 2**, com títulos e quantidades maiores e contraste reforçado.

Os cartões das fases **8, 5 e 1** também informam a soma dos valores apurados da fase. Os demais cartões exibem a quantidade de processos, sem informação de valor. Ao selecionar uma fase, o total aparece acima da lista. Valores ausentes não entram na soma: uma fase apenas com valores ausentes mostra **Valor não apurado**, e uma fase com valores apurados e ausentes mostra **Total parcial**, com a quantidade ainda não apurada. Fases vazias mostram R$ 0,00. A soma da fase 8 inclui a glosa suspensa.

Clicar em uma fase revela, no próprio painel, os períodos, números SEI, valores e andamentos dos processos correspondentes. O botão **Ver mais detalhes** tem fundo verde e área de toque ampliada para destacar o acesso ao fluxo de cada processo. Os indicadores, gráficos, tabela e CSV acompanham a seleção. As quantidades de todas as fases e os totais dos cartões 8, 5 e 1 continuam visíveis para facilitar a troca de fase. Ano, situação e busca delimitam a base usada nas contagens e somas. A seleção fica na URL como `fase=1` a `fase=8`.

**Voltar às fases** remove apenas a seleção de fase e preserva os demais filtros e a ordenação. **Voltar à visão geral** restaura todos os processos. Os detalhes passam a abrir com uma faixa **Você está aqui**, número grande da fase e próxima etapa; a fase também aparece no cabeçalho fixo e em destaque na linha do tempo. A glosa suspensa mantém sua sinalização em âmbar.
