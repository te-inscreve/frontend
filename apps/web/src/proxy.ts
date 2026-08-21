import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "./shared/api/auth/server";

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
    const _headers = await headers();
    const session = await auth.api.getSession({
        headers: _headers,
    });
    if (!session) {
        return NextResponse.redirect(
            new URL(`/signin?next=${request.nextUrl.pathname}`, request.url),
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/perfil/:path*"],
};
