import type { Integrante } from "~/features/entidades/shared/integrantes";
import { idadeEm, nomeCompleto } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

interface Props {
    integrantes: Integrante[];
}

/**
 * Quem faz parte da entidade.
 *
 * Lista, e não tabela: cada pessoa tem identidade e poucas informações
 * relevantes, e a tarefa aqui é reconhecer alguém — não comparar colunas.
 */
export function ListaIntegrantes({ integrantes }: Props) {
    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Nenhum integrante cadastrado. Cadastre as pessoas da entidade
                para poder inscrevê-las nas categorias de um evento.
            </p>
        );
    }

    return (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border">
            {integrantes.map((integrante) => (
                <li
                    key={integrante.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                >
                    <AvatarUsuario
                        nome={nomeCompleto(integrante)}
                        size={36}
                        alt=""
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {nomeCompleto(integrante)}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {integrante.matriculaMtg}
                        </p>
                    </div>

                    {/* A idade fica à direita porque é ela que decide em qual
                        categoria a pessoa pode ser inscrita. */}
                    <p className="text-muted-foreground shrink-0 text-sm tabular-nums">
                        {idadeEm(integrante.dataNascimento)} anos
                    </p>
                </li>
            ))}
        </ul>
    );
}
