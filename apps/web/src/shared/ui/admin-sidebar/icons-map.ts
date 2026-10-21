"use client";

import type { Icon } from "@phosphor-icons/react";
import {
    BuildingsIcon,
    CalendarDotsIcon,
    ClipboardTextIcon,
    TelevisionIcon,
    TextboxIcon,
    TicketIcon,
    TrophyIcon,
    UserIcon,
    UsersFourIcon,
} from "@phosphor-icons/react";

const iconsMap = {
    buildings: BuildingsIcon,
    calendar: CalendarDotsIcon,
    group: UsersFourIcon,
    ticket: TicketIcon,
    trophy: TrophyIcon,
    user: UserIcon,
    tv: TelevisionIcon,
    ficha: ClipboardTextIcon,
    field: TextboxIcon,
};

export type IconName = keyof typeof iconsMap;

interface Props {
    iconName: IconName;
    render: (IconComponent: Icon) => React.ReactNode;
}
export function DynamicIcon({ iconName, render }: Props) {
    return render(iconsMap[iconName]);
}
