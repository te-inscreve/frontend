import { ShieldWarningIcon } from "@phosphor-icons/react/dist/ssr/ShieldWarning";

import { GoBackButton } from "~/shared/ui/back-btn";

/**
 * Renderizada no lugar de qualquer rota do `/admin` que chame `forbidden()`.
 *
 * Mora neste segmento, e não no de `minha-entidade`, porque o boundary do Next
 * embrulha os `children` entregues a um layout — o layout que os recebe fica
 * *acima* dele. Um `forbidden()` lançado no layout de `minha-entidade` passava
 * direto por um `forbidden.tsx` irmão e caía no 403 preto padrão do Next, sem
 * sidebar. Daqui de cima o boundary cobre também esse caso, e o layout do
 * `/admin` continua em volta.
 *
 * O texto é genérico de propósito: daqui de cima a página atende qualquer rota
 * do `/admin`, e não só as da entidade. Citar entidade aqui descreveria errado
 * a maioria dos casos — e o caso "sem vínculo" nem chega neste boundary, é a
 * própria `/minha-entidade` que o resolve.
 *
 * O Next troca só o conteúdo da rota — a URL continua a que o usuário pediu,
 * então dá para voltar sem perder o caminho.
 */
export default function AdminForbidden() {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton />

            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <ShieldWarningIcon
                    aria-hidden="true"
                    className="text-muted-foreground"
                    size={48}
                    weight="duotone"
                />
                <h1 className="text-2xl font-bold">
                    Você não tem permissão para ver esta tela
                </h1>
                <p className="text-muted-foreground max-w-sm text-sm">
                    Seu acesso não permite abrir esta área. Fale com a
                    organização se precisar dessa permissão.
                </p>
            </div>
        </div>
    );
}
