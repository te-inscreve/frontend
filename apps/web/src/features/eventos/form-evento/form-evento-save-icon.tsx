"use client";

import type { IconInput } from "morphicons";
import checkSvg from "@phosphor-icons/core/assets/bold/check-bold.svg";
import floppyDiskSvg from "@phosphor-icons/core/assets/bold/floppy-disk-bold.svg";
import spinnerGapSvg from "@phosphor-icons/core/assets/bold/spinner-gap-bold.svg";
import { fitIcon } from "morphicons";
import { MorphIcon } from "morphicons/react";

export interface AnimatedIconRenderProps {
    icon: IconInput;
    name: string;
}

const pathFromPhosphorSvg = (svg: string) => {
    const path = /<path[^>]*\sd="([^"]+)"/u.exec(svg)?.[1];

    if (!path) {
        throw new Error("Phosphor SVG does not contain a path");
    }

    return fitIcon(path, 256);
};

const phosphorIcons = {
    "floppy-disk": pathFromPhosphorSvg(floppyDiskSvg as string),
    "spinner-gap": pathFromPhosphorSvg(spinnerGapSvg as string),
    check: pathFromPhosphorSvg(checkSvg as string),
};

type PhosphorIconName = keyof typeof phosphorIcons;

export interface AnimatedIconProps {
    current: PhosphorIconName;
}

export function FormEventoSaveIcon({ current }: AnimatedIconProps) {
    if (!phosphorIcons[current]) {
        throw new Error(`Icon "${current}" not found`);
    }

    const resolveIcon = (name: PhosphorIconName): IconInput => {
        return phosphorIcons[name];
    };

    return (
        <MorphIcon
            icon={resolveIcon(current)}
            size={20}
            fill="currentColor"
            stroke="none"
            aria-hidden="true"
            className={current === "spinner-gap" ? "animate-spin" : undefined}
        />
    );
}
