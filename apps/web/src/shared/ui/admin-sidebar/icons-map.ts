"use client";

import type { Icon } from "@phosphor-icons/react";
import { BuildingsIcon, CalendarDotsIcon } from "@phosphor-icons/react";

const iconsMap = {
    buildings: BuildingsIcon,
    calendar: CalendarDotsIcon,
};

export type IconName = keyof typeof iconsMap;

interface Props {
    iconName: IconName;
    render: (IconComponent: Icon) => React.ReactNode;
}
export function DynamicIcon({ iconName, render }: Props) {
    return render(iconsMap[iconName]);
}
