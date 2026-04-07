import {useCallback, useEffect, useRef, useState} from 'react';
import type {AsyncValidationState, AsyncValidatorFn} from '../types';

interface UseAsyncValidationReturn<T> {
    validate: (value: T) => Promise<true | string>;
    state: AsyncValidationState;
    reset: () => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

const INITIAL_STATE: AsyncValidationState = {
    isPending: false,
    error: null,
    isValid: null,
};

export function useAsyncValidation<T>(
    validator: AsyncValidatorFn<T>,
    debounceMs = DEFAULT_DEBOUNCE_MS
): UseAsyncValidationReturn<T> {
    const [state, setState] = useState<AsyncValidationState>(INITIAL_STATE);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const pendingResolveRef = useRef<((v: true | string) => void) | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
            pendingResolveRef.current?.('Validation cancelled');
        };
    }, []);

    const reset = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        abortRef.current?.abort();
        abortRef.current = null;
        pendingResolveRef.current?.('Validation cancelled');
        pendingResolveRef.current = null;
        setState(INITIAL_STATE);
    }, []);

    const validate = useCallback(
        (value: T): Promise<true | string> => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
            pendingResolveRef.current?.('Validation cancelled');

            return new Promise<true | string>((resolve) => {
                pendingResolveRef.current = resolve;

                debounceRef.current = setTimeout(async () => {
                    const controller = new AbortController();
                    abortRef.current = controller;

                    if (!mountedRef.current) {
                        resolve('Validation cancelled');
                        return;
                    }
                    setState({isPending: true, error: null, isValid: null});

                    try {
                        const result = await validator(value, controller.signal);
                        if (controller.signal.aborted || !mountedRef.current) return;

                        if (result === true) {
                            setState({isPending: false, error: null, isValid: true});
                        } else {
                            setState({isPending: false, error: result, isValid: false});
                        }
                        pendingResolveRef.current = null;
                        resolve(result);
                    } catch (err) {
                        if (controller.signal.aborted || !mountedRef.current) return;
                        const message =
                            err instanceof Error ? err.message : 'Validation failed';
                        setState({isPending: false, error: message, isValid: false});
                        pendingResolveRef.current = null;
                        resolve(message);
                    }
                }, debounceMs);
            });
        },
        [validator, debounceMs]
    );

    return {validate, state, reset};
}
