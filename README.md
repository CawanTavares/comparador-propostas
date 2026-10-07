# Comparador de Propostas 2026

MVP estático em HTML, CSS e JavaScript vanilla para comparar propostas de candidatos a partir de prioridades escolhidas pelo usuário.

## Estrutura do projeto

```text
.
├── index.html
├── style.css
├── script.js
├── tests.html
├── data/
├── tools/
├── .github/workflows/
├── .nojekyll
├── .gitignore
├── LICENSE.md
└── package.json
```

## Como executar sem instalar nada

Abra o arquivo `index.html` com dois cliques.

Se o navegador bloquear o carregamento dos arquivos JSON locais, a aplicação ainda
funciona usando os mesmos dados de `data/dados.js`.

## Como executar com servidor estático opcional

Não é necessário instalar servidor. Se você já tiver algum servidor local
disponível, também pode abrir pela pasta do projeto. Exemplo com Node.js:


```bash
npx serve .
```

Com a extensão Live Server do VS Code:

```text
Clique com o botão direito no index.html > Open with Live Server
```

Depois acesse o endereço informado pelo servidor, por exemplo:

```text
http://127.0.0.1:8017/
```

## Dados

Os arquivos ficam em `data/`:

- `candidatos.json`
- `categorias.json`
- `propostas.json`
- `comparacoes.json`

Os dados atuais formam uma base inicial extraída dos documentos oficiais citados no briefing:

- 52 propostas catalogadas com documento, página, link e trecho original.
- 78 comparações iniciais entre propostas equivalentes ou parcialmente equivalentes.

Essa base pode ser ampliada conforme novas propostas forem catalogadas.

## Melhorias desta versão

- Comparações com leitura mais aprofundada por tema.
- Exibição de objetivo, mecanismo e localização no documento para cada proposta.
- Indicação de página nas comparações e nos detalhes.
- Ajustes responsivos para celular e tablet.
- Melhorias de acessibilidade: link para pular ao conteúdo, estados `aria-pressed`, botões com `aria-expanded`, foco visível, áreas de toque maiores e suporte a redução de movimento.
- Busca textual por proposta.
- Filtros por candidato, tema e nível de convergência.
- Visão lateral por tema, com candidatos lado a lado e carrossel pelas categorias principais.
- Indicadores de cobertura da base catalogada.
- Modo de alto contraste.

## Testes

Abra `tests.html` no navegador para executar uma bateria de testes das funções principais do app. O teste também funciona sem servidor local.

Se tiver Node.js instalado, tambem e possivel rodar a validacao tecnica usada no GitHub Actions:

```bash
npm run validate
```

## Como publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie o conteudo desta pasta para a raiz do repositorio.
3. No GitHub, acesse `Settings > Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch `main` e a pasta `/root`.
6. Salve e aguarde o GitHub gerar o link publico.

O arquivo `.nojekyll` ja esta incluido para o GitHub Pages servir os arquivos estaticos diretamente.

## Validacao automatica

O projeto inclui um workflow em `.github/workflows/validate.yml`. A cada `push` ou `pull request`, o GitHub verifica:

- sintaxe do JavaScript principal;
- sintaxe do arquivo de dados embutido;
- validade dos arquivos JSON;
- referencias entre comparacoes e propostas;
- sintaxe dos testes de `tests.html`.

## Licenca

Este pacote esta marcado como `UNLICENSED` e inclui `LICENSE.md` com todos os direitos reservados. Caso o projeto precise ser aberto para terceiros, defina uma licenca apropriada antes da publicacao.
