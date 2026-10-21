import type { ClassValue } from "class-variance-authority/types";
import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, letting later classes win over earlier ones. */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs));
