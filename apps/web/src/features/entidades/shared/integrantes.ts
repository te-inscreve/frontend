/**
 * O integrante da entidade — o modelo que as telas manipulam enquanto a API
 * não expõe o recurso.
 *
 * Fica em `shared/` porque três telas dependem dele por motivos diferentes: o
 * painel resume, a tela de integrantes cadastra e filtra, e os grupos apenas
 * referenciam ids. Quando o backend definir o contrato, o que sobreviver aqui
 * vira schema em `packages/schemas`.
 */

/**
 * As funções são lista fechada: elas alimentam o filtro, e função digitada à
 * mão faria "Gaiteiro" e "gaiteiro" virarem dois filtros diferentes.
 */
export const FUNCOES = [
    { valor: "dancarino", rotulo: "Dançarino(a)" },
    { valor: "musico", rotulo: "Músico(a)" },
    { valor: "declamador", rotulo: "Declamador(a)" },
    { valor: "instrutor", rotulo: "Instrutor(a)" },
    { valor: "patrao-prenda", rotulo: "Patrão/Prenda" },
    { valor: "chula-trova", rotulo: "Chula e trova" },
] as const;

export type FuncaoIntegrante = (typeof FUNCOES)[number]["valor"];

/** Tupla não-vazia: é a forma que o `z.enum` do schema do formulário aceita. */
export const FUNCOES_VALORES = FUNCOES.map(({ valor }) => valor) as [
    FuncaoIntegrante,
    ...FuncaoIntegrante[],
];

export function rotuloFuncao(funcao: FuncaoIntegrante): string {
    return FUNCOES.find(({ valor }) => valor === funcao)?.rotulo ?? funcao;
}

export interface Integrante {
    id: number;
    /** Nome completo, como consta na matrícula do MTG. */
    nome: string;
    /** Número da matrícula MTG — é ela que a comissão do evento confere. */
    matriculaCtg: string;
    /** Data em que a matrícula vence, em ISO (`aaaa-mm-dd`). */
    validadeMatricula: string;
    /** Nascimento em ISO: é dele que sai a idade, e da idade a categoria. */
    dataNascimento: string;
    /** Entrada na entidade. Opcional: nem toda entidade guarda essa data. */
    dataFiliacao?: string;
    /** O que a pessoa faz na entidade — não o acesso que ela tem no sistema. */
    funcao?: FuncaoIntegrante;
}

/** Lê uma data ISO (`aaaa-mm-dd`) como data local, sem o fuso do `new Date`. */
export function dataDeISO(iso: string): Date {
    const [ano = 0, mes = 1, dia = 1] = iso.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

/** Formata uma data ISO como `dd/mm/aaaa`. */
export function formatarDataISO(iso: string): string {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
}

/** Idade em anos completos na data de referência (hoje, por padrão). */
export function idadeEm(dataNascimento: string, referencia = new Date()) {
    const nascimento = dataDeISO(dataNascimento);
    let idade = referencia.getFullYear() - nascimento.getFullYear();

    const aniversarioAindaNaoVeio =
        referencia.getMonth() < nascimento.getMonth() ||
        (referencia.getMonth() === nascimento.getMonth() &&
            referencia.getDate() < nascimento.getDate());

    if (aniversarioAindaNaoVeio) idade -= 1;

    return idade;
}

/** Matrícula vencida trava a inscrição no evento, então a tela precisa avisar. */
export function matriculaVencida(
    integrante: Integrante,
    referencia = new Date(),
) {
    return dataDeISO(integrante.validadeMatricula) < referencia;
}

export const integrantesMock: Integrante[] = [
    {
        id: 1,
        nome: "Alceu Portela",
        matriculaCtg: "MTG-1998-00142",
        validadeMatricula: "2027-03-31",
        dataNascimento: "1974-06-12",
        dataFiliacao: "1998-03-15",
        funcao: "patrao-prenda",
    },
    {
        id: 2,
        nome: "Iara Boeira",
        matriculaCtg: "MTG-2012-00871",
        validadeMatricula: "2027-03-31",
        dataNascimento: "2002-01-20",
        dataFiliacao: "2012-02-10",
        funcao: "patrao-prenda",
    },
    {
        id: 3,
        nome: "Vicente Machado",
        matriculaCtg: "MTG-2005-00330",
        validadeMatricula: "2026-12-31",
        dataNascimento: "1988-04-02",
        dataFiliacao: "2005-08-19",
        funcao: "instrutor",
    },
    {
        id: 4,
        nome: "Marina Colussi",
        matriculaCtg: "MTG-2016-01204",
        validadeMatricula: "2027-03-31",
        dataNascimento: "2007-05-30",
        dataFiliacao: "2016-09-01",
        funcao: "dancarino",
    },
    {
        id: 5,
        nome: "Tiago Vasconcelos",
        matriculaCtg: "MTG-2015-01098",
        validadeMatricula: "2026-06-30",
        dataNascimento: "2005-02-14",
        dataFiliacao: "2015-04-11",
        funcao: "dancarino",
    },
    {
        id: 6,
        nome: "Helena Fagundes",
        matriculaCtg: "MTG-2019-01677",
        validadeMatricula: "2027-03-31",
        dataNascimento: "2009-07-08",
        dataFiliacao: "2019-03-02",
        funcao: "declamador",
    },
    {
        id: 7,
        nome: "Bento Aguirre",
        matriculaCtg: "MTG-2001-00218",
        validadeMatricula: "2027-03-31",
        dataNascimento: "1981-03-25",
        dataFiliacao: "2001-06-06",
        funcao: "musico",
    },
    {
        id: 8,
        nome: "Luiza Menezes",
        matriculaCtg: "MTG-2022-02015",
        validadeMatricula: "2027-03-31",
        dataNascimento: "2013-08-22",
        dataFiliacao: "2022-05-13",
        funcao: "dancarino",
    },
    {
        id: 9,
        nome: "Otávio Ramires",
        matriculaCtg: "MTG-2021-01952",
        validadeMatricula: "2027-03-31",
        dataNascimento: "2012-03-05",
        dataFiliacao: "2021-07-30",
        funcao: "dancarino",
    },
    {
        id: 10,
        nome: "Clara Bittencourt",
        matriculaCtg: "MTG-2010-00644",
        validadeMatricula: "2027-03-31",
        dataNascimento: "1998-01-09",
        dataFiliacao: "2010-10-04",
        funcao: "chula-trova",
    },
    // Os dois últimos entraram sem função nem data de filiação: o cadastro
    // aceita só o obrigatório, e a tela precisa mostrar como isso fica.
    {
        id: 11,
        nome: "Rosane Trindade",
        matriculaCtg: "MTG-2024-02233",
        validadeMatricula: "2027-03-31",
        dataNascimento: "1995-11-27",
    },
    {
        id: 12,
        nome: "Ismael Cardoso",
        matriculaCtg: "MTG-2023-02180",
        validadeMatricula: "2026-08-15",
        dataNascimento: "2004-09-19",
        funcao: "musico",
    },
];
