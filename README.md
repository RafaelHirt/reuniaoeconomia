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
- Pauta II — Aditivos em tramitação na Economia: Rede HEMO (SEI nº 202600010051458, manifestação SEAD com check) e PC SLMB (despacho técnico de 29/09/2026, pendente GAB/Economia).
- Pauta III — Prazo de análises: datas de envio do ofício, manifestação SEAD, área técnica Economia, diligências e manifestação Economia. Intervalos em dias corridos, sem contar o dia inicial. Ordenação pelo intervalo SEAD → área técnica: CRESM 53, PC de Goianésia 44, HUGOL 28 e HEF 28 dias.
- Totais entre envio e última manifestação informada: CRESM 69 (até área técnica em 02/06/2026; sem data de manifestação Economia), Goianésia 60, HUGOL 73 e HEF 78 dias. Os totais incluem o intervalo anterior à SEAD e não são tempo de trabalho exclusivo da Economia.
- Encerramento: Obrigado, com a logo oficial clara sobre verde.

Os valores, prazos e referências SEI foram fornecidos para a reunião, sem consulta independente aos documentos. A data de 29/09/2026 e a manifestação da Rede HEMO foram informadas pelo usuário. Os textos das condicionantes são reproduzidos a partir do conteúdo fornecido, em itálico e entre aspas, com os números SEI em etiquetas separadas, sem repetir o nome da unidade.

A identidade visual usa verde, amarelo e a logo oficial SUS / SES / Estado de Goiás, com variantes oficiais transparentes em `assets/logo-ses-clara.png` e `assets/logo-ses-escura.png`. Fonte: [Sala de Imprensa da SES-GO](https://goias.gov.br/saude/sala-de-imprensa/), arquivo [Bloco_Logo SES.zip](https://goias.gov.br/saude/wp-content/uploads/sites/34/sala-de-imprensa/Bloco_Logo%20SES.zip). A logo é servida localmente, sem depender de acesso ao portal durante o uso da apresentação.

Edite o texto em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.
