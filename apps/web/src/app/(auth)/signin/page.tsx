import Image from "next/image";
import gauchinho from "@/public/assets/gauchinho.png";

export default function SignInPage() {
    return (
        <div className="bg-background flex h-screen w-full items-center justify-center">
            <div className="bg-card flex w-[20rem] flex-col gap-2 rounded-md border px-6 py-4">
                <div className="mb-4 flex items-center gap-2">
                    <Image
                        src={gauchinho}
                        alt="Gauchinho"
                        width={70}
                        height={70}
                    />
                    <h1 className="text-primary text-4xl font-bold">
                        Plantinhas
                    </h1>
                </div>
                {/* <SignIn /> */}
            </div>
        </div>
    );
}
