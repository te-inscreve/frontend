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
    formCategoriaSchema,
    situacaoCategoriaSchema,
} from "./categoria";
export type {
    AcaoSituacaoCategoria,
    Categoria,
    CategoriaAninhada,
    CategoriaDetalhe,
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
    TipoCampoFicha,
} from "./ficha-avaliativa";
