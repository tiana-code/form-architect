import {useCallback, useEffect, useRef, useState} from 'react';
import type {AsyncValidationState, AsyncValidationResult, AsyncValidatorFn} from '../types';

interface UseAsyncValidationReturn<T> {
    validate: (value: T) => Promise<AsyncValidationResult>;
    state: AsyncValidationState;
    reset: () => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

const INITIAL_STATE: AsyncValidationState = {
    isPending: false,
    result: null,
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
    const pendingResolveRef = useRef<((v: AsyncValidationResult) => void) | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
            pendingResolveRef.current?.({status: 'cancelled'});
        };
    }, []);

    const reset = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        abortRef.current?.abort();
        abortRef.current = null;
        pendingResolveRef.current?.({status: 'cancelled'});
        pendingResolveRef.current = null;
        setState(INITIAL_STATE);
    }, []);

    const validate = useCallback(
        (value: T): Promise<AsyncValidationResult> => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
            pendingResolveRef.current?.({status: 'cancelled'});

            return new Promise<AsyncValidationResult>((resolve) => {
                pendingResolveRef.current = resolve;

                debounceRef.current = setTimeout(async () => {
                    const controller = new AbortController();
                    abortRef.current = controller;

                    if (!mountedRef.current) {
                        resolve({status: 'cancelled'});
                        return;
                    }
                    setState({isPending: true, result: null, error: null, isValid: null});

                    try {
                        const outcome = await validator(value, controller.signal);
                        if (controller.signal.aborted || !mountedRef.current) return;

                        if (outcome === true) {
                            const result: AsyncValidationResult = {status: 'valid'};
                            setState({isPending: false, result, error: null, isValid: true});
                            pendingResolveRef.current = null;
                            resolve(result);
                        } else {
                            const result: AsyncValidationResult = {status: 'invalid', message: outcome};
                            setState({isPending: false, result, error: outcome, isValid: false});
                            pendingResolveRef.current = null;
                            resolve(result);
                        }
                    } catch (err) {
                        if (controller.signal.aborted || !mountedRef.current) return;
                        const message =
                            err instanceof Error ? err.message : 'Validation failed';
                        const result: AsyncValidationResult = {status: 'invalid', message};
                        setState({isPending: false, result, error: message, isValid: false});
                        pendingResolveRef.current = null;
                        resolve(result);
                    }
                }, debounceMs);
            });
        },
        [validator, debounceMs]
    );

    return {validate, state, reset};
}
