"use client";

import { useEffect, useState } from "react";

type ScrollDivRef = React.RefObject<HTMLDivElement | null>;

interface TabsControllerProps {
    scrollDivRef: ScrollDivRef;
    defaultCanScrollRight?: boolean;
    defaultCanScrollLeft?: boolean;
}

/**
 * Hook com funcionalidades para controlar o scroll de uma lista horizontal:
 * - Se possui mais conteúdo na direita.
 * - Se possui mais conteúdo na esquerda.
 * - A funcionalidade de rolar o conteúdo.
 */
export function useHorizontalScroll({
    scrollDivRef,
    defaultCanScrollRight,
    defaultCanScrollLeft,
}: TabsControllerProps) {
    const [canScrollRight, setCanScrollRight] = useState(
        !!defaultCanScrollRight,
    );
    const [canScrollLeft, setCanScrollLeft] = useState(!!defaultCanScrollLeft);

    const setScrollLeft = (scrollStep = 200) => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollBy({
                left: Math.abs(scrollStep),
                behavior: "smooth",
            });
        }
    };
    const setScrollRight = (scrollStep = 200) => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollBy({
                left: -Math.abs(scrollStep),
                behavior: "smooth",
            });
        }
    };

    const onScroll = (refCurrent: HTMLDivElement) => {
        const scrollRight =
            refCurrent.scrollWidth -
            refCurrent.clientWidth -
            refCurrent.scrollLeft;
        setCanScrollRight(scrollRight > 0);
        setCanScrollLeft(refCurrent.scrollLeft > 0);
    };

    useEffect(() => {
        const element = scrollDivRef.current;
        if (element) {
            const boundOnScroll = onScroll.bind(null, element);

            element.addEventListener("scroll", boundOnScroll);
            window.addEventListener("resize", boundOnScroll);

            onScroll(element);
            return () => {
                element.removeEventListener("scroll", boundOnScroll);
                window.removeEventListener("resize", boundOnScroll);
            };
        }
    }, [scrollDivRef]);

    return {
        canScrollRight,
        canScrollLeft,
        scrollRight: setScrollRight,
        scrollLeft: setScrollLeft,
    };
}
