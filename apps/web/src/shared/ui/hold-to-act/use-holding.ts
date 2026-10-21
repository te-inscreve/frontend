"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stages = "idle" | "holding" | "pending" | "completed";

const HOLD_DURATION = 2000; // 2 segundos
const COMPLETED_DURATION = 5000; // 5 segundos

export interface UseHoldingParams {
    onComplete?: () => Promise<void> | void;
    holdDuration?: number;
    completedDuration?: number;
}
export function useHolding<T extends HTMLElement>({
    onComplete,
    holdDuration = HOLD_DURATION,
    completedDuration = COMPLETED_DURATION,
}: UseHoldingParams) {
    const elementRef = useRef<T>(null);
    const [stage, setStage] = useState<Stages>("idle");
    const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const completedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearAllTimeouts = useCallback(() => {
        // Função para limpar todos os timeouts
        if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
        if (completedTimeoutRef.current) {
            clearTimeout(completedTimeoutRef.current);
            completedTimeoutRef.current = null;
        }
    }, []);

    const startHolding = useCallback(() => {
        if (stage !== "idle") return;

        setStage("holding");

        holdTimeoutRef.current = setTimeout(() => {
            // O `setTimeout` espera um retorno `void`, então a parte assíncrona
            // fica em uma função à parte em vez de no próprio callback.
            void (async () => {
                setStage("pending");
                try {
                    await onComplete?.();
                } catch {
                    // Ação que falha volta para `idle`, pronta para outra
                    // tentativa: sem isso o botão travaria em `pending`, e
                    // seguir para `completed` anunciaria um sucesso que não
                    // aconteceu. Quem chama é que mostra o erro.
                    setStage("idle");
                    return;
                }
                setStage("completed");

                completedTimeoutRef.current = setTimeout(() => {
                    setStage("idle");
                }, completedDuration);
            })();
        }, holdDuration);
    }, [stage, onComplete, holdDuration, completedDuration]);

    const stopHolding = useCallback(() => {
        if (stage === "completed" || stage === "pending") return;

        clearAllTimeouts();
        setStage("idle");
    }, [stage, clearAllTimeouts]);

    useEffect(() => {
        // Cleanup em mudanças de stage
        return () => clearAllTimeouts();
    }, [clearAllTimeouts]);

    // Setup dos event listeners
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleStart = (e: Event) => {
            e.preventDefault();
            startHolding();
        };

        const handleStop = () => stopHolding();

        // Mouse events
        element.addEventListener("mousedown", handleStart);
        element.addEventListener("mouseup", handleStop);
        element.addEventListener("mouseleave", handleStop);

        // Touch events
        element.addEventListener("touchstart", handleStart, { passive: false });
        element.addEventListener("touchend", handleStop);
        element.addEventListener("touchcancel", handleStop);

        return () => {
            element.removeEventListener("mousedown", handleStart);
            element.removeEventListener("mouseup", handleStop);
            element.removeEventListener("mouseleave", handleStop);
            element.removeEventListener("touchstart", handleStart);
            element.removeEventListener("touchend", handleStop);
            element.removeEventListener("touchcancel", handleStop);
        };
    }, [startHolding, stopHolding]);

    return {
        elementRef,
        stage,
        isHolding: stage === "holding",
        isCompleted: stage === "completed",
        isIdle: stage === "idle",
        isPending: stage === "pending",
        holdDuration,
    };
}
