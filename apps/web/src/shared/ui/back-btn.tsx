"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

import { Button } from "@te-inscreve/components/components/button";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
}

export function GoBackButton({ href, ...rest }: Props) {
    const router = useRouter();
    let properties: { asChild?: boolean; onClick?: () => void } = {};

    if (href) {
        properties = {
            asChild: true,
        };
    } else {
        properties = {
            onClick: () => router.back(),
        };
    }
    return (
        <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer"
            {...properties}
            {...rest}
        >
            {href ? (
                <Link href={href}>
                    <Miolo />
                </Link>
            ) : (
                <Miolo />
            )}
        </Button>
    );
}

const Miolo = () => (
    <>
        <ArrowLeftIcon size={18} weight="regular" />
        <span className="text-sm font-medium">Voltar</span>
    </>
);
