"use client";

import { useCallback, useMemo, useState } from "react";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import type { Visualizacao } from "./visualizacao";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { useDebounce } from "~/shared/utils/use-debounce";
import { filtrarIntegrantes, filtrosVazios } from "./filtros-integrantes";

/**
 * Todo o estado da tela de integrantes: a lista, o recorte, a visualização e o
 * formulário.
 *
 * Está num hook, e não espalhado pelos componentes, porque as peças se cruzam —
 * cadastrar limpa o filtro para a pessoa nova aparecer — e porque é aqui que a
 * troca do mock pelo tRPC vai doer apenas uma vez.
 *
 * A visualização não é lembrada entre visitas: a tela sempre abre em cartões.
 * Guardá-la exigiria o servidor saber da escolha antes do primeiro render, ou
 * a lista piscaria na visualização errada ao hidratar — ver `docs/fcp.md`.
 */
export function usePainelIntegrantes(iniciais: Integrante[]) {
    const [integrantes, setIntegrantes] = useState(iniciais);
    const [filtros, setFiltros] = useState<FiltrosIntegrantes>(filtrosVazios);
    const [visualizacao, setVisualizacao] = useState<Visualizacao>("cartoes");
    const [formAberto, setFormAberto] = useState(false);

    // Os campos respondem na hora; a lista espera a digitação parar. O atraso
    // vale para o filtro inteiro — nos que mudam por clique ele não se nota.
    const filtrosAplicados = useDebounce(filtros, 200);

    const visiveis = useMemo(
        () => filtrarIntegrantes(integrantes, filtrosAplicados),
        [integrantes, filtrosAplicados],
    );

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

    return {
        integrantes,
        visiveis,
        filtros,
        filtrosAplicados,
        setFiltros,
        visualizacao,
        setVisualizacao,
        formAberto,
        setFormAberto,
        adicionarIntegrante,
    };
}
