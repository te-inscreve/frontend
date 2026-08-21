export const detalheEvento = {
    modalidades: [
        {
            id: 1,
            nome: "Danças Tradicionais",
            descricao:
                "Modalidade que abrange as danças tradicionais do Rio Grande do Sul",
            maxPosicaoPremiada: 3,
            isGrupo: true,
            maxIncritosPorGrupo: 30,
            minIncritosPorGrupo: 2,
            maxInscricoesEntidadePorCategoria: 1,
            categorias: [
                {
                    nome: "Pré-Mirim",
                    idadeMinima: 6,
                    idadeMaxima: 10,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
                {
                    nome: "Mirim",
                    idadeMinima: 11,
                    idadeMaxima: 14,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
                {
                    nome: "Juvenil",
                    idadeMinima: 15,
                    idadeMaxima: 17,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
                {
                    nome: "Adulto",
                    idadeMinima: 18,
                    idadeMaxima: 99,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
            ],
        },
        {
            id: 2,
            nome: "Declamação e Poesia",
            descricao:
                "Modalidade que abrange a dança contemporânea, com foco em técnicas modernas e expressivas",
            maxPosicaoPremiada: 3,
            isGrupo: false,
            maxIncritosPorGrupo: 1,
            minIncritosPorGrupo: 1,
            maxInscricoesEntidadePorCategoria: 5,
            categorias: [
                {
                    nome: "Infantil",
                    idadeMinima: 6,
                    idadeMaxima: 12,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
                {
                    nome: "Juvenil",
                    idadeMinima: 13,
                    idadeMaxima: 17,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
                {
                    nome: "Adulto",
                    idadeMinima: 18,
                    idadeMaxima: 99,
                    avaliadores: null,
                    maxInscricoes: 10,
                    planilhaAberta: false,
                },
            ],
        },
    ],
};

export type DetalheEvento = typeof detalheEvento;
