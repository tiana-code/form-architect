import {describe, expect, it, vi} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {useAsyncValidation} from '../src';
import type {AsyncValidatorFn, AsyncValidationResult} from '../src';

describe('useAsyncValidation', () => {
    it('starts with initial state', () => {
        const validator: AsyncValidatorFn<string> = async () => true;
        const {result} = renderHook(() => useAsyncValidation(validator, 0));
        expect(result.current.state.isPending).toBe(false);
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.isValid).toBeNull();
    });

    it('returns valid result for a passing validator', async () => {
        const validator: AsyncValidatorFn<string> = async () => true;
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: AsyncValidationResult = {status: 'cancelled'};
        await act(async () => {
            resolved = await result.current.validate('hello');
        });

        expect(resolved).toEqual({status: 'valid'});
        expect(result.current.state.isValid).toBe(true);
        expect(result.current.state.isPending).toBe(false);
        expect(result.current.state.error).toBeNull();
    });

    it('returns invalid result for a failing validator', async () => {
        const validator: AsyncValidatorFn<string> = async () => 'Email already taken';
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: AsyncValidationResult = {status: 'cancelled'};
        await act(async () => {
            resolved = await result.current.validate('test@example.com');
        });

        expect(resolved).toEqual({status: 'invalid', message: 'Email already taken'});
        expect(result.current.state.isValid).toBe(false);
        expect(result.current.state.error).toBe('Email already taken');
    });

    it('captures thrown errors as invalid result', async () => {
        const validator: AsyncValidatorFn<string> = async () => {
            throw new Error('Network error');
        };
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: AsyncValidationResult = {status: 'cancelled'};
        await act(async () => {
            resolved = await result.current.validate('x');
        });

        expect(resolved).toEqual({status: 'invalid', message: 'Network error'});
        expect(result.current.state.error).toBe('Network error');
        expect(result.current.state.isValid).toBe(false);
    });

    it('reset clears state back to initial', async () => {
        const validator: AsyncValidatorFn<string> = async () => 'bad';
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        await act(async () => {
            await result.current.validate('x');
        });

        act(() => result.current.reset());

        expect(result.current.state.isValid).toBeNull();
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.isPending).toBe(false);
    });

    it('calls validator with value and abort signal', async () => {
        const validator = vi.fn(async (_v: string, _signal: AbortSignal) => true as const);
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        await act(async () => {
            await result.current.validate('test-value');
        });

        expect(validator).toHaveBeenCalledWith('test-value', expect.any(AbortSignal));
    });

    it('debounces rapid calls and only executes the last one', async () => {
        const validator = vi.fn(async (_v: string, _signal: AbortSignal) => true as const);
        const {result} = renderHook(() => useAsyncValidation(validator, 50));

        act(() => {
            void result.current.validate('a');
            void result.current.validate('ab');
            void result.current.validate('abc');
        });

        await waitFor(() => expect(result.current.state.isValid).toBe(true));

        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
    });

    it('cancelled validation returns { status: cancelled }, not an error string', async () => {
        type ResolveFn = (v: true | string) => void;
        let resolveValidator: ResolveFn = () => undefined;
        const validator: AsyncValidatorFn<string> = () =>
            new Promise<true | string>((res) => {
                resolveValidator = res;
            });

        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let firstResolved: AsyncValidationResult = {status: 'valid'};
        act(() => {
            void result.current.validate('first').then((r) => {
                firstResolved = r;
            });
        });

        await act(async () => {
            void result.current.validate('second');
        });

        resolveValidator('first result');

        await waitFor(() => {
            expect(firstResolved).toEqual({status: 'cancelled'});
        });
    });

    it('on unmount, pending validation resolves with cancelled status', async () => {
        type ResolveFn = (v: true | string) => void;
        let resolveValidator: ResolveFn = () => undefined;
        const validator: AsyncValidatorFn<string> = () =>
            new Promise<true | string>((res) => {
                resolveValidator = res;
            });

        const {result, unmount} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: AsyncValidationResult = {status: 'valid'};
        act(() => {
            void result.current.validate('test').then((r) => {
                resolved = r;
            });
        });

        unmount();

        resolveValidator(true);

        await waitFor(() => {
            expect(resolved).toEqual({status: 'cancelled'});
        });
    });
});
