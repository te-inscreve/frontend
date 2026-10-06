"use client";

import type { FieldPath } from "react-hook-form";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import { proximaPagina } from "@te-inscreve/schemas";

import type { InscricaoFormValues } from "./lib/inscricao-form-schema";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/lib/filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { filtrarGrupos } from "~/features/entidades/grupos/filtros-grupos";
import { useFiltrosGrupos } from "~/features/entidades/grupos/use-filtros-grupos";
import {
    filtrarIntegrantes,
    filtrosVazios,
} from "~/features/entidades/integrantes/lib/filtros-integrantes";
import { useFiltrosIntegrantes } from "~/features/entidades/integrantes/lib/use-filtros-integrantes";
import { revalidarInscricoes } from "~/shared/api/revalidar";
import { useTRPC } from "~/shared/api/trpc/client";
import {
    alternarIntegrante as alternar,
    aplicarFormacao,
    exigeNomeConcorrente,
    inscricaoFormDefaults,
    inscricaoFormInput,
    inscricaoFormSchema,
} from "./lib/inscricao-form-schema";

interface Opcoes {
    eventoId: number;
    modalidadeId: number;
    categoriaId: number;
    /** Os mesmos dos `prefetch` da página — a chave da query inclui o tamanho. */
    gruposPorPagina: number;
    integrantesPorPagina: number;
}

/**
 * O estado da página de criar inscrição: o que a entidade tem (grupos e
 * integrantes), o que a categoria exige, e o formulário da inscrição.
 *
 * Modelo de `use-detalhe-grupo.ts`. Cinco leituras, todas hidratadas do
 * `prefetch` da página: a entidade (o nome do cabeçalho), a categoria e a
 * modalidade (o rodapé do ticket) e as duas listas infinitas (as abas).
 *
 * A inscrição mora num `useForm`: o nome do concorrente e a lista de quem
 * vai. Grupo não é estado — aplicar um grupo busca a formação com
 * `grupo.getById` e despeja as pessoas na lista do formulário — e, na
 * modalidade em grupo, o nome do grupo no nome do concorrente. Depois disso,
 * são só pessoas: tirar ou pôr alguém não sabe de grupo nenhum. A busca é uma mutação para o pendente
 * (`variables`) dizer qual grupo está chegando sem a tela guardá-lo.
 *
 * Busca e filtros são do navegador, sobre as páginas já carregadas: nem
 * `grupo.list` nem `integrante.list` aceitam `search`. Cada aba tem o próprio
 * formulário de filtro, e ele sobrevive à troca de aba porque mora aqui, não
 * na lista que desmonta. O de integrantes já nasce na faixa de idade da
 * categoria: é a pergunta que a tela responde — quem pode ir —, e quem
 * quiser ver a entidade inteira limpa o filtro.
 *
 * `criarInscricao` envia para `inscricao.create` e, dando certo, volta ao
 * detalhe da categoria. Uma recusa do backend cai no campo a que se refere,
 * quando há um; as de domínio (faixa etária, janela fechada, limite) não têm
 * campo, e viram `erroAoCriar`, no rodapé.
 */
export function useInscricao({
    eventoId,
    modalidadeId,
    categoriaId,
    gruposPorPagina,
    integrantesPorPagina,
}: Opcoes) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();

    // ---- O contexto: entidade, categoria, modalidade ----------------------

    const entidade = useQuery(trpc.entidade.minha.queryOptions());
    const categoria = useQuery(
        trpc.categoria.getById.queryOptions({
            eventoId,
            modalidadeId,
            categoriaId,
        }),
    );
    const modalidade = useQuery(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );

    // ---- Os filtros -------------------------------------------------------

    const faixaDaCategoria = useMemo<FiltrosIntegrantes | undefined>(
        () =>
            categoria.data
                ? {
                      ...filtrosVazios,
                      idadeMinima: categoria.data.idadeMinima,
                      idadeMaxima: categoria.data.idadeMaxima,
                  }
                : undefined,
        [categoria.data],
    );
    const filtrosIntegrantes = useFiltrosIntegrantes(faixaDaCategoria);
    const filtrosGrupos = useFiltrosGrupos();
    // `null` é o 404 da modalidade — sem ela, não há nome a exigir.
    const exigeNome = modalidade.data
        ? exigeNomeConcorrente(modalidade.data)
        : false;

    // ---- O formulário -----------------------------------------------------

    // O RHF relê as opções a cada render, então o resolver acompanha a
    // modalidade quando ela chega.
    const resolver = useMemo(
        () => zodResolver(inscricaoFormSchema(exigeNome)),
        [exigeNome],
    );
    const form = useForm<InscricaoFormValues>({
        resolver,
        defaultValues: inscricaoFormDefaults,
    });
    const { getValues, setValue, setError, formState } = form;
    const integrantesInscritos = useWatch({
        control: form.control,
        name: "integrantes",
    });

    // Revalida só depois da primeira tentativa de envio: antes disso, o
    // ticket vazio não é erro, é o começo.
    const { isSubmitted } = formState;
    const definirIntegrantes = useCallback(
        (integrantes: Integrante[]) =>
            setValue("integrantes", integrantes, {
                shouldDirty: true,
                shouldValidate: isSubmitted,
            }),
        [setValue, isSubmitted],
    );

    // ---- As listas --------------------------------------------------------

    const listaGrupos = useInfiniteQuery(
        trpc.grupo.list.infiniteQueryOptions(
            { pageSize: gruposPorPagina },
            { getNextPageParam: proximaPagina },
        ),
    );
    const grupos = useMemo(
        () => listaGrupos.data?.pages.flatMap((pagina) => pagina.items) ?? [],
        [listaGrupos.data],
    );
    const gruposVisiveis = useMemo(
        () => filtrarGrupos(grupos, filtrosGrupos.valores),
        [grupos, filtrosGrupos.valores],
    );
    // Desestruturados para o `useCallback` ter dependências estáveis: o
    // objeto da query muda a cada render, e a sentinela da lista observa o
    // ref de novo sempre que o callback troca.
    const {
        hasNextPage: temMaisGrupos,
        isFetchingNextPage: buscandoMaisGrupos,
        fetchNextPage: buscarMaisGrupos,
    } = listaGrupos;
    const carregarMaisGrupos = useCallback(() => {
        if (temMaisGrupos && !buscandoMaisGrupos) void buscarMaisGrupos();
    }, [temMaisGrupos, buscandoMaisGrupos, buscarMaisGrupos]);

    const listaIntegrantes = useInfiniteQuery(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: integrantesPorPagina },
            { getNextPageParam: proximaPagina },
        ),
    );
    const integrantes = useMemo(
        () =>
            listaIntegrantes.data?.pages.flatMap((pagina) => pagina.items) ??
            [],
        [listaIntegrantes.data],
    );
    const integrantesVisiveis = useMemo(
        () => filtrarIntegrantes(integrantes, filtrosIntegrantes.valores),
        [integrantes, filtrosIntegrantes.valores],
    );
    const {
        hasNextPage: temMaisIntegrantes,
        isFetchingNextPage: buscandoMaisIntegrantes,
        fetchNextPage: buscarMaisIntegrantes,
    } = listaIntegrantes;
    const carregarMaisIntegrantes = useCallback(() => {
        if (temMaisIntegrantes && !buscandoMaisIntegrantes) {
            void buscarMaisIntegrantes();
        }
    }, [temMaisIntegrantes, buscandoMaisIntegrantes, buscarMaisIntegrantes]);

    // ---- As ações ---------------------------------------------------------

    const aplicacao = useMutation({
        mutationFn: async (grupo: GrupoComPrevia) => {
            const detalhe = await queryClient.fetchQuery(
                trpc.grupo.getById.queryOptions({ id: grupo.id }),
            );
            // `null` é o 404: o grupo sumiu entre a listagem e o clique.
            if (!detalhe) throw new Error("O grupo não existe mais.");
            return detalhe;
        },
        onSuccess: (detalhe) => {
            definirIntegrantes(
                aplicarFormacao(getValues("integrantes"), detalhe.integrantes),
            );
            // Só onde a modalidade pede nome há concorrente a nomear.
            if (exigeNome) {
                setValue("nomeConcorrente", detalhe.nome, {
                    shouldDirty: true,
                    shouldValidate: isSubmitted,
                });
            }
        },
    });
    const { mutate: aplicar } = aplicacao;
    const aplicarGrupo = useCallback(
        (grupo: GrupoComPrevia) => aplicar(grupo),
        [aplicar],
    );

    const alternarIntegrante = useCallback(
        (integrante: Integrante) =>
            definirIntegrantes(alternar(getValues("integrantes"), integrante)),
        [definirIntegrantes, getValues],
    );

    const [erroAoCriar, setErroAoCriar] = useState<string | null>(null);
    const criacao = useMutation(
        trpc.inscricao.create.mutationOptions({
            onSuccess: async () => {
                // Antes do `push`: a aba de inscritos lê do Data Cache, e sem
                // isto a inscrição recém-criada só apareceria em 30 segundos.
                await revalidarInscricoes(categoriaId);
                router.push(
                    `/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoriaId}`,
                );
            },
            onError: (error) => {
                let algumCampo = false;
                const fieldErrors = error.data?.fieldErrors ?? {};
                for (const [campo, mensagens] of Object.entries(fieldErrors)) {
                    const campoDoFormulario = campoInscricaoForm(campo);
                    if (!campoDoFormulario || !mensagens.length) continue;
                    algumCampo = true;
                    setError(campoDoFormulario, {
                        type: "server",
                        message: mensagens.join(" "),
                    });
                }
                // Sem campo a apontar — recusa de domínio, permissão, rede —,
                // a mensagem vai inteira para o rodapé.
                if (!algumCampo) setErroAoCriar(error.message);
            },
        }),
    );
    const { mutate: criar } = criacao;

    const criarInscricao = form.handleSubmit((valores) => {
        setErroAoCriar(null);
        criar({
            eventoId,
            modalidadeId,
            categoriaId,
            inscricao: inscricaoFormInput(valores, exigeNome),
        });
    });

    return {
        entidade: entidade.data ?? null,
        categoria: categoria.data ?? null,
        modalidade: modalidade.data ?? null,

        grupos: {
            itens: gruposVisiveis,
            total: listaGrupos.data?.pages[0]?.totalItems ?? 0,
            carregando: listaGrupos.isLoading,
            erro: listaGrupos.error,
            isFetchingNextPage: buscandoMaisGrupos,
            carregarMais: carregarMaisGrupos,
            filtros: filtrosGrupos,
        },
        integrantes: {
            itens: integrantesVisiveis,
            total: listaIntegrantes.data?.pages[0]?.totalItems ?? 0,
            carregando: listaIntegrantes.isLoading,
            erro: listaIntegrantes.error,
            isFetchingNextPage: buscandoMaisIntegrantes,
            temMais: temMaisIntegrantes,
            carregarMais: carregarMaisIntegrantes,
            filtros: filtrosIntegrantes,
        },

        form,
        integrantesInscritos,
        /** O grupo cuja formação está a caminho, enquanto `grupo.getById` responde. */
        grupoAplicando: aplicacao.isPending ? aplicacao.variables : null,
        erroAoAplicarGrupo: aplicacao.error,
        // Até o `router.push` terminar, o sucesso também conta como envio:
        // o botão não volta a ficar ativo na tela que está saindo.
        criando: criacao.isPending || criacao.isSuccess,
        erroAoCriar,

        aplicarGrupo,
        alternarIntegrante,
        criarInscricao,
    };
}

/**
 * Nome do campo na resposta da API → campo do formulário. O backend responde
 * em camelCase, mas o snake_case aparece nos erros que vêm do serializer sem
 * passar pelo `djangorestframework-camel-case`.
 */
function campoInscricaoForm(
    campoApi: string,
): FieldPath<InscricaoFormValues> | null {
    const campos: Record<string, FieldPath<InscricaoFormValues>> = {
        nomeConcorrente: "nomeConcorrente",
        nome_concorrente: "nomeConcorrente",
        integrantes: "integrantes",
    };

    return campos[campoApi] ?? null;
}
