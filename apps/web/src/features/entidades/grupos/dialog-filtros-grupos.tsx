"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { Controller, useForm } from "react-hook-form";

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

import type { FiltrosGrupos } from "./filtros-grupos-schema";
import type { FiltrosGruposForm } from "./use-filtros-grupos";
import {
    filtrosGruposAvancadosAtivos,
    filtrosGruposVazios,
} from "./filtros-grupos";
import { filtrosGruposSchema } from "./filtros-grupos-schema";

interface Props {
    /** O recorte em uso, que o "Aplicar" substitui. */
    filtros: FiltrosGruposForm;
}

/**
 * Os filtros de grupo que não cabem na barra.
 *
 * É o esqueleto do diálogo — a cópia enxuta de `dialog-filtros.tsx`, dos
 * integrantes, com um recorte só: a pendência de matrícula. Os demais
 * (tamanho da formação, faixa de idade da formação) entram aqui quando o
 * backend os expuser; a casca — o formulário de rascunho, Limpar, Aplicar,
 * morph a partir do botão — já é a definitiva.
 *
 * O rascunho é um formulário próprio e só substitui o recorte em uso no
 * "Aplicar", pelo mesmo motivo do diálogo de integrantes: a lista está atrás
 * do overlay, e filtrar a cada clique não mostraria nada a quem escolhe.
 *
 * O `id` do `ExpandableDialog` é próprio ("filtros-grupos") porque a aba de
 * integrantes da mesma tela usa o diálogo original, com "filtros-integrantes":
 * só uma aba está montada por vez, mas dois morphs com o mesmo id no mesmo
 * `MotionConfig` seriam o mesmo elemento para o Motion.
 */
export function DialogFiltrosGrupos({ filtros }: Props) {
    const [aberto, setAberto] = useState(false);
    const rascunho = useForm<FiltrosGrupos>({
        resolver: zodResolver(filtrosGruposSchema),
        defaultValues: filtrosGruposVazios,
    });

    const ativos = filtrosGruposAvancadosAtivos(filtros.valores);

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura: assim o diálogo
        // não guarda escolhas que a pessoa abandonou da última vez.
        if (proximo) rascunho.reset(filtros.form.getValues());
        setAberto(proximo);
    };

    const aplicar = rascunho.handleSubmit((valores) => {
        filtros.form.reset(valores);
        setAberto(false);
    });

    const limpar = () =>
        rascunho.reset({ ...rascunho.getValues(), somenteComPendencia: false });

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

                {/* `contents` pelo motivo anotado em `dialog-filtros.tsx`. */}
                <ExpandableDialogBody className="gap-5">
                    <form noValidate onSubmit={aplicar} className="contents">
                        <div>
                            <Controller
                                control={rascunho.control}
                                name="somenteComPendencia"
                                render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="filtro-grupos-pendencia"
                                            name={field.name}
                                            ref={field.ref}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            onBlur={field.onBlur}
                                        />
                                        <Label htmlFor="filtro-grupos-pendencia">
                                            Somente grupos com matrícula vencida
                                        </Label>
                                    </div>
                                )}
                            />
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                Um grupo com alguém de matrícula vencida não
                                pode ser inscrito inteiro — é a lista do que
                                precisa renovar antes.
                            </p>
                        </div>

                        <ExpandableDialogFooter className="border-t pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={limpar}
                            >
                                Limpar
                            </Button>
                            <Button type="submit">Aplicar filtros</Button>
                        </ExpandableDialogFooter>
                    </form>
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
