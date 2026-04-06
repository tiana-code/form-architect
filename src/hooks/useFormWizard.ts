import {useCallback, useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import type {FieldValues, DefaultValues} from 'react-hook-form';
import type {
    StepConfig,
    WizardState,
    WizardNavigationOptions,
    UseFormWizardReturn,
} from '../types';

interface UseFormWizardOptions<T extends FieldValues> {
    steps: StepConfig[];
    defaultValues?: DefaultValues<T>;
}

export function useFormWizard<T extends FieldValues>({
                                                         steps,
                                                         defaultValues,
                                                     }: UseFormWizardOptions<T>): UseFormWizardReturn<T> {
    const form = useForm<T>({defaultValues, mode: 'onTouched'});

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const completedStepsRef = useRef<Set<number>>(new Set<number>());
    const [completedStepsVersion, setCompletedStepsVersion] = useState(0);

    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex] ?? steps[0];

    const wizardState = useMemo<WizardState>(() => {
        void completedStepsVersion;
        return {
            currentStepIndex,
            totalSteps,
            isFirstStep: currentStepIndex === 0,
            isLastStep: currentStepIndex === totalSteps - 1,
            completedSteps: new Set(completedStepsRef.current),
            progress: totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : 0,
        };
    }, [currentStepIndex, totalSteps, completedStepsVersion]);

    const next = useCallback(
        async (options: WizardNavigationOptions = {}): Promise<boolean> => {
            const shouldValidate = options.validate !== false;

            if (shouldValidate) {
                const fields = currentStep?.fields ?? [];
                const valid = await form.trigger(fields as Parameters<typeof form.trigger>[0]);
                if (!valid) return false;
            }

            completedStepsRef.current.add(currentStepIndex);
            setCompletedStepsVersion((v) => v + 1);
            setCurrentStepIndex((idx) => Math.min(idx + 1, totalSteps - 1));
            return true;
        },
        [form, currentStep, currentStepIndex, totalSteps]
    );

    const previous = useCallback(() => {
        setCurrentStepIndex((idx) => Math.max(idx - 1, 0));
    }, []);

    const goTo = useCallback(
        (index: number) => {
            const clamped = Math.max(0, Math.min(index, totalSteps - 1));
            setCurrentStepIndex(clamped);
        },
        [totalSteps]
    );

    const reset = useCallback(() => {
        form.reset(defaultValues as T | undefined);
        setCurrentStepIndex(0);
        completedStepsRef.current = new Set<number>();
        setCompletedStepsVersion((v) => v + 1);
    }, [form, defaultValues]);

    const handleSubmit = useCallback(
        (onValid: (data: T) => void | Promise<void>) =>
            form.handleSubmit(async (data) => {
                await onValid(data);
            }),
        [form]
    );

    return {
        form,
        wizardState,
        steps,
        currentStep,
        next,
        previous,
        goTo,
        reset,
        handleSubmit,
    };
}
