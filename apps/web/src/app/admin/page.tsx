import { permanentRedirect, RedirectType } from "next/navigation";

export default function Page() {
    permanentRedirect("/admin/eventos", RedirectType.replace);
}
