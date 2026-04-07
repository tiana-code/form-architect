import {FormProvider} from 'react-hook-form';
import type {FieldValues} from 'react-hook-form';
import {useFormWizard} from '../hooks/useFormWizard.js';
import type {FormWizardProps} from '../types';

export function FormWizard<T extends FieldValues>({
                                                      steps,
                                                      defaultValues,
                                                      onSubmit,
                                                      children,
                                                      className,
                                                  }: FormWizardProps<T>) {
    const ctx = useFormWizard<T>({steps, defaultValues});

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
