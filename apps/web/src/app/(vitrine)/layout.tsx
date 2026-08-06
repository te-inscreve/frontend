import { IconProvider } from "~/shared/ui/icon-provider";

export default function VitrineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <IconProvider>
            <main className="bg-background relative min-h-screen">
                {children}
            </main>
        </IconProvider>
    );
}
