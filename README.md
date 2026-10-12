# Reunião SES-GO / Economia

Apresentação web por tópicos, preparada para importar no Netlify a partir deste repositório. Site estático, sem dependências externas ou credenciais.

## Desenvolvimento

Use Node.js 24 (ou versão >= 20).

```sh
npm run dev
```

Servidor na porta 5173. Navegue pelo menu, pelas setas da tela ou pelas teclas ← / →. Home e End levam à primeira e à última tela. As setas do navegador preservam o histórico de telas; a troca de unidade volta ao início do texto e mantém o item selecionado visível no menu do celular. O botão **Imprimir / PDF** inclui as sete telas; **Tela cheia** ativa o modo de apresentação quando suportado pelo navegador.

```sh
npm run build
npm run preview
```

No computador, a apresentação abre em **modo apresentação**, com uma tela por vez ajustada à janela. O botão **Pautas** abre o menu, **Modo leitura** restaura a navegação lateral e o tamanho normal dos textos, e **Esc** fecha o menu ou volta ao modo leitura. O rodapé oferece acesso direto às pautas I, II e III. O menu de pautas fecha pelo botão, pelo fundo ou por Esc e mantém o foco de teclado dentro do menu enquanto aberto. No modo apresentação, os dois trechos SLMB ficam lado a lado; no modo leitura, no celular e no PDF, são sequenciais. O modo apresentação funciona também sem tela cheia. No celular, a abertura padrão usa modo leitura para manter o texto legível; o botão Apresentar também está disponível.

O cronômetro exibe o tempo acumulado da página atual, da pauta e da reunião. **Iniciar** começa a contagem; **Pausar** congela todas as contagens e **Retomar** continua. **Iniciar apresentação** também inicia o cronômetro. A troca de página atribui o tempo à página visível, e revisitas acumulam o tempo anterior. **Resumo** mostra todas as páginas e pautas; **Zerar** limpa tudo e pausa. A abertura e o encerramento têm contagens próprias e entram no total da reunião. O estado é guardado apenas na sessão da aba, inclusive após recarregar; não há envio de dados. Enquanto em andamento, conta também o tempo com a aba em segundo plano. Os controles e tempos não aparecem no PDF.

O build gera `dist/`. Não há instalação de pacotes: todos os scripts usam módulos nativos do Node.js.

## Importar no Netlify

1. No Netlify, importe o repositório `RafaelHirt/reuniaoeconomia` do GitHub.
2. Selecione a branch `main` e mantenha o diretório base na raiz.
3. Use **Build command:** `npm run build` e **Publish directory:** `dist`.
4. Publique. O arquivo `netlify.toml` já registra esses parâmetros, a versão do Node e os cabeçalhos HTTP.

Não são necessárias variáveis de ambiente. A publicação no Netlify será feita pelo proprietário do site.

## Conteúdo

- Abertura e pauta.
- Pauta I — Condicionantes: textos fornecidos do Despacho da Economia, agrupados por PC Posse, PC SLMB e HEF, sem gráficos ou análises adicionais. Em PC Posse, as tabelas ficam abaixo da citação e reproduzem os três grupos, sete unidades e total da planilha fornecida: unidades implantadas (CORA e HEAL), com incremento de serviços/leitos (HETRIN, HEANA, HEF e HUGOL) e com previsão de ampliação em 2027 (HUGO). A nota do HEF informa que o valor de R$ 8.293.792,74 será aplicado após a assinatura do Termo Aditivo. Os cabeçalhos indicam diferença mensal e diferença no exercício. Em PC Posse, a citação e as três tabelas ficam sempre visíveis em sequência, inclusive no modo apresentação. A página usa rolagem normal da janela, com os controles de tempo e navegação acessíveis, sem uma caixa de rolagem vertical dentro do conteúdo. Em PC Posse, Page Up/Down, Home e End percorrem a página; ← e → continuam mudando de tela. O total exibido abrange os três grupos. No celular, as tabelas mantêm suas colunas com rolagem horizontal.
- Pauta II — Aditivos em tramitação na Economia: Rede HEMO (SEI nº 202600010051458, manifestação SEAD com check) e PC SLMB (despacho técnico de 29/09/2026, pendente GAB/Economia).
- Pauta III — Prazo de análises: datas de envio do ofício, manifestação SEAD, área técnica Economia, diligências e manifestação Economia. Intervalos em dias corridos, sem contar o dia inicial. Ordenação pelo total de dias na Economia, do maior para o menor: CRESM 53, HEF 48, HUGOL 39 e PC de Goianésia 28 dias. Os intervalos SEAD → área técnica são 53, 28, 28 e 17 dias, respectivamente.
- Total de dias na Economia, conforme os intervalos definidos para a reunião: (SEAD → área técnica) + (ofício de diligências → manifestação Economia). CRESM 53 + 0 = 53, Goianésia 17 + 11 = 28, HUGOL 28 + 11 = 39 e HEF 28 + 20 = 48 dias. No CRESM não houve diligências nem manifestação posterior da Economia. O tempo anterior à SEAD e o intervalo entre área técnica e ofício de diligências não compõem essa soma.
- HUGOL aparece primeiro na tabela de incremento de serviços/leitos. Incremento do HUGOL: previsão da UTI Neurológica e incremento de cirurgias. Valor anterior R$ 32.953.708,89; atual R$ 37.226.577,07; diferença mensal R$ 4.272.868,18 e diferença no exercício R$ 51.274.418,16 (12 meses). O total dos três grupos passa a R$ 384.319.230,12.
- Encerramento: Obrigado, com a logo oficial clara sobre verde.

Os valores, prazos e referências SEI foram fornecidos para a reunião, sem consulta independente aos documentos. A data de 29/09/2026 e a manifestação da Rede HEMO foram informadas pelo usuário. Os textos das condicionantes são reproduzidos a partir do conteúdo fornecido, em itálico e entre aspas, com os números SEI em etiquetas separadas, sem repetir o nome da unidade.

A identidade visual usa verde, amarelo e a logo oficial SUS / SES / Estado de Goiás, com variantes oficiais transparentes em `assets/logo-ses-clara.png` e `assets/logo-ses-escura.png`. Fonte: [Sala de Imprensa da SES-GO](https://goias.gov.br/saude/sala-de-imprensa/), arquivo [Bloco_Logo SES.zip](https://goias.gov.br/saude/wp-content/uploads/sites/34/sala-de-imprensa/Bloco_Logo%20SES.zip). A logo é servida localmente, sem depender de acesso ao portal durante o uso da apresentação.

Edite o texto em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.
