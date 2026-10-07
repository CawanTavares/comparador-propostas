# Comparador de Propostas 2026

Uma ferramenta web, neutra e informativa, para comparar propostas de candidatos com base nos temas escolhidos pelo próprio usuário.

Acesse o projeto publicado:

https://cawantavares.github.io/candidatos-2026/

## Sobre o Projeto

O Comparador de Propostas 2026 organiza informações de programas de governo em uma interface simples, permitindo que o usuário:

- escolha um candidato como ponto de partida;
- selecione os temas que considera mais importantes;
- visualize comparações entre candidatos;
- consulte propostas por tema;
- acesse as fontes utilizadas;
- entenda o nível de convergência entre propostas.

A ferramenta não recomenda voto, não ranqueia candidatos por preferência política e não substitui a leitura completa dos documentos oficiais. Ela apenas estrutura as informações para facilitar a análise.

## Como Funciona

O usuário seleciona:

1. Um candidato inicial;
2. Até cinco prioridades;
3. Uma comparação com outros candidatos.

A partir disso, o sistema apresenta uma análise organizada por tema, indicando se há:

- alta convergência;
- convergência parcial;
- divergência;
- ausência de proposta equivalente;
- convergência incerta.

## Tecnologias Utilizadas

Este projeto foi desenvolvido como uma aplicação estática, utilizando:

- HTML
- CSS
- JavaScript Vanilla
- JSON para organização dos dados
- GitHub Pages para publicação

## Estrutura do Projeto

```txt
candidatos-2026/
  index.html
  style.css
  script.js
  tests.html
  data/
    candidatos.json
    categorias.json
    propostas.json
    comparacoes.json
    dados.js
  tools/
    validate.js
