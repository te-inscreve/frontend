import { Redirect } from "expo-router";

// `/` não é uma aba: quem entra cai em Categorias.
export default function Index() {
    return <Redirect href="/categorias" />;
}
