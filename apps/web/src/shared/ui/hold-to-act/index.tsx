"use client";

import type { VariantProps } from "class-variance-authority";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { cva } from "class-variance-authority";

import type { UseHoldingParams } from "./use-holding";
import styles from "./styles.module.css";
import { useHolding } from "./use-holding";

const holdVariants = cva("", {
    variants: {
        color: {
            primary:
                "data-[stage=idle]:bg-primary/15 data-[stage=idle]:text-primary bg-primary text-primary-foreground",
            destructive:
                "data-[stage=idle]:bg-destructive-foreground data-[stage=idle]:text-destructive bg-destructive text-destructive-foreground data-[stage=idle]:hover:bg-destructive/15",
            success:
                "bg-green-700 text-green-100 data-[stage=idle]:bg-green-100 data-[stage=idle]:text-green-700",
            solid: "data-[stage=idle]:bg-foreground/15 data-[stage=idle]:text-foreground bg-foreground text-card",
        },
    },
    defaultVariants: {
        color: "primary",
    },
});

type Props = UseHoldingParams &
    VariantProps<typeof holdVariants> & {
        text?: {
            idle?: string;
            pending?: string;
            completed?: string;
        };
    };

export function HoldToAct(props: Props) {
    const { elementRef, stage, holdDuration } = useHolding<HTMLButtonElement>({
        onComplete: props.onComplete,
        holdDuration: props.holdDuration,
        completedDuration: props.completedDuration,
    });

    return (
        <button
            type="button"
            className={`${styles.holdToDelete} h-fit w-full`}
            ref={elementRef}
            data-stage={stage}
            disabled={stage === "completed" || stage === "pending"}
            style={{
                ["--hold-duration" as string]: `${holdDuration}ms`,
            }}
        >
            <div
                className={`${styles.idle} ${holdVariants({ color: props.color })} focus-visible:ring-ring/50 focus-visible:outline-ring flex items-center justify-center gap-2 rounded-lg p-2 text-sm font-semibold select-none focus-visible:outline-1`}
                data-stage={"idle"}
            >
                {props.text?.idle ?? "Idle"}
            </div>
            <div
                // Camada puramente visual: repete os mesmos rótulos da camada
                // `idle`, então fica fora da árvore de acessibilidade para o
                // botão não ser lido quatro vezes.
                aria-hidden="true"
                className={`${styles.holding} ${holdVariants({ color: props.color })} rounded-lg p-2 text-sm font-semibold`}
                data-stage={stage === "idle" ? "holding" : stage}
            >
                <span
                    className={` ${styles.completedText} flex items-center justify-center gap-2`}
                >
                    <CheckIcon aria-hidden="true" className="size-5" />
                    {props.text?.completed ?? "Completed"}
                </span>
                <span
                    className={` ${styles.pendingText} flex items-center justify-center gap-2`}
                >
                    <SpinnerGapIcon
                        aria-hidden="true"
                        className="size-5 animate-spin"
                    />
                    {props.text?.pending ?? "Pending..."}
                </span>
                <span
                    className={` ${styles.holdingText} flex items-center justify-center gap-2`}
                >
                    {props.text?.idle ?? "Holding"}
                </span>
            </div>
        </button>
    );
}
