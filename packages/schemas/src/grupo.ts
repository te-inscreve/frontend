import { z } from "zod/v4";

import { integranteSchema } from "./integrante";
import { paginadoSchema } from "./paginacao";

/**
 * O grupo da entidade, como vem de `/minha-entidade/grupos`.
 *
 * Grupo é um conjunto de integrantes montado só para organização. Ele não
 * pertence a modalidade nenhuma — quem amarra grupo e modalidade é a
 * inscrição, que manda o grupo para o backend saber quem relacionar na ficha.
 *
 * Este é o `GrupoListSerializer`: o resumo, sem a formação.
 */
export const grupoSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    /** Para que o grupo serve. Pode vir vazia — o backend não a exige. */
    descricao: z.string(),
    totalIntegrantes: z.number().int().nonnegative(),
    /** Criação em ISO com hora (`DateTimeField`), e não a data seca. */
    dataCriacao: z.string(),
    /**
     * Se alguém do grupo está com a matrícula vencida. Vem pronta do backend
     * porque a listagem não carrega a formação, e sem ela a tela não teria
     * como descobrir — é o aviso de que a inscrição vai travar.
     */
    pendenciaCarteiraVencida: z.boolean(),
});

/**
 * O detalhe (`/minha-entidade/grupos/{id}`, `GrupoDetailSerializer`): o mesmo
 * grupo com a formação inteira, cada pessoa no formato da listagem de
 * integrantes.
 */
export const grupoDetalheSchema = grupoSchema.extend({
    integrantes: z.array(integranteSchema),
});

/**
 * O que o formulário de grupo envia — o corpo do `POST` e do `PATCH` de nome e
 * descrição. A formação não passa por aqui: vai em {@link formacaoGrupoSchema}.
 */
export const formGrupoSchema = z.object({
    nome: z.string().trim().min(1).max(255),
    descricao: z.string().trim().max(500),
});

/**
 * A formação do grupo como o `PATCH` a recebe: só os ids. O `PATCH` é parcial,
 * então mandar isto sozinho troca a formação sem tocar em nome e descrição.
 */
export const formacaoGrupoSchema = z.object({
    integrantes: z.array(z.number().int()),
});

export const paginaGruposSchema = paginadoSchema(grupoSchema);

export type Grupo = z.infer<typeof grupoSchema>;
export type GrupoDetalhe = z.infer<typeof grupoDetalheSchema>;
export type FormGrupo = z.infer<typeof formGrupoSchema>;
export type FormacaoGrupo = z.infer<typeof formacaoGrupoSchema>;
export type PaginaGrupos = z.infer<typeof paginaGruposSchema>;
