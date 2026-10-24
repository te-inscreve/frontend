// As migrações do Drizzle são arquivos `.sql` importados pelo
// `drizzle/migrations.js`: o plugin os embute no bundle como texto.
/** @type {import('@babel/core').ConfigFunction} */
module.exports = (api) => {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [["inline-import", { extensions: [".sql"] }]],
    };
};
