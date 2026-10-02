"use client";

import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";

import type { Categoria } from "@te-inscreve/schemas";
import {
    Button,
    ExpandableDialogClose,
    ExpandableDialogFooter,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { PeriodoEvento } from "./campos-categoria";
import { CamposCategoria } from "./campos-categoria";
import { useFormCategoria } from "./use-form-categoria";

interface Props {
    /** Evento e modalidade donos da categoria — vêm de fora, não do formulário. */
    eventoId: number;
    modalidadeId: number;
    /** Categoria em edição. Ausente quando o diálogo está criando. */
    categoria?: Categoria;
    /** Limita o dia da apresentação aos dias do evento. */
    periodoEvento?: PeriodoEvento;
    onSalva: () => void;
}

/**
 * O formulário de categoria dentro de um diálogo — o mesmo para criar, saindo
 * do atalho da fila, e para editar, saindo do botão do detalhe.
 *
 * Criar e editar divergem só no que `useFormCategoria` já resolve: com
 * `categoria`, os campos nascem preenchidos e o envio vira `update`. Aqui só
 * muda o rótulo do botão.
 *
 * Não tem trilha, cabeçalho fixo nem `Card`: quem dá título e contexto é o
 * próprio modal.
 */
export function FormCategoriaDialogo({
    eventoId,
    modalidadeId,
    categoria,
    periodoEvento,
    onSalva,
}: Props) {
    const router = useRouter();

    const { form, salvamento, salvar, erro } = useFormCategoria({
        eventoId,
        modalidadeId,
        categoria,
        onSuccess: () => {
            onSalva();
            // As telas de categoria são montadas no servidor — a fila em
            // `DetalheModalidade`, o resumo em `DetalheCategoria` —, então
            // invalidar o cache do cliente não basta para elas repintarem.
            router.refresh();
        },
    });

    const salvando = salvamento === "loading";

    return (
        <FormProvider {...form}>
            <form
                noValidate
                onSubmit={form.handleSubmit(salvar)}
                className="flex flex-col gap-4"
            >
                <CamposCategoria periodoEvento={periodoEvento} />

                {erro && (
                    <p role="alert" className="text-destructive text-sm">
                        Não foi possível salvar a categoria. Revise os dados e
                        tente novamente.
                    </p>
                )}

                <ExpandableDialogFooter>
                    <ExpandableDialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancelar
                        </Button>
                    </ExpandableDialogClose>

                    <Button type="submit" disabled={salvando}>
                        {salvando ? (
                            <CircleNotchIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        ) : (
                            <FloppyDiskIcon aria-hidden="true" weight="bold" />
                        )}
                        {salvando
                            ? "Salvando…"
                            : categoria
                              ? "Salvar alterações"
                              : "Salvar"}
                    </Button>
                </ExpandableDialogFooter>
            </form>
        </FormProvider>
    );
}
