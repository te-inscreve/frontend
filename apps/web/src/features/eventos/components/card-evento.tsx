import Link from "next/link";

import type { Evento } from "@te-inscreve/schemas";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@te-inscreve/components/card";

import { FallbackImage } from "~/shared/ui/fallback-image";

export function CardEvento({ evento }: { evento: Evento }) {
    return (
        <Link href={`/admin/eventos/${evento.slug}`}>
            <Card className="cursor-pointer pt-0 shadow-none">
                <FallbackImage
                    src={evento.cartaz}
                    alt={evento.nome}
                    width={200}
                    height={200}
                    className="h-40 w-full rounded-t-xl object-cover"
                />
                <CardHeader>
                    <CardTitle>{evento.nome}</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                    <CardAction>Card Action</CardAction>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
            </Card>
        </Link>
    );
}
