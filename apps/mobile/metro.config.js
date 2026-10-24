// Learn more: https://docs.expo.dev/guides/monorepos/
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

config.cacheStores = [
    new FileStore({
        root: path.join(__dirname, "node_modules", ".cache", "metro"),
    }),
];

// As migrações do Drizzle (`drizzle/*.sql`) entram no bundle como código.
config.resolver.sourceExts.push("sql");

// O Uniwind precisa ser o último wrapper da config.
/** @type {import('expo/metro-config').MetroConfig} */
module.exports = withUniwindConfig(config, {
    cssEntryFile: "./src/styles.css",
    dtsFile: "./uniwind-types.d.ts",
});
