import {describe, expect, it, vi} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {useAsyncValidation} from '../src';
import type {AsyncValidatorFn} from '../src';

describe('useAsyncValidation', () => {
    it('starts with initial state', () => {
        const validator: AsyncValidatorFn<string> = async () => true;
        const {result} = renderHook(() => useAsyncValidation(validator, 0));
        expect(result.current.state.isPending).toBe(false);
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.isValid).toBeNull();
    });

    it('returns true for a passing validator', async () => {
        const validator: AsyncValidatorFn<string> = async () => true;
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: true | string = '';
        await act(async () => {
            resolved = await result.current.validate('hello');
        });

        expect(resolved).toBe(true);
        expect(result.current.state.isValid).toBe(true);
        expect(result.current.state.isPending).toBe(false);
        expect(result.current.state.error).toBeNull();
    });

    it('returns error string for a failing validator', async () => {
        const validator: AsyncValidatorFn<string> = async () => 'Email already taken';
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: true | string = '';
        await act(async () => {
            resolved = await result.current.validate('test@example.com');
        });

        expect(resolved).toBe('Email already taken');
        expect(result.current.state.isValid).toBe(false);
        expect(result.current.state.error).toBe('Email already taken');
    });

    it('captures thrown errors as error string', async () => {
        const validator: AsyncValidatorFn<string> = async () => {
            throw new Error('Network error');
        };
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        let resolved: true | string = '';
        await act(async () => {
            resolved = await result.current.validate('x');
        });

        expect(resolved).toBe('Network error');
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

    it('calls validator with the provided value', async () => {
        const validator = vi.fn(async (_v: string) => true as const);
        const {result} = renderHook(() => useAsyncValidation(validator, 0));

        await act(async () => {
            await result.current.validate('test-value');
        });

        expect(validator).toHaveBeenCalledWith('test-value');
    });

    it('debounces rapid calls and only executes the last one', async () => {
        const validator = vi.fn(async (_v: string) => true as const);
        const {result} = renderHook(() => useAsyncValidation(validator, 50));

        act(() => {
            void result.current.validate('a');
            void result.current.validate('ab');
            void result.current.validate('abc');
        });

        await waitFor(() => expect(result.current.state.isValid).toBe(true));

        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith('abc');
    });
});
