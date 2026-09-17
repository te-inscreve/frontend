"use client";

import { useState } from "react";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";

import {
    Badge,
    Button,
    buttonVariants,
    cn,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogFooter,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
    Label,
    Switch,
} from "@te-inscreve/components";

import type { FiltrosGrupos } from "./filtros-grupos";
import { filtrosGruposAvancadosAtivos } from "./filtros-grupos";

interface Props {
    filtros: FiltrosGrupos;
    onChange: (filtros: FiltrosGrupos) => void;
}

/**
 * Os filtros de grupo que não cabem na barra.
 *
 * É o esqueleto do diálogo — a cópia enxuta de `dialog-filtros.tsx`, dos
 * integrantes, com um recorte só: a pendência de matrícula. Os demais
 * (tamanho da formação, faixa de idade da formação) entram aqui quando o
 * backend os expuser; a casca — rascunho, Limpar, Aplicar, morph a partir
 * do botão — já é a definitiva.
 *
 * Trabalha em rascunho e só devolve o filtro no "Aplicar", pelo mesmo motivo
 * do diálogo de integrantes: a lista está atrás do overlay, e filtrar a cada
 * clique não mostraria nada a quem escolhe.
 *
 * O `id` do `ExpandableDialog` é próprio ("filtros-grupos") porque a aba de
 * integrantes da mesma tela usa o diálogo original, com "filtros-integrantes":
 * só uma aba está montada por vez, mas dois morphs com o mesmo id no mesmo
 * `MotionConfig` seriam o mesmo elemento para o Motion.
 */
export function DialogFiltrosGrupos({ filtros, onChange }: Props) {
    const [aberto, setAberto] = useState(false);
    const [rascunho, setRascunho] = useState(filtros);

    const ativos = filtrosGruposAvancadosAtivos(filtros);

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura: assim o diálogo
        // não guarda escolhas que a pessoa abandonou da última vez.
        if (proximo) setRascunho(filtros);
        setAberto(proximo);
    };

    const aplicar = () => {
        onChange(rascunho);
        setAberto(false);
    };

    const limpar = () =>
        setRascunho({ ...rascunho, somenteComPendencia: false });

    return (
        <ExpandableDialog
            id="filtros-grupos"
            open={aberto}
            onOpenChange={abrir}
        >
            {/* `buttonVariants` em vez de `<Button asChild>` e `transition-colors`
                no fim pelos motivos anotados em `dialog-filtros.tsx`: o gatilho
                já é um `motion.button`, e o `transition-all` do botão
                disputaria o `transform` com o Motion. */}
            <ExpandableDialogTrigger
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 transition-colors",
                )}
            >
                <FunilCompartilhado />
                <ExpandableDialogLabel className="font-semibold">
                    Filtros
                </ExpandableDialogLabel>
                {ativos > 0 && (
                    <Badge variant="secondary" className="ml-1">
                        {ativos}
                    </Badge>
                )}
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-md!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <FunilCompartilhado />
                        <ExpandableDialogTitle className="text-primary">
                            Filtros
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        Recorte a lista de grupos pela situação da matrícula de
                        quem está neles.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody className="gap-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filtro-grupos-pendencia"
                                checked={rascunho.somenteComPendencia}
                                onCheckedChange={(marcado) =>
                                    setRascunho({
                                        ...rascunho,
                                        somenteComPendencia: marcado,
                                    })
                                }
                            />
                            <Label htmlFor="filtro-grupos-pendencia">
                                Somente grupos com matrícula vencida
                            </Label>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs">
                            Um grupo com alguém de matrícula vencida não pode
                            ser inscrito inteiro — é a lista do que precisa
                            renovar antes.
                        </p>
                    </div>

                    <ExpandableDialogFooter className="border-t pt-4">
                        <Button type="button" variant="ghost" onClick={limpar}>
                            Limpar
                        </Button>
                        <Button type="button" onClick={aplicar}>
                            Aplicar filtros
                        </Button>
                    </ExpandableDialogFooter>
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * O funil que viaja do botão para o cabeçalho do modal — o mesmo desenho do
 * diálogo de integrantes, pelos mesmos motivos anotados lá.
 */
function FunilCompartilhado() {
    return (
        <ExpandableDialogIcon className="text-primary size-4 bg-transparent">
            <FunnelIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
