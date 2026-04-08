import {describe, expect, it, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useFormWizard} from '../src';
import type {StepConfig} from '../src';

interface FormData {
    name: string;
    email: string;
    city: string;
    zip: string;
}

const steps: StepConfig<FormData>[] = [
    {id: 'step1', title: 'Personal Info', fields: ['name', 'email']},
    {id: 'step2', title: 'Address', fields: ['city', 'zip']},
    {id: 'step3', title: 'Review', fields: []},
];

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

    it('goTo navigates to any step index', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.goTo(2);
        });
        expect(result.current.wizardState.currentStepIndex).toBe(2);
    });

    it('goTo clamps to valid range', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.goTo(99);
        });
        expect(result.current.wizardState.currentStepIndex).toBe(2);
        await act(async () => {
            await result.current.goTo(-5);
        });
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('does not advance past last step', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.goTo(2);
        });
        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.currentStepIndex).toBe(2);
    });

    it('isLastStep is true on last step', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        await act(async () => {
            await result.current.goTo(2);
        });
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

    it('currentStep reflects the active step config', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );
        expect(result.current.currentStep.id).toBe('step1');
        await act(async () => {
            await result.current.goTo(1);
        });
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

    it('next() does not advance when current step has invalid required field', async () => {
        interface StrictForm {
            username: string;
            bio: string;
        }

        const strictSteps: StepConfig<StrictForm>[] = [
            {id: 's1', title: 'Step 1', fields: ['username']},
            {id: 's2', title: 'Step 2', fields: ['bio']},
        ];
        const {result} = renderHook(() =>
            useFormWizard<StrictForm>({
                steps: strictSteps,
                defaultValues: {username: '', bio: ''},
            })
        );

        result.current.form.register('username', {required: 'Username is required'});

        let advanced = false;
        await act(async () => {
            advanced = await result.current.next();
        });

        expect(advanced).toBe(false);
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('goTo with validateCurrentStep: true blocks on invalid step', async () => {
        interface StrictForm {
            username: string;
            bio: string;
        }

        const strictSteps: StepConfig<StrictForm>[] = [
            {id: 's1', title: 'Step 1', fields: ['username']},
            {id: 's2', title: 'Step 2', fields: ['bio']},
        ];
        const {result} = renderHook(() =>
            useFormWizard<StrictForm>({
                steps: strictSteps,
                defaultValues: {username: '', bio: ''},
            })
        );

        result.current.form.register('username', {required: 'Username is required'});

        let jumped: boolean | void = false;
        await act(async () => {
            jumped = await result.current.goTo(1, {validateCurrentStep: true});
        });

        expect(jumped).toBe(false);
        expect(result.current.wizardState.currentStepIndex).toBe(0);
    });

    it('onStepChange callback is called on navigation', async () => {
        const onStepChange = vi.fn();
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps, onStepChange})
        );

        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(onStepChange).toHaveBeenCalledWith(0, 1);

        act(() => result.current.previous());
        expect(onStepChange).toHaveBeenCalledWith(1, 0);

        await act(async () => {
            await result.current.goTo(2);
        });
        expect(onStepChange).toHaveBeenCalledWith(0, 2);
    });

    it('completionProgress reflects completed steps', async () => {
        const {result} = renderHook(() =>
            useFormWizard<FormData>({steps})
        );

        expect(result.current.wizardState.completionProgress).toBe(0);

        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.completionProgress).toBe(33);

        await act(async () => {
            await result.current.next({validate: false});
        });
        expect(result.current.wizardState.completionProgress).toBe(67);
    });
});
