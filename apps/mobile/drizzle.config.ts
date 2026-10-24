import { defineConfig } from "drizzle-kit";

// Gera as migrações do banco local em `drizzle/`, que o app aplica ao abrir
// (`src/db/cliente.ts`). O driver `expo` gera também o `migrations.js` que
// as importa para o bundle.
//
// O drizzle-kit fica na raiz do monorepo e procura o `drizzle-orm` a partir
// de lá; o do app não sobe, porque depende do React do mobile. Por isso a
// raiz tem o `drizzle-orm` como devDependency, só para este comando.
export default defineConfig({
    dialect: "sqlite",
    driver: "expo",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
});
