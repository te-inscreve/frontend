/**
 * Dados de exemplo do painel da entidade.
 *
 * A API ainda não expõe integrantes, grupos, inscrições nem premiações — só o
 * cadastro da entidade, que já vem de `entidade.minha`. Enquanto isso, a tela é montada a partir daqui, num
 * módulo separado para que trocar o mock pelas queries do tRPC seja uma
 * mudança de origem de dados, e não uma reescrita dos componentes.
 *
 * Os tipos abaixo são a forma que a tela espera. Quando o backend definir a
 * dele, o que sobreviver vira schema em `packages/schemas`.
 *
 * Os integrantes são a exceção: como a tela de cadastro também depende deles,
 * moram em `shared/integrantes` e são só reexportados daqui.
 */

export { integrantesMock } from "~/features/entidades/shared/integrantes";

export interface GrupoMock {
    id: number;
    nome: string;
    modalidade: string;
    /** Quem responde pelo grupo diante da comissão do evento. */
    responsavelId: number;
    /** Ids dos integrantes: o grupo referencia as pessoas em vez de repetir os dados delas. */
    integrantesIds: number[];
}

export interface InscricaoMock {
    id: number;
    modalidade: string;
    categoria: string;
    /** Nome do grupo ou da pessoa que vai se apresentar. */
    participante: string;
    tipo: "grupo" | "individual";
    situacao: "confirmada" | "pendente";
}

export interface EventoAtualMock {
    id: number;
    nome: string;
    local: string;
    dataInicio: string;
    dataFim: string;
    /** Prazo final de inscrição: é ele que diz se ainda dá para mexer. */
    inscricoesAte: string;
    inscricoes: InscricaoMock[];
}

export interface PremiacaoMock {
    id: number;
    evento: string;
    ano: number;
    modalidade: string;
    categoria: string;
    /** 1, 2 ou 3. Menções e classificações fora do pódio não entram na sala de troféus. */
    colocacao: 1 | 2 | 3;
    /** Quem subiu ao palco — grupo ou integrante. */
    participante: string;
}

export const gruposMock: GrupoMock[] = [
    {
        id: 1,
        nome: "Invernada Artística Adulta",
        modalidade: "Danças tradicionais",
        responsavelId: 3,
        integrantesIds: [2, 3, 4, 5, 10],
    },
    {
        id: 2,
        nome: "Invernada Mirim",
        modalidade: "Danças tradicionais",
        responsavelId: 2,
        integrantesIds: [6, 8, 9],
    },
    {
        id: 3,
        nome: "Conjunto Instrumental Potaria",
        modalidade: "Música",
        responsavelId: 7,
        integrantesIds: [7, 10],
    },
];

export const eventoAtualMock: EventoAtualMock = {
    id: 42,
    nome: "38º Rodeio Crioulo Internacional de Vacaria",
    local: "Parque de Eventos Ivo Zanella, Vacaria — RS",
    dataInicio: "2026-09-18",
    dataFim: "2026-09-27",
    inscricoesAte: "2026-09-05",
    inscricoes: [
        {
            id: 1,
            modalidade: "Danças tradicionais",
            categoria: "Adulta",
            participante: "Invernada Artística Adulta",
            tipo: "grupo",
            situacao: "confirmada",
        },
        {
            id: 2,
            modalidade: "Danças tradicionais",
            categoria: "Mirim",
            participante: "Invernada Mirim",
            tipo: "grupo",
            situacao: "confirmada",
        },
        {
            id: 3,
            modalidade: "Declamação",
            categoria: "Juvenil feminino",
            participante: "Helena Fagundes",
            tipo: "individual",
            situacao: "pendente",
        },
        {
            id: 4,
            modalidade: "Chula",
            categoria: "Adulto masculino",
            participante: "Tiago Vasconcelos",
            tipo: "individual",
            situacao: "confirmada",
        },
        {
            id: 5,
            modalidade: "Música",
            categoria: "Instrumental",
            participante: "Conjunto Instrumental Potaria",
            tipo: "grupo",
            situacao: "pendente",
        },
    ],
};

export const premiacoesMock: PremiacaoMock[] = [
    {
        id: 1,
        evento: "37º Rodeio Crioulo Internacional de Vacaria",
        ano: 2025,
        modalidade: "Danças tradicionais",
        categoria: "Adulta",
        colocacao: 1,
        participante: "Invernada Artística Adulta",
    },
    {
        id: 2,
        evento: "37º Rodeio Crioulo Internacional de Vacaria",
        ano: 2025,
        modalidade: "Chula",
        categoria: "Adulto masculino",
        colocacao: 3,
        participante: "Tiago Vasconcelos",
    },
    {
        id: 3,
        evento: "Festival Nativista Coxilha Nativa",
        ano: 2025,
        modalidade: "Música",
        categoria: "Instrumental",
        colocacao: 2,
        participante: "Conjunto Instrumental Potaria",
    },
    {
        id: 4,
        evento: "ENART — Etapa Regional Planalto",
        ano: 2024,
        modalidade: "Danças tradicionais",
        categoria: "Mirim",
        colocacao: 1,
        participante: "Invernada Mirim",
    },
    {
        id: 5,
        evento: "ENART — Etapa Regional Planalto",
        ano: 2024,
        modalidade: "Declamação",
        categoria: "Juvenil feminino",
        colocacao: 2,
        participante: "Helena Fagundes",
    },
];
