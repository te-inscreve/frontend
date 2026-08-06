"use client";

import { IconContext } from "@phosphor-icons/react";

export function IconProvider(props: { children: React.ReactNode }) {
    return (
        <IconContext.Provider
            value={{
                color: "currentColor",
                size: 32,
                weight: "regular",
                mirrored: false,
            }}
        >
            {props.children}
        </IconContext.Provider>
    );
}
