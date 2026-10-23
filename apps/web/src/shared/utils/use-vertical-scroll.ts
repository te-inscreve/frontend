import { useEffect, useRef } from "react";

interface UseScrollType {
    // função que será chamada quando o scroll chegar ao final da página
    onScrollEnd?: () => void;
}

/**
 * Hook responsável por detectar quando uma div está no final da página e chamar uma função
 * @param onScrollEnd função que será chamada quando o scroll chegar ao final da página
 */
export function useVerticalScroll({ onScrollEnd }: UseScrollType) {
    const triggerScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const div = triggerScrollRef.current;

        if (!div) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                onScrollEnd?.();
            }
        });

        observer.observe(div);

        return () => {
            observer.disconnect();
        };
    }, [onScrollEnd]);

    return {
        triggerScrollRef,
    };
}
