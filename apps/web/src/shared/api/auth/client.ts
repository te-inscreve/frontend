import { createAuthClient } from "better-auth/react";

import { restCredentialsClient } from "@te-inscreve/auth/client";

export const authClient = createAuthClient({
    plugins: [restCredentialsClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
