import {describe, expect, it, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useFormWizard} from '../src';
import type {StepConfig} from '../src';

const steps: StepConfig[] = [
    {id: 'step1', title: 'Personal Info', fields: ['name', 'email']},
    {id: 'step2', title: 'Address', fields: ['city', 'zip']},
    {id: 'step3', title: 'Review', fields: []},
];

interface FormData {
    name: string;
    email: string;
    city: string;
    zip: string;
}

describe('useFormWizard', () => {
    it('starts at step 0 with correct initial state', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        expect(result.current.wizardState.currentStepIndex).toBe(0);
        expect(result.current.wizardState.totalSteps).toBe(3);
        expect(result.current.wizardState.isFirstStep).toBe(true);
        expect(result.current.wizardState.isLastStep).toBe(false);
        expect(result.current.wizardState.progress).toBe(0);
    });

    it('advances to next step without validation when validate=false', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.currentStepIndex).toBe(1);
    });

    it('marks step as completed when advancing', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.completedSteps.has(0)).toBe(true);
    });

    it('does not go below step 0 when calling previous on first step', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        act(() => result.current.previous());
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('goes back with previous', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.next({validate: false});
        });
        act(() => result.current.previous());
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('goTo navigates to any step index', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        act(() => result.current.goTo(2));
        expect(result.current.wizardState.currentStepIndex).toBe(2);
    });

    it('goTo clamps to valid range', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        act(() => result.current.goTo(99));
        expect(result.current.wizardState.currentStepIndex).toBe(2);
        act(() => result.current.goTo(-5));
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('does not advance past last step', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        act(() => result.current.goTo(2));
        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.currentStepIndex).toBe(2);
    });

    it('isLastStep is true on last step', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        act(() => result.current.goTo(2));
        expect(result.current.wizardState.isLastStep).toBe(true);
    });

    it('reset returns to step 0 and clears completed steps', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.next({validate: false});
        });
        act(() => result.current.reset());
        expect(result.current.wizardState.currentStepIndex).toBe(0);
        expect(result.current.wizardState.completedSteps.size).toBe(0);
    });

    it('currentStep reflects the active step config', () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        expect(result.current.currentStep.id).toBe('step1');
        act(() => result.current.goTo(1));
        expect(result.current.currentStep.id).toBe('step2');
    });

    it('handleSubmit calls onValid with form data', async () => {
        const onValid = vi.fn();
        const {result} = renderHook(() =>
            useFormWizard<FormData>({
                steps,
                defaultValues: {name: 'Alice', email: 'a@b.com', city: 'Oslo', zip: '0001'},
            })
        );
        await act(async () => {
            const submit = result.current.handleSubmit(onValid);
            await submit();
        });
        expect(onValid).toHaveBeenCalledWith(
            expect.objectContaining({name: 'Alice', email: 'a@b.com'})
        );
    });
});
