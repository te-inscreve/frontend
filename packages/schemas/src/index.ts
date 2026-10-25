import { z } from "zod/v4";

import { cpfSchema } from "./cpf";

/**
 * Schemas shared between the tRPC layer and both front-ends.
 *
 * Since there is no ORM to derive types from, this package is the single source
 * of truth for the shapes crossing the REST boundary. Define a schema here and
 * the inferred type flows through tRPC to the web and mobile clients.
 */

export const signInSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * O formulário de login do web e do mobile. Espelha o `signInSchema`, mas com
 * os nomes e as mensagens que a UI mostra: os campos aparecem em português e o
 * backend só fala inglês nas falhas. Mora aqui, e não em `features/auth`, só
 * porque os dois apps usam o mesmo.
 */
export const signInFormSchema = z.object({
    email: z.email("Informe um e-mail válido."),
    senha: z
        .string()
        .min(1, "Informe sua senha.")
        .min(8, "A senha deve ter ao menos 8 caracteres."),
});
export type SignInFormValues = z.infer<typeof signInFormSchema>;

/**
 * O que `/auth/registration/` recebe. Os nomes são os do backend (camelCase, já
 * que a API usa `djangorestframework-camel-case`) — a tradução para os rótulos
 * em português acontece no formulário.
 */
export const signUpSchema = z
    .object({
        email: z.email(),
        fullName: z.string().min(1),
        cpf: cpfSchema,
        password: z.string().min(8),
        passwordVerification: z.string().min(8),
    })
    .refine((dados) => dados.password === dados.passwordVerification, {
        path: ["passwordVerification"],
        error: "Password confirmation does not match.",
    });
export type SignUpInput = z.infer<typeof signUpSchema>;

export { cpfSchema, isValidCpf } from "./cpf";

export {
    createEventoSchema,
    eventoPreviewSchema,
    eventoSchema,
} from "./evento";
export type { CreateEventoInput, Evento, EventoPreview } from "./evento";

export {
    formModalidadeSchema as createModalidadeSchema,
    editModalidadeSchema,
    modalidadeDetalheSchema,
    modalidadePreviewSchema,
    modalidadeSchema,
} from "./modalidade";
export type {
    EditModalidade,
    FormModalidade as CreateModalidade,
    Modalidade,
    ModalidadeDetalhe,
    ModalidadePreview,
} from "./modalidade";

export {
    acaoSituacaoCategoriaSchema,
    acoesPorSituacaoCategoria,
    categoriaAninhadaSchema,
    categoriaDetalheSchema,
    categoriaSchema,
    categoriasDisponiveisSchema,
    formCategoriaSchema,
    situacaoCategoriaSchema,
} from "./categoria";
export type {
    AcaoSituacaoCategoria,
    Categoria,
    CategoriaAninhada,
    CategoriaDetalhe,
    CategoriasDisponiveis,
    FormCategoria,
    SituacaoCategoria,
} from "./categoria";

export {
    entidadeOpcaoSchema,
    formEntidadeSchema,
    minhaEntidadeSchema,
    privateEntidadeSchema,
    publicEntidadeSchema,
} from "./entidade";
export type {
    EntidadeOpcao,
    FormEntidade,
    MinhaEntidade,
    PrivateEntidade,
    PublicEntidade,
} from "./entidade";

export { perfilSchema, temEntidade } from "./perfil";
export type { Perfil } from "./perfil";

export { paginadoSchema, proximaPagina } from "./paginacao";
export type { Paginado } from "./paginacao";

export {
    formIntegranteSchema,
    grupoDoIntegranteSchema,
    integranteDetalheSchema,
    integranteSchema,
    paginaIntegrantesSchema,
} from "./integrante";
export type {
    FormIntegrante,
    GrupoDoIntegrante,
    Integrante,
    IntegranteDetalhe,
    PaginaIntegrantes,
} from "./integrante";

export {
    formacaoGrupoSchema,
    formGrupoSchema,
    grupoComPreviaSchema,
    grupoDetalheSchema,
    grupoSchema,
    integranteDoGrupoSchema,
    paginaGruposSchema,
} from "./grupo";
export type {
    FormacaoGrupo,
    FormGrupo,
    Grupo,
    GrupoComPrevia,
    GrupoDetalhe,
    IntegranteDoGrupo,
    PaginaGrupos,
} from "./grupo";

export {
    criarInscricaoSchema,
    inscricaoGrupoSchema,
    inscricaoIndividualSchema,
    inscricoesCriadasSchema,
    inscricoesDaCategoriaSchema,
} from "./inscricao";
export type {
    CriarInscricao,
    InscricaoGrupo,
    InscricaoIndividual,
    InscricoesCriadas,
    InscricoesDaCategoria,
} from "./inscricao";

export {
    agrupamentoFichaCriacaoSchema,
    agrupamentoFichaSchema,
    alternativaCriacaoSchema,
    campoFichaCriacaoSchema,
    campoFichaSchema,
    criarModeloFichaSchema,
    modeloFichaDetalheSchema,
    modificadorNotaSchema,
    posicaoFichaCriacaoSchema,
    posicaoFichaSchema,
    TIPOS_COM_ALTERNATIVAS,
    aceitaAlternativas,
    tipoCampoFichaSchema,
} from "./ficha-avaliativa";
export type {
    AgrupamentoFicha,
    AgrupamentoFichaCriacao,
    CampoFicha,
    CampoFichaCriacao,
    CriarModeloFicha,
    ModeloFichaDetalhe,
    ModeloFichaResumo,
    ModificadorNota,
    PosicaoFicha,
    PosicaoFichaCriacao,
    PreviaModeloFicha,
    TipoCampoComAlternativas,
    TipoCampoFicha,
} from "./ficha-avaliativa";

export { calcularNota, calcularSubtotal } from "./nota";
export type { EntradaNota, RespostaNota } from "./nota";

export {
    avaliacaoDaInscricaoSchema,
    avaliacaoDetalheSchema,
    avaliacaoEnviadaSchema,
    avaliadorSchema,
    envioAvaliacaoSchema,
    erroDeEnvioLocalizadoSchema,
    errosDeEnvioSchema,
    ocorrenciaEnvioSchema,
    respostaAvaliacaoSchema,
    respostaEnvioSchema,
} from "./envio-avaliacao";
export type {
    AvaliacaoDaInscricao,
    AvaliacaoDetalhe,
    AvaliacaoEnviada,
    Avaliador,
    EnvioAvaliacao,
    ErroDeEnvioLocalizado,
    OcorrenciaEnvio,
    RespostaAvaliacao,
    RespostaEnvio,
} from "./envio-avaliacao";

export {
    camposComChave,
    camposDoAgrupamento,
    chaveDaOcorrencia,
    chaveGeral,
    chaveNome,
    formularioDoPayload,
    MAXIMO_NOME_OCORRENCIA,
    nomeOcorrenciaSchema,
    nomePadrao,
    payloadDoFormulario,
    formatarDecimal,
    itensDoTopo,
    montarFormularioFicha,
    schemaDoCampo,
    tetoDoCampo,
    valorInicial,
} from "./formulario-ficha";
export type { ItemDoTopo, ValorCampo, ValoresFicha } from "./formulario-ficha";

export {
    minhaAvaliacaoSchema,
    minhasAvaliacoesSchema,
} from "./minhas-avaliacoes";
export type { MinhaAvaliacao, MinhasAvaliacoes } from "./minhas-avaliacoes";

export {
    resultadoCategoriaSchema,
    resultadosCategoriaSchema,
} from "./resultado";
export type { ResultadoCategoria, ResultadosCategoria } from "./resultado";
