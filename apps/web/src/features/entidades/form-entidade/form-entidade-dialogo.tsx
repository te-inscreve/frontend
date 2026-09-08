"use client";

import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";

import type { MinhaEntidade } from "@te-inscreve/schemas";
import {
    Button,
    ExpandableDialogClose,
    ExpandableDialogFooter,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import { CamposEntidade } from "./campos-entidade";
import { useFormEntidade } from "./use-form-entidade";

interface Props {
    entidade: MinhaEntidade;
    onSalva: () => void;
}

/**
 * O formulário do cadastro da entidade dentro do modal.
 *
 * Sem cabeçalho nem `Card`: quem dá título e contexto é o próprio modal.
 */
export function FormEntidadeDialogo({ entidade, onSalva }: Props) {
    const router = useRouter();

    const { form, salvamento, salvar, erro } = useFormEntidade({
        entidade,
        onSuccess: () => {
            onSalva();
            // O cabeçalho do painel é montado no servidor, então invalidar o
            // cache do cliente não basta para ele repintar.
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
                <CamposEntidade />

                {erro && (
                    <p role="alert" className="text-destructive text-sm">
                        Não foi possível salvar a entidade. Revise os dados e
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
                        {salvando ? "Salvando…" : "Salvar alterações"}
                    </Button>
                </ExpandableDialogFooter>
            </form>
        </FormProvider>
    );
}
