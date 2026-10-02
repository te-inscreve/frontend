import type { FiltrosGrupos } from "./filtros-grupos-schema";
import type { GrupoComPrevia } from "./grupo";

/**
 * Os recortes da lista de grupos na inscrição. O formato mora no schema
 * (`filtros-grupos-schema.ts`); aqui ficam o vazio e o recorte em si.
 *
 * Espelha `filtros-integrantes.ts`: `grupo.list` não aceita parâmetros, então
 * quem recorta é o navegador, sobre as páginas já carregadas — as seguintes
 * entram no filtro à medida que a rolagem as pede. Quando o backend aceitar
 * `search`, o que muda é o hook passar estes campos à query; a UI já está
 * pronta.
 */
export type { FiltrosGrupos };

export const filtrosGruposVazios: FiltrosGrupos = {
    nome: "",
    somenteComPendencia: false,
};

/** Os filtros que moram no diálogo — os que a barra não mostra sozinha. */
export function filtrosGruposAvancadosAtivos(filtros: FiltrosGrupos): number {
    return [filtros.somenteComPendencia].filter(Boolean).length;
}

export function temFiltroGrupoAtivo(filtros: FiltrosGrupos): boolean {
    return (
        filtros.nome.trim() !== "" || filtrosGruposAvancadosAtivos(filtros) > 0
    );
}

/**
 * Aplica o recorte sobre uma lista já carregada.
 *
 * O nome é comparado sem caixa e sem depender de onde o trecho aparece: quem
 * digita "tradição" acha "Grupo da Tradição" pelo meio do nome.
 */
export function filtrarGrupos<
    T extends Pick<GrupoComPrevia, "nome" | "pendenciaCarteiraVencida">,
>(grupos: T[], filtros: FiltrosGrupos): T[] {
    const procurado = filtros.nome.trim().toLowerCase();

    return grupos.filter((grupo) => {
        if (procurado !== "" && !grupo.nome.toLowerCase().includes(procurado)) {
            return false;
        }

        if (filtros.somenteComPendencia && !grupo.pendenciaCarteiraVencida) {
            return false;
        }

        return true;
    });
}
