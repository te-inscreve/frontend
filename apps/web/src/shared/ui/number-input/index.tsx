"use client";

import type { FocusEventHandler, Ref } from "react";
import { forwardRef } from "react";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { cn } from "@te-inscreve/components/utils";

import styles from "./input-number.module.css";
import { useInputCounter } from "./use-input-number";

interface InputCounterProps {
    value: number | null | undefined;
    onChange: (value: number | null | undefined) => void;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    disabled?: boolean;
    placeholder?: string;
    suffix?: string;
    step?: number;
    min?: number;
    max?: number;
    emptyValue?: null | undefined;
    className?: string;
    id?: string;
    name?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    "aria-labelledby"?: string;
    "data-invalid"?: boolean;
}

export const NumberInput = forwardRef(function NumberInput(
    {
        value,
        onChange,
        onBlur,
        disabled = false,
        placeholder = "—",
        suffix = "",
        step = 1,
        min = 1,
        max,
        emptyValue = null,
        className,
        id,
        name,
        "aria-invalid": ariaInvalid,
        "aria-describedby": ariaDescribedBy,
        "aria-labelledby": ariaLabelledBy,
        "data-invalid": dataInvalid,
    }: InputCounterProps,
    ref: Ref<HTMLInputElement>,
) {
    const { decrement, increment, handleChange, atMaximum, numericValue } =
        useInputCounter({
            value: value,
            onChange,
            step,
            emptyValue,
            minNumber: min,
            maxNumber: max,
        });

    const displayValue =
        numericValue === null ? "" : `${numericValue}${suffix}`;

    return (
        <div
            className={cn(
                "border-input bg-card focus-within:border-ring focus-within:ring-ring/50 data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/20 dark:data-[invalid=true]:ring-destructive/40 flex h-10 w-full items-center overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]",
                className,
            )}
            data-invalid={dataInvalid ?? ariaInvalid}
        >
            <button
                type="button"
                disabled={disabled || numericValue === null}
                className="hover:bg-accent flex h-full shrink-0 cursor-pointer items-center justify-center border-r px-3 disabled:pointer-events-none disabled:opacity-50"
                onClick={decrement}
                aria-label="Diminuir valor"
            >
                <MinusIcon aria-hidden="true" />
            </button>
            <input
                ref={ref}
                id={id}
                name={name}
                className={cn(
                    styles.numberInput,
                    "placeholder:text-muted-foreground h-full min-w-0 flex-1 border-none bg-transparent px-2 text-center text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
                )}
                placeholder={placeholder}
                inputMode="numeric"
                type="text"
                onFocus={(event) => event.currentTarget.select()}
                value={displayValue}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={ariaInvalid}
                aria-describedby={ariaDescribedBy}
                aria-labelledby={ariaLabelledBy}
            />
            <button
                type="button"
                disabled={disabled || atMaximum}
                className="hover:bg-accent flex h-full shrink-0 cursor-pointer items-center justify-center border-l px-3 disabled:pointer-events-none disabled:opacity-50"
                onClick={increment}
                aria-label="Aumentar valor"
            >
                <PlusIcon aria-hidden="true" />
            </button>
        </div>
    );
});
