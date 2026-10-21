import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useUnstableNativeVariable } from "nativewind";

import { queryClient } from "~/utils/api";

import "../styles.css";

export default function RootLayout() {
    const background = useUnstableNativeVariable("--background") as
        | string
        | undefined;

    return (
        <QueryClientProvider client={queryClient}>
            <Stack
                screenOptions={{
                    contentStyle: { backgroundColor: background },
                }}
            />
            <StatusBar />
        </QueryClientProvider>
    );
}
