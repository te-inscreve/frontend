"use client";

import { IconContext } from "@phosphor-icons/react";

export function IconProvider(props: { children: React.ReactNode }) {
    return (
        <IconContext.Provider
            value={{
                color: "currentColor",
                className: "h-[18px]! w-[18px]!",
                weight: "regular",
                mirrored: false,
            }}
        >
            {props.children}
        </IconContext.Provider>
    );
}
