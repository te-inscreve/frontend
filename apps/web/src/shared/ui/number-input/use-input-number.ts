import type { ChangeEvent } from "react";
import { useMemo } from "react";

interface Props {
    value: number | null | undefined;
    emptyValue?: null | undefined;
    minNumber?: number;
    maxNumber?: number;
    onChange: (value: number | null | undefined) => void;
    step?: number;
}

export function useInputCounter({
    value,
    onChange,
    step = 1,
    emptyValue,
    minNumber = 1,
    maxNumber,
}: Props) {
    const numericValue =
        typeof value === "number" && Number.isFinite(value) ? value : null;
    const result = useMemo(
        () => ({
            handleChange: (event: ChangeEvent<HTMLInputElement>) => {
                const digits = event.target.value.replace(/\D/g, "");

                if (digits === "") {
                    onChange(emptyValue);
                    return;
                }

                const parsed = Number.parseInt(digits, 10);
                if (parsed < minNumber) {
                    onChange(emptyValue);
                    return;
                }

                onChange(
                    maxNumber === undefined
                        ? parsed
                        : Math.min(parsed, maxNumber),
                );
            },
            increment: () => {
                const nextValue =
                    numericValue === null
                        ? minNumber
                        : Math.max(minNumber, numericValue + step);
                onChange(
                    maxNumber === undefined
                        ? nextValue
                        : Math.min(nextValue, maxNumber),
                );
            },
            decrement: () => {
                if (numericValue === null || numericValue - step < minNumber) {
                    onChange(emptyValue);
                    return;
                }

                onChange(numericValue - step);
            },
        }),
        [emptyValue, maxNumber, minNumber, numericValue, onChange, step],
    );

    return {
        ...result,
        numericValue,
        atMaximum:
            maxNumber !== undefined &&
            numericValue !== null &&
            numericValue >= maxNumber,
    };
}
