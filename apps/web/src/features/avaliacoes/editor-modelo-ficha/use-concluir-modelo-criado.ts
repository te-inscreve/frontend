"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";

import type { CategoriaDeOrigem } from "~/features/avaliacoes/ficha-avaliativa/lib/categoria-de-origem";
import { caminhoDaCategoria } from "~/features/avaliacoes/ficha-avaliativa/lib/categoria-de-origem";
import { mensagemDeErro } from "~/features/avaliacoes/ficha-avaliativa/lib/mensagem-de-erro";
import { revalidarFichaDaCategoria } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";

const LISTA = "/admin/fichas-avaliativas";

/**
 * O que acontece depois do `POST` que cria o modelo, e para onde a saída leva.
 *
 * Aberto pela lista, o editor volta para ela. Aberto pelo seletor de ficha de
 * uma categoria, o modelo recém-criado é vinculado a ela e a pessoa volta para
 * o detalhe da categoria — a aba da ficha é a aberta por padrão. A aba é
 * montada no servidor, então o cache dela cai antes da navegação.
 *
 * Se o vínculo falhar, o modelo já existe: o editor não pode oferecer criar de
 * novo, então fica com o erro e com o caminho de volta, de onde dá para
 * selecioná-lo pelo seletor.
 */
export function useConcluirModeloCriado(categoria?: CategoriaDeOrigem) {
    const router = useRouter();
    const trpc = useTRPC();
    const [saindo, iniciarSaida] = useTransition();
    const vincular = useMutation(
        trpc.categoria.vincularFichaAvaliativa.mutationOptions(),
    );
    const voltar = categoria ? caminhoDaCategoria(categoria) : LISTA;

    function concluir(modelo: ModeloFichaDetalhe) {
        if (!categoria) {
            iniciarSaida(() => router.push(LISTA));
            return;
        }
        vincular.mutate(
            { ...categoria, fichaAvaliativaId: modelo.id },
            {
                onSuccess: () =>
                    iniciarSaida(async () => {
                        await revalidarFichaDaCategoria(categoria.categoriaId);
                        router.push(voltar);
                    }),
            },
        );
    }

    return {
        lista: LISTA,
        voltar,
        concluir,
        concluindo: vincular.isPending || saindo,
        erroVinculo: vincular.isError
            ? `O modelo foi criado, mas não foi possível vinculá-lo à categoria. ${mensagemDeErro(
                  vincular.error.data?.fieldErrors,
                  "Volte à categoria e selecione-o por lá.",
              )}`
            : null,
    };
}
