import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

import type {
    EnvioAvaliacao,
    ErroDeEnvioLocalizado,
    InscricoesDaCategoria,
    ModeloFichaDetalhe,
} from "@te-inscreve/schemas";

import type { InscricaoAvaliada } from "~/features/avaliacoes/lib/rota-ficha-inscricao";
import type { CategoriaPronta } from "~/features/categorias/lib/listar-categorias-prontas";

/**
 * O banco local do app (expo-sqlite + Drizzle; TE-66, TE-74). Mudou algo
 * aqui? Gere a migração com `yarn workspace @te-inscreve/expo db:generate`.
 * Migrações só acrescentam: nunca apagam o que o avaliador fez no aparelho.
 */

/**
 * Onde a avaliação local está (TE-74):
 *
 * - `atual`: a avaliação atual, que o avaliador ainda preenche. Uma só por
 *   avaliador; congelada quando `motivoCongelado` está preenchido (o modelo
 *   mudou ou a categoria encerrou), e aí só se descarta.
 * - `na_fila`: salva, esperando envio, na ordem de `enfileiradoEm`.
 * - `enviando`: um envio está em curso. Ao abrir, o que ficou aqui depois de
 *   o app morrer volta para `na_fila`.
 * - `com_erro`: o servidor recusou de vez; o avaliador corrige ou descarta.
 * - `sincronizada`: o servidor aceitou. Não muda mais.
 */
export const ESTADOS_AVALIACAO = [
    "atual",
    "na_fila",
    "enviando",
    "com_erro",
    "sincronizada",
] as const;

export type EstadoAvaliacao = (typeof ESTADOS_AVALIACAO)[number];

/** Por que o servidor recusou, como o avaliador o lê. */
export interface ErroDeEnvio {
    /** O status HTTP do backend, quando houve resposta. */
    status?: number;
    mensagem: string;
    /** Os problemas do 400, com onde cada um está, para marcar o formulário. */
    erros?: ErroDeEnvioLocalizado[];
}

/** Milissegundos desde a época, como o `Date.now()`. */
const instante = (nome: string) => integer(nome, { mode: "timestamp_ms" });

/**
 * Uma avaliação de uma inscrição por um avaliador, em qualquer estado. A
 * linha guarda tudo o que a tela precisa sem rede: o payload de envio
 * (TE-98), a própria cópia da versão do modelo e o que se mostra da
 * inscrição. A nota não se guarda enquanto é local: sai de `calcularNota`.
 */
export const avaliacoes = sqliteTable(
    "avaliacoes",
    {
        /** Gerado no app. */
        id: text("id").primaryKey(),
        /** O usuário da sessão: só a fila dele é enviada. */
        avaliadorId: text("avaliador_id").notNull(),
        // O caminho do POST.
        eventoId: integer("evento_id").notNull(),
        modalidadeId: integer("modalidade_id").notNull(),
        categoriaId: integer("categoria_id").notNull(),
        inscricaoId: integer("inscricao_id").notNull(),

        estado: text("estado", { enum: ESTADOS_AVALIACAO }).notNull(),
        motivoCongelado: text("motivo_congelado"),

        payload: text("payload", { mode: "json" })
            .$type<EnvioAvaliacao>()
            .notNull(),
        modelo: text("modelo", { mode: "json" })
            .$type<ModeloFichaDetalhe>()
            .notNull(),
        inscricao: text("inscricao", { mode: "json" })
            .$type<InscricaoAvaliada>()
            .notNull(),

        criadoEm: instante("criado_em").notNull(),
        atualizadoEm: instante("atualizado_em").notNull(),
        /** Quando foi para a fila: a ordem FIFO do envio. */
        enfileiradoEm: instante("enfileirado_em"),
        tentativas: integer("tentativas").notNull().default(0),
        /** Antes disso o envio não tenta de novo (backoff). */
        proximaTentativaEm: instante("proxima_tentativa_em"),
        erro: text("erro", { mode: "json" }).$type<ErroDeEnvio>(),

        // Só na sincronizada: o que o servidor devolveu.
        servidorId: integer("servidor_id"),
        /** Decimal em string, como a API devolve (`"8.7500"`). */
        nota: text("nota"),
        enviadoEm: instante("enviado_em"),
    },
    (tabela) => [
        // Como o backend: uma avaliação por avaliador e inscrição.
        uniqueIndex("avaliacoes_avaliador_inscricao").on(
            tabela.avaliadorId,
            tabela.inscricaoId,
        ),
        // Uma avaliação atual só por avaliador.
        uniqueIndex("avaliacoes_uma_atual")
            .on(tabela.avaliadorId)
            .where(sql`${tabela.estado} = 'atual'`),
        index("avaliacoes_fila").on(tabela.estado, tabela.enfileiradoEm),
    ],
);

export type AvaliacaoLocal = typeof avaliacoes.$inferSelect;

/**
 * O download offline (TE-107): o que o app precisa para começar uma avaliação
 * sem rede. Ao contrário de `avaliacoes`, nada aqui é do avaliador — é a
 * cópia do servidor, que cada download reescreve inteira e que fica no
 * logout.
 */

/**
 * As categorias prontas para avaliação, na ordem em que a API as lista. A
 * lista inteira se reescreve a cada download.
 */
export const categoriasProntas = sqliteTable("categorias_prontas", {
    id: integer("id").primaryKey(),
    /** A posição na lista da API. */
    posicao: integer("posicao").notNull(),
    categoria: text("categoria", { mode: "json" })
        .$type<CategoriaPronta>()
        .notNull(),
    baixadaEm: instante("baixada_em").notNull(),
});

/**
 * As inscrições e o modelo de ficha de uma categoria, numa linha só: trocam
 * juntos, na mesma transação. Sai quando a categoria sai da lista; as
 * avaliações dela seguem, com a própria cópia do modelo.
 */
export const downloadsCategoria = sqliteTable("downloads_categoria", {
    categoriaId: integer("categoria_id").primaryKey(),
    inscricoes: text("inscricoes", { mode: "json" })
        .$type<InscricoesDaCategoria>()
        .notNull(),
    /** `null`: a categoria não tem modelo vinculado. */
    modelo: text("modelo", { mode: "json" }).$type<ModeloFichaDetalhe | null>(),
    baixadoEm: instante("baixado_em").notNull(),
});
