"use client";

import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr/GlobeHemisphereWest";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@te-inscreve/components";

import { HoldToAct } from "~/shared/ui/hold-to-act";

interface Props {
    open: boolean;
    onOpenChange: (aberto: boolean) => void;
}

/** O que passa a valer com a publicação, listado antes de o evento sair do rascunho. */
const itensPublicados = [
    {
        Icon: GlobeHemisphereWestIcon,
        label: "O evento fica visível ao público",
    },
    { Icon: UsersThreeIcon, label: "As inscrições passam a ser aceitas" },
    { Icon: LinkSimpleIcon, label: "O link do evento pode ser divulgado" },
];

/**
 * Confirmação da publicação do evento.
 *
 * Publicar expõe o evento para fora, então a confirmação segue o mesmo gesto da
 * exclusão: o organizador segura o botão até a barra preencher, e o `HoldToAct`
 * ocupa o lugar de um `AlertDialogAction` comum.
 *
 * TODO: ligar ao endpoint de publicação quando ele existir no backend. Por
 * enquanto o `onComplete` só resolve, para o diálogo poder ser avaliado
 * visualmente até o estado de sucesso.
 */
export function DialogoPublicarEvento({ open, onOpenChange }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <div className="bg-primary-foreground border-primary flex flex-col items-center gap-3 border-b px-6 pt-8 pb-6 text-center">
                    <span
                        aria-hidden="true"
                        className="bg-primary/15 text-primary ring-primary/15 flex size-14 items-center justify-center rounded-full ring-8"
                    >
                        <MegaphoneIcon weight="bold" className="size-7" />
                    </span>

                    <AlertDialogHeader className="gap-1 text-center sm:text-center">
                        <AlertDialogTitle>
                            Publicar este evento?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A partir daqui, qualquer pessoa pode encontrar e se
                            inscrever no evento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="flex flex-col gap-5 px-6 py-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Ao publicar
                        </p>
                        <ul className="flex flex-col gap-2.5">
                            {itensPublicados.map(({ Icon, label }) => (
                                <li
                                    key={label}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="text-primary size-4 shrink-0"
                                    />
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-start gap-2">
                        <AlertDialogCancel className="w-fit shrink shadow-none">
                            Cancelar
                        </AlertDialogCancel>
                        <div className="flex w-full flex-col gap-2">
                            <HoldToAct
                                color="primary"
                                text={{
                                    idle: "Publicar",
                                    pending: "Publicando…",
                                    completed: "Publicado",
                                }}
                                onComplete={() => Promise.resolve()}
                            />

                            <p
                                role="status"
                                className="text-muted-foreground text-center text-xs"
                            >
                                Mantenha o botão pressionado.
                            </p>
                        </div>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
