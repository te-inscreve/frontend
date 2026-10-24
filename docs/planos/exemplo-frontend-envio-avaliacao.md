# Exemplo de ficha e envio de avaliação para o frontend

**Enunciado.** Um avaliador vai avaliar a inscrição `42` da categoria `8`, modalidade `3`, evento `12`. A ficha atribuída (`80`) tem dois campos gerais e um agrupamento chamado “Danças”, com três campos e `quantidade: 2`. O frontend mostra os dois campos gerais e duas ocorrências de “Danças”; o avaliador preenche as respostas e envia tudo uma única vez. IDs e valores são fictícios; o envio de avaliações ainda não está implementado.

O GET da ficha já existe, mas sua permissão de leitura ainda precisa ser ampliada para avaliadores autenticados sem entidade vinculada.

## 1. GET da ficha para montar o formulário

`GET /api/v1/eventos/12/modalidades/3/categorias/8/ficha-avaliativa/` → `200 OK`

```json
{
  "id": 80,
  "codigoFamilia": "2cfb95d4-7c58-4f8c-a834-73a791e1980e",
  "versao": 1,
  "nome": "Ficha de danças",
  "original": true,
  "global": false,
  "editavel": false,
  "ultimaVersao": true,
  "camposGerais": [
    {
      "id": 201,
      "ordem": 1,
      "campo": {
        "id": 12,
        "global": true,
        "nome": "Pontuação geral",
        "descricao": "Acréscimo geral à nota",
        "tipo": "NUMERICO",
        "obrigatorio": true,
        "valorMaximo": "10.0000",
        "modificadorNota": "SOMA"
      }
    },
    {
      "id": 202,
      "ordem": 2,
      "campo": {
        "id": 701,
        "global": false,
        "nome": "Observação geral",
        "descricao": "Comentários sobre a apresentação",
        "tipo": "OBSERVACAO",
        "obrigatorio": false
      }
    }
  ],
  "agrupamentos": [
    {
      "id": 301,
      "nome": "Danças",
      "quantidade": 2,
      "ordem": 3,
      "campos": [
        {
          "id": 401,
          "ordem": 1,
          "campo": {
            "id": 702,
            "global": false,
            "nome": "Harmonia",
            "descricao": "Pontuação da dança",
            "tipo": "NUMERICO",
            "obrigatorio": true,
            "valorMaximo": "10.0000",
            "modificadorNota": "SOMA"
          }
        },
        {
          "id": 402,
          "ordem": 2,
          "campo": {
            "id": 703,
            "global": false,
            "nome": "Desconto técnico",
            "descricao": "Pontos a descontar nesta dança",
            "tipo": "NUMERICO",
            "obrigatorio": false,
            "valorMaximo": "10.0000",
            "modificadorNota": "DESCONTA"
          }
        },
        {
          "id": 403,
          "ordem": 3,
          "campo": {
            "id": 704,
            "global": false,
            "nome": "Destaques",
            "descricao": "Aspectos observados na dança",
            "tipo": "ALTERNATIVA_MULTIPLA",
            "obrigatorio": false,
            "alternativas": [
              { "id": 801, "nome": "Figurino", "ordem": 1 },
              { "id": 802, "nome": "Coreografia", "ordem": 2 }
            ]
          }
        }
      ]
    }
  ],
  "versoes": [{ "id": 80, "versao": 1 }]
}
```

O `id` de cada item em `camposGerais` ou `agrupamentos[].campos` identifica **o campo naquela composição**; o `campo.id` identifica a definição do campo. No envio, propõe-se o nome `campoFichaId` para o primeiro ID: `201`, `202`, `401`, `402` ou `403`. Assim o frontend copia o `id` do item, sem precisar de outra consulta. O agrupamento `301` informa que seus três campos devem aparecer em duas ocorrências.

## 2. POST das respostas

`POST /api/v1/eventos/12/modalidades/3/categorias/8/inscricoes/42/avaliacoes/`

```json
{
  "modeloFichaAvaliativaId": 80,
  "respostasGerais": [
    { "campoFichaId": 201, "valorNumerico": "1.0000" },
    { "campoFichaId": 202, "valorTexto": "Boa apresentação." }
  ],
  "agrupamentos": [
    {
      "agrupamentoId": 301,
      "ordem": 1,
      "nome": "Primeira dança",
      "respostas": [
        { "campoFichaId": 401, "valorNumerico": "8.0000" },
        { "campoFichaId": 402, "valorNumerico": "0.0000" },
        { "campoFichaId": 403, "alternativaIds": [801, 802] }
      ]
    },
    {
      "agrupamentoId": 301,
      "ordem": 2,
      "nome": "Segunda dança",
      "respostas": [
        { "campoFichaId": 401, "valorNumerico": "9.0000" },
        { "campoFichaId": 402, "valorNumerico": "1.0000" },
        { "campoFichaId": 403, "alternativaIds": [801] }
      ]
    }
  ]
}
```

Cada resposta leva um conteúdo só, conforme o tipo do campo: `valorNumerico` (decimal em string com até 4 casas), `valorTexto`, `alternativaId` na alternativa única ou `alternativaIds` na múltipla — `{ "campoFichaId": 404, "alternativaId": 801 }` numa única; o backend recusa `alternativaIds` nela. Os três campos do agrupamento aparecem nas duas danças. O mesmo `campoFichaId` é reutilizado porque a posição de cada campo na ficha é a mesma; `agrupamentoId` e `ordem` distinguem as ocorrências. O desconto `0.0000` da primeira dança foi enviado explicitamente. As unidades concretas e as respostas só são criadas no envio, junto com a avaliação, em uma transação: uma falha de validação não grava parte do payload. Um envio válido retorna `201 Created`; neste exemplo a nota individual seria `(((8 − 0) + (9 − 1)) / 2) + 1 = "9.0000"`. A representação completa do `201` e do detalhe ainda será fechada. `modeloFichaAvaliativaId` foi incluído para indicar a versão exibida ao avaliador; a decisão sobre torná-lo obrigatório e o erro para uma versão desatualizada segue em aberto.
