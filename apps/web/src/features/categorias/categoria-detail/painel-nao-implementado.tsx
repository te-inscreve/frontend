import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";

/**
 * Espaço reservado das abas que ainda não têm tela. Existe para a estrutura de
 * navegação já ficar de pé sem inventar dado nenhum: cada aba diz, com todas as
 * letras, que o conteúdo dela ainda não existe.
 */
export function PainelNaoImplementado({ children }: { children: string }) {
    return (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
            <WrenchIcon aria-hidden="true" className="size-6" />
            <p className="text-sm font-medium">{children}</p>
            <p className="text-xs">Ainda não implementado.</p>
        </div>
    );
}
