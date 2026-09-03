import type { GrupoMock } from "./mock-entidade";
import type { Integrante } from "~/features/entidades/shared/integrantes";

interface Props {
    grupos: GrupoMock[];
    /** Todos os integrantes da entidade: o grupo guarda só os ids. */
    integrantes: Integrante[];
}

/**
 * Os grupos montados pela entidade e quem está em cada um.
 *
 * O grupo é a unidade que se inscreve na maioria das modalidades, então ele
 * mostra a formação inteira — é por ela que se confere se falta alguém antes
 * de fechar a inscrição.
 */
export function ListaGrupos({ grupos, integrantes }: Props) {
    if (grupos.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Nenhum grupo montado. Monte um grupo para inscrevê-lo nas
                modalidades coletivas de um evento.
            </p>
        );
    }

    const porId = new Map(integrantes.map((pessoa) => [pessoa.id, pessoa]));

    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {grupos.map((grupo) => {
                const membros = grupo.integrantesIds
                    .map((id) => porId.get(id))
                    // Um id sem pessoa correspondente é integrante removido da
                    // entidade: some da formação em vez de virar item vazio.
                    .filter((pessoa) => pessoa !== undefined);
                const responsavel = porId.get(grupo.responsavelId);

                return (
                    <li
                        key={grupo.id}
                        className="bg-card flex flex-col gap-3 rounded-xl border p-4"
                    >
                        <div className="flex flex-col gap-1.5">
                            <h3 className="text-base leading-tight font-bold">
                                {grupo.nome}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                    {membros.length === 1
                                        ? "1 integrante"
                                        : `${membros.length} integrantes`}
                                </span>
                            </div>
                        </div>

                        {/* <ul className="flex flex-wrap gap-1.5">
                            {membros.map((membro) => (
                                <li
                                    key={membro.id}
                                    className="bg-muted text-foreground rounded-full px-2.5 py-1 text-xs"
                                >
                                    {membro.nome}
                                    <span className="text-muted-foreground">
                                        {" "}
                                        · {idadeEm(membro.dataNascimento)} anos
                                    </span>
                                </li>
                            ))}
                        </ul> */}
                    </li>
                );
            })}
        </ul>
    );
}
