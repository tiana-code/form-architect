import {useCallback, useRef, useState} from 'react';
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
    const callIdRef = useRef(0);

    const reset = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        callIdRef.current += 1;
        setState(INITIAL_STATE);
    }, []);

    const validate = useCallback(
        (value: T): Promise<true | string> => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            return new Promise<true | string>((resolve) => {
                debounceRef.current = setTimeout(async () => {
                    const callId = ++callIdRef.current;
                    setState({isPending: true, error: null, isValid: null});

                    try {
                        const result = await validator(value);
                        if (callId !== callIdRef.current) return;

                        if (result === true) {
                            setState({isPending: false, error: null, isValid: true});
                            resolve(true);
                        } else {
                            setState({isPending: false, error: result, isValid: false});
                            resolve(result);
                        }
                    } catch (err) {
                        if (callId !== callIdRef.current) return;
                        const message =
                            err instanceof Error ? err.message : 'Validation failed';
                        setState({isPending: false, error: message, isValid: false});
                        resolve(message);
                    }
                }, debounceMs);
            });
        },
        [validator, debounceMs]
    );

    return {validate, state, reset};
}
