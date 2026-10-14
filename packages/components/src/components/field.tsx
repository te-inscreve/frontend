"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";
import * as React from "react";
import { useContext } from "react";
import { FormProvider, useFormContext } from "react-hook-form";

import { cn } from "../utils";
import { Label } from "./label";

// Context estendido para incluir referência do formulário
interface ExtendedFormContextValue {
    formRef?: React.RefObject<HTMLFormElement | null>;
    submitForm?: () => void;
}

const ExtendedFormContext = React.createContext<ExtendedFormContextValue>({});

// Hook para acessar o contexto estendido do formulário
function useExtendedFormContext<TFieldValues extends FieldValues>() {
    const superContext = useFormContext<TFieldValues>();
    const extendedContext = useContext(ExtendedFormContext);
    return { ...superContext, ...extendedContext };
}

// Wrapper do FormProvider que inclui funcionalidades extras
type ExtendedFormProps<TFieldValues extends FieldValues = FieldValues> =
    UseFormReturn<TFieldValues> & {
        children: React.ReactNode;
        formRef?: React.RefObject<HTMLFormElement | null>;
    };

const ExtendedFormProvider = <TFieldValues extends FieldValues = FieldValues>({
    children,
    formRef,
    ...form
}: ExtendedFormProps<TFieldValues>) => {
    const submitForm = React.useCallback(() => {
        formRef?.current?.requestSubmit();
    }, [formRef]);

    const extendedValue = React.useMemo(
        () => ({
            formRef,
            submitForm,
        }),
        [formRef, submitForm],
    );

    return (
        <ExtendedFormContext.Provider value={extendedValue}>
            <FormProvider {...form}>{children}</FormProvider>
        </ExtendedFormContext.Provider>
    );
};

const Form = ExtendedFormProvider;

type FieldProps = React.ComponentProps<"div"> & {
    orientation?: "vertical" | "horizontal" | "responsive";
};

function Field({ className, orientation = "vertical", ...props }: FieldProps) {
    return (
        <div
            data-slot="field"
            data-orientation={orientation}
            role="group"
            className={cn(
                "group/field flex w-full flex-col gap-2",
                orientation === "horizontal" && "flex-row items-center gap-3",
                orientation === "responsive" &&
                    "flex-col gap-2 @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3",
                className,
            )}
            {...props}
        />
    );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-group"
            className={cn(
                "@container/field-group flex flex-col gap-4",
                className,
            )}
            {...props}
        />
    );
}

function FieldLabel({
    className,
    ...props
}: React.ComponentProps<typeof Label>) {
    return (
        <Label
            data-slot="field-label"
            className={cn(
                "group-data-[invalid=true]/field:text-destructive",
                className,
            )}
            {...props}
        />
    );
}

/**
 * Texto de ajuda do campo: fica abaixo do controle, em 12px, e o controle
 * aponta para ele com `aria-describedby`.
 */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="field-description"
            className={cn("text-muted-foreground text-xs", className)}
            {...props}
        />
    );
}

type FieldErrorProps = React.ComponentProps<"div"> & {
    errors?: ({ message?: string } | undefined)[];
};

function FieldError({
    className,
    children,
    errors,
    ...props
}: FieldErrorProps) {
    const messages = errors
        ?.map((error) => error?.message)
        .filter((message): message is string => Boolean(message));

    if (!children && !messages?.length) {
        return null;
    }

    return (
        <div
            data-slot="field-error"
            role="alert"
            className={cn("text-destructive text-sm", className)}
            {...props}
        >
            {children ?? messages?.join(", ")}
        </div>
    );
}

export {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    Form as FormProvider,
    useExtendedFormContext as useFormContext,
};
