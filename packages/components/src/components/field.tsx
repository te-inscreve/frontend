import type * as React from "react";

import { cn } from "../index";
import { Label } from "./label";

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

export { Field, FieldError, FieldGroup, FieldLabel };
