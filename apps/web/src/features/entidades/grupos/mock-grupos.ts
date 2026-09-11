/**
 * Os grupos de exemplo da tela de grupos.
 *
 * O backend **já expõe** o recurso — `/minha-entidade/grupos` faz listar, criar,
 * ver, editar (`PATCH`) e excluir, e `DELETE
 * /minha-entidade/grupos/{id}/integrantes/{integranteId}` desfaz um vínculo. O
 * que ainda não existe é a rota tRPC do lado do front, então a tela trabalha
 * sobre esta lista, em memória: tudo funciona como vai funcionar, mas nada
 * sobrevive a um recarregamento.
 *
 * Por isso o mock fica num módulo separado e no formato exato da API: trocar o
 * `useState` do {@link usePainelGrupos} pelas queries do tRPC é mudança de
 * origem de dados, e não reescrita dos componentes.
 *
 * Os integrantes aqui são gente inventada, e não ids dos integrantes de
 * verdade: a coluna da esquerda lista quem a API devolve, e um id sorteado
 * quase nunca seria de alguém que existe. A formação do grupo chega aninhada no
 * detalhe (é o que o `GrupoDetailSerializer` faz), então o mock guarda as
 * pessoas inteiras — incluir alguém da coluna é empurrar o integrante de
 * verdade para cá.
 */

import type { GrupoDetalhe } from "./grupo";

export const gruposMock: GrupoDetalhe[] = [
    {
        id: 1,
        nome: "Invernada Artística Adulta",
        descricao:
            "Formação que representa a entidade nas danças tradicionais adultas.",
        totalIntegrantes: 4,
        dataCriacao: "2026-02-18T13:40:12.000Z",
        pendenciaCarteiraVencida: true,
        integrantes: [
            {
                id: 9001,
                nome: "Iara",
                sobrenome: "Boeira",
                dataNascimento: "2002-01-20",
                matriculaMtg: "MTG-2012-00871",
                validade: "2027-03-31",
            },
            {
                id: 9002,
                nome: "Vicente",
                sobrenome: "Machado",
                dataNascimento: "1988-04-02",
                matriculaMtg: "MTG-2005-00330",
                validade: "2026-12-31",
            },
            {
                id: 9003,
                nome: "Marina",
                sobrenome: "Colussi",
                dataNascimento: "2007-05-30",
                matriculaMtg: "MTG-2016-01204",
                // Vencida: é esta que acende o aviso do cartão do grupo.
                validade: "2026-06-30",
            },
            {
                id: 9004,
                nome: "Tiago",
                sobrenome: "Vasconcelos",
                dataNascimento: "2005-02-14",
                matriculaMtg: "MTG-2015-01098",
                validade: "2027-03-31",
            },
        ],
    },
    {
        id: 2,
        nome: "Invernada Mirim",
        descricao:
            "Grupo das crianças da entidade, de 7 a 12 anos, para danças e declamação.",
        totalIntegrantes: 2,
        dataCriacao: "2026-03-02T18:05:44.000Z",
        pendenciaCarteiraVencida: false,
        integrantes: [
            {
                id: 9005,
                nome: "Helena",
                sobrenome: "Fagundes",
                dataNascimento: "2017-07-08",
                matriculaMtg: "MTG-2019-01677",
                validade: "2027-03-31",
            },
            {
                id: 9006,
                nome: "Luiza",
                sobrenome: "Menezes",
                dataNascimento: "2016-08-22",
                matriculaMtg: "MTG-2022-02015",
                validade: "2027-03-31",
            },
        ],
    },
    {
        id: 3,
        nome: "Conjunto Vocal",
        descricao: "",
        totalIntegrantes: 0,
        dataCriacao: "2026-08-27T21:12:03.000Z",
        pendenciaCarteiraVencida: false,
        integrantes: [],
    },
];
