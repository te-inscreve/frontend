import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../drizzle/migrations";
import * as schema from "./schema";

/*
 * O banco local, aberto uma vez por processo. O `enableChangeListener` é o
 * que faz o `useLiveQuery` do Drizzle refazer a consulta quando uma tabela
 * muda.
 */
const sqlite = openDatabaseSync("te-inscreve.db", {
    enableChangeListener: true,
});

export const db = drizzle(sqlite, { schema });

/**
 * Aplica as migrações pendentes ao abrir o app. Até terminar, nada lê o
 * banco; se falhar, o app para numa tela de erro em vez de seguir com o
 * banco pela metade.
 */
export function useBancoLocal() {
    return useMigrations(db, migrations);
}
