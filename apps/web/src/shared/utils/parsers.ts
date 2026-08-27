/** Converte um valor para inteiro, se possível. */
function parseInteger(valor: string | string[] | undefined) {
    const bruto = Array.isArray(valor) ? valor[0] : valor;
    const id = Number(bruto);
    return Number.isInteger(id) && id > 0 ? id : undefined;
}

export { parseInteger };
