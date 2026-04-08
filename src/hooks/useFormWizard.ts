import {useCallback, useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import type {FieldValues} from 'react-hook-form';
import type {
    StepConfig,
    WizardState,
    WizardNavigationOptions,
    UseFormWizardReturn,
    UseFormWizardOptions,
    GoToOptions,
} from '../types';

export function useFormWizard<T extends FieldValues>({
                                                         steps,
                                                         defaultValues,
                                                         formOptions,
                                                         onStepChange,
                                                     }: UseFormWizardOptions<T>): UseFormWizardReturn<T> {
    if (steps.length === 0) {
        throw new Error('useFormWizard: steps array must not be empty');
    }

    const form = useForm<T>({
        ...formOptions,
        ...(defaultValues !== undefined ? {defaultValues} : {}),
        mode: formOptions?.mode ?? 'onTouched',
    });

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const completedStepsRef = useRef<Set<number>>(new Set<number>());
    const [completedStepsVersion, setCompletedStepsVersion] = useState(0);

    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex] as StepConfig<T>;

    const onStepChangeRef = useRef(onStepChange);
    onStepChangeRef.current = onStepChange;

    const wizardState = useMemo<WizardState>(() => {
        void completedStepsVersion;
        const completedSize = completedStepsRef.current.size;
        return {
            currentStepIndex,
            totalSteps,
            isFirstStep: currentStepIndex === 0,
            isLastStep: currentStepIndex === totalSteps - 1,
            completedSteps: new Set(completedStepsRef.current),
            progress: totalSteps > 1
                ? Math.round((currentStepIndex / (totalSteps - 1)) * 100)
                : 100,
            completionProgress: totalSteps > 0
                ? Math.round((completedSize / totalSteps) * 100)
                : 0,
        };
    }, [currentStepIndex, totalSteps, completedStepsVersion]);

    const next = useCallback(
        async (options: WizardNavigationOptions = {}): Promise<boolean> => {
            const shouldValidate = options.validate !== false;

            if (shouldValidate) {
                const fields = currentStep.fields;
                const valid = await form.trigger(fields as Parameters<typeof form.trigger>[0]);
                if (!valid) return false;
            }

            completedStepsRef.current.add(currentStepIndex);
            setCompletedStepsVersion((v) => v + 1);
            const nextIndex = Math.min(currentStepIndex + 1, totalSteps - 1);
            onStepChangeRef.current?.(currentStepIndex, nextIndex);
            setCurrentStepIndex(nextIndex);
            return true;
        },
        [form, currentStep, currentStepIndex, totalSteps]
    );

    const previous = useCallback(() => {
        const prevIndex = Math.max(currentStepIndex - 1, 0);
        onStepChangeRef.current?.(currentStepIndex, prevIndex);
        setCurrentStepIndex(prevIndex);
    }, [currentStepIndex]);

    const goTo = useCallback(
        async (index: number, options?: GoToOptions): Promise<boolean> => {
            const clamped = Math.max(0, Math.min(index, totalSteps - 1));

            if (options?.validateCurrentStep === true) {
                const fields = currentStep.fields;
                const valid = await form.trigger(fields as Parameters<typeof form.trigger>[0]);
                if (!valid) return false;
            }

            onStepChangeRef.current?.(currentStepIndex, clamped);
            setCurrentStepIndex(clamped);
            return true;
        },
        [form, currentStep, currentStepIndex, totalSteps]
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
