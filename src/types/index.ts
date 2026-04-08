import type {FieldValues, UseFormReturn, RegisterOptions, Path, DefaultValues, UseFormProps} from 'react-hook-form';

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

export type AsyncValidationResult =
    | { status: 'valid' }
    | { status: 'invalid'; message: string }
    | { status: 'cancelled' };

export interface AsyncValidationState {
    isPending: boolean;
    result: AsyncValidationResult | null;
    error: string | null;
    isValid: boolean | null;
}

export interface WizardNavigationOptions {
    validate?: boolean;
}

export interface GoToOptions {
    validateCurrentStep?: boolean;
}

export interface WizardState {
    currentStepIndex: number;
    totalSteps: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    completedSteps: Set<number>;
    progress: number;
    completionProgress: number;
}

export interface UseFormWizardReturn<T extends FieldValues> {
    form: UseFormReturn<T>;
    wizardState: WizardState;
    steps: StepConfig<T>[];
    currentStep: StepConfig<T>;
    next: (options?: WizardNavigationOptions) => Promise<boolean>;
    previous: () => void;
    goTo: (index: number, options?: GoToOptions) => Promise<boolean>;
    reset: () => void;
    handleSubmit: (
        onValid: (data: T) => void | Promise<void>
    ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface UseFormWizardOptions<T extends FieldValues> {
    steps: StepConfig<T>[];
    defaultValues?: DefaultValues<T> | undefined;
    formOptions?: Omit<UseFormProps<T>, 'defaultValues'> | undefined;
    onStepChange?: ((from: number, to: number) => void) | undefined;
}

export interface FormWizardProps<T extends FieldValues> {
    steps: StepConfig<T>[];
    defaultValues?: DefaultValues<T>;
    onSubmit: (data: T) => void | Promise<void>;
    children: (ctx: UseFormWizardReturn<T>) => React.ReactNode;
    className?: string;
    formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
    onStepChange?: (from: number, to: number) => void;
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
    unregisterOnHide?: boolean;
}

export type {FieldValues, RegisterOptions, Path, DefaultValues, UseFormProps};
