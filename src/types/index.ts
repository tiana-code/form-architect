import type {FieldValues, UseFormReturn, RegisterOptions, Path, DefaultValues} from 'react-hook-form';

export interface StepConfig<T extends FieldValues = FieldValues> {
    id: string;
    title: string;
    description?: string;
    fields: Path<T>[];
}

export type ConditionOperator =
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'includes'
    | 'truthy'
    | 'falsy';

export interface FieldCondition<T extends FieldValues = FieldValues> {
    watchField: Path<T>;
    operator: ConditionOperator;
    value?: unknown;
}

export type AsyncValidatorFn<T = unknown> = (
    value: T,
    signal: AbortSignal
) => Promise<true | string>;

export interface AsyncValidationState {
    isPending: boolean;
    error: string | null;
    isValid: boolean | null;
}

export interface WizardNavigationOptions {
    validate?: boolean;
}

export interface WizardState {
    currentStepIndex: number;
    totalSteps: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    completedSteps: Set<number>;
    progress: number;
}

export interface UseFormWizardReturn<T extends FieldValues> {
    form: UseFormReturn<T>;
    wizardState: WizardState;
    steps: StepConfig<T>[];
    currentStep: StepConfig<T>;
    next: (options?: WizardNavigationOptions) => Promise<boolean>;
    previous: () => void;
    goTo: (index: number) => void;
    reset: () => void;
    handleSubmit: (
        onValid: (data: T) => void | Promise<void>
    ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface FormWizardProps<T extends FieldValues> {
    steps: StepConfig<T>[];
    defaultValues?: DefaultValues<T>;
    onSubmit: (data: T) => void | Promise<void>;
    children: (ctx: UseFormWizardReturn<T>) => React.ReactNode;
    className?: string;
}

export interface FormStepProps extends React.HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export interface ConditionalFieldProps {
    condition: FieldCondition | FieldCondition[];
    allOf?: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export type {FieldValues, RegisterOptions, Path, DefaultValues};
