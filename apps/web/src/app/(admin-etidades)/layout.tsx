export default function AdminEntidadesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="bg-background relative min-h-screen">{children}</main>
    );
}
