# Reunião SES-GO / Economia

Apresentação web por tópicos, preparada para importar no Netlify a partir deste repositório. Site estático, sem dependências externas ou credenciais.

## Desenvolvimento

Use Node.js 24 (ou versão >= 20).

```sh
npm run dev
```

Servidor na porta 5173. Navegue pelo menu, pelas setas da tela ou pelas teclas ← / →. Home e End levam à primeira e à última tela. O botão **Imprimir / PDF** inclui as sete telas; **Tela cheia** ativa o modo de apresentação quando suportado pelo navegador.

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
- PC de Posse: subprogramação em 2027.
- PC SLMB: custeio da hemodiálise e referência SUS.
- PC SLMB: implantação de serviços.
- HEF: produção, repasses e reajuste.
- Aditivos na Economia: PC SLMB e Rede HEMO.
- Primeira manifestação da Economia após SEAD: CRESM (53 dias), PC de Goianésia (44), HUGOL (28) e HEF (27).

Os valores, prazos e referências SEI foram fornecidos para a reunião, sem consulta independente aos documentos. Não foi presumido status detalhado para a Rede HEMO, ano da assinatura de 29/9 ou critério de contagem dos dias. Valores de comparação (3,4 vezes e meta de 410 exames) foram calculados a partir dos números fornecidos.

A identidade visual usa verde, amarelo e uma assinatura textual inspirada em Goiás / SES-GO. O símbolo decorativo não é o logotipo oficial; substituir pela marca oficial quando o arquivo autorizado estiver disponível.

Edite o texto em `index.html`, os estilos em `styles.css` e a navegação em `app.js`.
