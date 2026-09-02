"use client";

import { useCallback, useMemo, useState } from "react";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { useDebounce } from "~/shared/utils/use-debounce";
import { filtrarIntegrantes, filtrosVazios } from "./filtros-integrantes";

/** Um grupo montado a partir da seleção. Vive só nesta sessão da tela. */
export interface GrupoCriado {
    id: number;
    nome: string;
    integrantesIds: number[];
}

/**
 * Todo o estado da tela de integrantes: a lista, o recorte, a seleção, o
 * formulário e os grupos criados.
 *
 * Está num hook, e não espalhado pelos componentes, porque as quatro coisas se
 * cruzam — cadastrar limpa o filtro para a pessoa nova aparecer, criar grupo
 * consome a seleção — e porque é aqui que a troca do mock pelo tRPC vai doer
 * apenas uma vez.
 */
export function usePainelIntegrantes(iniciais: Integrante[]) {
    const [integrantes, setIntegrantes] = useState(iniciais);
    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);
    const [selecionados, setSelecionados] = useState<number[]>([]);
    const [formAberto, setFormAberto] = useState(false);
    const [gruposCriados, setGruposCriados] = useState<GrupoCriado[]>([]);

    // Os campos respondem na hora; a lista espera a digitação parar. O atraso
    // vale para o filtro inteiro — nos que mudam por clique ele não se nota.
    const filtrosAplicados = useDebounce(filtros, 200);

    const visiveis = useMemo(
        () => filtrarIntegrantes(integrantes, filtrosAplicados),
        [integrantes, filtrosAplicados],
    );

    const selecionadosIntegrantes = useMemo(
        () => integrantes.filter(({ id }) => selecionados.includes(id)),
        [integrantes, selecionados],
    );

    const alternarSelecao = useCallback((id: number) => {
        setSelecionados((atual) =>
            atual.includes(id)
                ? atual.filter((selecionado) => selecionado !== id)
                : [...atual, id],
        );
    }, []);

    /** O "selecionar todos" do cabeçalho age sobre o resultado do filtro. */
    const selecionarVisiveis = useCallback(
        (marcar: boolean) => {
            const ids = visiveis.map(({ id }) => id);
            setSelecionados((atual) =>
                marcar
                    ? [...new Set([...atual, ...ids])]
                    : atual.filter((id) => !ids.includes(id)),
            );
        },
        [visiveis],
    );

    const limparSelecao = useCallback(() => setSelecionados([]), []);

    /**
     * Cadastra o integrante e devolve a lista ao estado em que ele aparece.
     *
     * É aqui que entra o `POST`: o formulário espera o retorno desta função e
     * só fecha o diálogo quando ela termina bem — se ela lançar, o que foi
     * digitado continua na tela com a mensagem do erro.
     *
     * Com a rota pronta, o corpo vira a mutation seguida da revalidação da
     * lista (`router.refresh()` para dados do servidor, ou o `invalidate` da
     * query, conforme de onde vier `integrantesIniciais`), e o `setIntegrantes`
     * daqui sai de cena. Enquanto isso, a lista é a memória desta sessão: o
     * integrante novo some no refresh.
     */
    const adicionarIntegrante = useCallback(
        (novo: Omit<Integrante, "id">) => {
            const id =
                integrantes.reduce((maior, { id }) => Math.max(maior, id), 0) +
                1;

            setIntegrantes((atual) => [...atual, { ...novo, id }]);
            // Sem limpar o filtro, o cadastro pareceria não ter funcionado:
            // a pessoa recém-criada quase nunca casa com o recorte em uso.
            setFiltros(filtrosVazios);
            setFormAberto(false);
        },
        [integrantes],
    );

    /** Cria o grupo com quem está selecionado e devolve a seleção ao zero. */
    const criarGrupo = useCallback(
        (nome: string) => {
            if (selecionados.length === 0) return;

            setGruposCriados((atual) => [
                ...atual,
                { id: atual.length + 1, nome, integrantesIds: selecionados },
            ]);
            setSelecionados([]);
        },
        [selecionados],
    );

    return {
        integrantes,
        visiveis,
        filtros,
        filtrosAplicados,
        setFiltros,
        selecionados,
        selecionadosIntegrantes,
        alternarSelecao,
        selecionarVisiveis,
        limparSelecao,
        formAberto,
        setFormAberto,
        adicionarIntegrante,
        gruposCriados,
        criarGrupo,
    };
}
