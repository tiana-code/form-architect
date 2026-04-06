import {FormProvider} from 'react-hook-form';
import type {DefaultValues, FieldValues} from 'react-hook-form';
import {useFormWizard} from '../hooks/useFormWizard.js';
import type {FormWizardProps} from '../types';

export function FormWizard<T extends FieldValues>({
                                                      steps,
                                                      defaultValues,
                                                      onSubmit,
                                                      children,
                                                      className,
                                                  }: FormWizardProps<T>) {
    const ctx = useFormWizard<T>({steps, defaultValues: defaultValues as DefaultValues<T> | undefined});

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
