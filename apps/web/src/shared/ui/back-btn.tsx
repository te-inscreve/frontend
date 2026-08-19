import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

import { Button } from "@te-inscreve/components/components/button";

interface Props {
    href: string;
}

export function GoBackButton({ href }: Props) {
    return (
        <Link href={href}>
            <Button variant="ghost" size="sm" className="cursor-pointer">
                <ArrowLeftIcon size={18} weight="regular" />
                <span className="text-sm font-medium">Voltar</span>
            </Button>
        </Link>
    );
}
