// O Metro resolve a imagem para o id do asset; `Image` aceita o id direto.
declare module "*.png" {
    import type { ImageSourcePropType } from "react-native";

    const source: ImageSourcePropType;
    export default source;
}

// As migrações do Drizzle, embutidas como texto pelo `inline-import`
// (`babel.config.js`).
declare module "*.sql" {
    const sql: string;
    export default sql;
}
