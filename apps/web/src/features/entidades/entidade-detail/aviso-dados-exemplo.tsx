import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";

/**
 * Diz, com todas as letras, que o painel está montado sobre dados de exemplo.
 *
 * O cabeçalho e os integrantes já vêm da API; o resto ainda não. Sem esse
 * aviso a tela mente:
 * as listas parecem da entidade de quem está olhando. O tom é de atenção, e
 * não de erro — nada aqui está quebrado, só ainda não vem da API.
 */
export function AvisoDadosExemplo() {
    return (
        <p className="border-warning/40 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm">
            <InfoIcon
                aria-hidden="true"
                weight="fill"
                className="text-warning mt-0.5 size-4 shrink-0"
            />
            <span>
                A lista de grupos, as inscrições e as premiações ainda são dados
                de exemplo — a tela mostra como elas vão aparecer quando vierem
                da API.
            </span>
        </p>
    );
}
