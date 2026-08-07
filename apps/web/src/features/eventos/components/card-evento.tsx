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

export function CardEvento({ evento }: { evento: Evento }) {
    return (
        <li>
            <Link href={`/admin/eventos/${evento.slug}`}>
                <Card className="w-100 cursor-pointer">
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
        </li>
    );
}
