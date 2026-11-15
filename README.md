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

`data.json` contém os oito registros. Valores são centavos inteiros. Os processos `202600010056169` e `202600010089970` têm valor `null`, aparecem como “Não informado” e não compõem os totais. O total informado é **R$ 29.037.553,29**, incluindo **R$ 11.277.071,58** da glosa suspensa. Os seis processos em elaboração são três despachos e três relatórios, sendo dois relatórios preliminares. As situações são reproduzidas dos dados fornecidos, sem inferências a partir da data atual.

Busca, ano do período e situação atualizam os indicadores, gráficos e lista. O ano é o período de referência, não o prefixo do número do processo. CSV exporta o recorte atual; ausências permanecem explícitas. A impressão inclui o resumo e a lista filtrada. As setas abrem os detalhes de cada processo.

## Acesso ao SEI interno

Os números são links para o SEI interno de Goiás, aberto em nova aba. O clique também copia o número para a pesquisa rápida, quando o navegador permite acesso à área de transferência. O botão “Abrir SEI interno” aparece nos detalhes.

Os dados recebidos contêm números de processos, sem URLs individuais ou IDs internos do SEI. Assim, os links abrem `https://sei.go.gov.br/sei/`; não são apresentados como links diretos aos autos. Para abrir um processo específico, adicionar a URL real de acesso ao campo opcional `seiUrl` de cada registro de `data.json`. Não inferir `id_procedimento` a partir do número do processo. O login e as permissões são controlados pelo SEI.

A base é estática. Para atualizar dados ou links, editar `data.json` e publicar uma nova versão. Fonte dos dados: informações fornecidas pelo usuário.
