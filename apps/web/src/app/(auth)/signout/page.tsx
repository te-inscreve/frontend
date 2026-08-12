"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "~/shared/api/auth/client";

export default function SignOutPage() {
    const router = useRouter();

    useEffect(() => {
        void signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.replace("/signin");
                },
            },
        });
    }, [router]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <p className="shimmer text-center text-lg font-semibold">
                Saindo...
            </p>
        </div>
    );
}
