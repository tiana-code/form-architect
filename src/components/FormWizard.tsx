import {FormProvider} from 'react-hook-form';
import type {FieldValues} from 'react-hook-form';
import {useFormWizard} from '../hooks/useFormWizard.js';
import type {FormWizardProps, UseFormWizardOptions} from '../types';

export function FormWizard<T extends FieldValues>({
    steps,
    defaultValues,
    onSubmit,
    children,
    className,
    formOptions,
    onStepChange,
}: FormWizardProps<T>) {
    const opts: UseFormWizardOptions<T> = {steps};
    if (defaultValues !== undefined) opts.defaultValues = defaultValues;
    if (formOptions !== undefined) opts.formOptions = formOptions;
    if (onStepChange !== undefined) opts.onStepChange = onStepChange;

    const ctx = useFormWizard<T>(opts);

    return (
        <FormProvider {...ctx.form}>
            <form
                className={className}
                onSubmit={ctx.handleSubmit(onSubmit)}
                noValidate
            >
                {children(ctx)}
            </form>
        </FormProvider>
    );
}
