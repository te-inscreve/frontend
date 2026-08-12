import { useEffect, useState } from 'react';

/**
 * Hook para debouncing um valor.
 *
 * Este hook retorna um valor que é atualizado após um atraso especificado,
 * evitando atualizações excessivas durante a digitação ou mudanças rápidas.
 *
 * @param value O valor a ser debounced.
 * @param delay O tempo de espera em milissegundos antes de atualizar o valor.
 * @return O valor debounced.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
