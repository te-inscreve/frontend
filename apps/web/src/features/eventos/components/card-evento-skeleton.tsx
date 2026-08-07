import { Skeleton } from "@te-inscreve/components/components/skeleton";

export function CardEventoSkeleton() {
    return (
        <li>
            <div className="w-100 animate-pulse cursor-pointer">
                <div className="bg-card flex flex-col gap-2 rounded-md border p-4">
                    <Skeleton className="bg-muted h-6 w-1/2 rounded" />
                    <Skeleton className="bg-muted h-4 w-full rounded" />
                    <Skeleton className="bg-muted h-4 w-full rounded" />
                </div>
            </div>
        </li>
    );
}
