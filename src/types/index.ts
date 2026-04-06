import type {FieldValues, UseFormReturn, RegisterOptions} from 'react-hook-form';

export interface StepConfig {
    id: string;
    title: string;
    description?: string;
    fields: string[];
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

export interface FieldCondition {
    watchField: string;
    operator: ConditionOperator;
    value?: unknown;
}

export type AsyncValidatorFn<T = unknown> = (
    value: T
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
    steps: StepConfig[];
    currentStep: StepConfig;
    next: (options?: WizardNavigationOptions) => Promise<boolean>;
    previous: () => void;
    goTo: (index: number) => void;
    reset: () => void;
    handleSubmit: (
        onValid: (data: T) => void | Promise<void>
    ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface FormWizardProps<T extends FieldValues> {
    steps: StepConfig[];
    defaultValues?: Partial<T>;
    onSubmit: (data: T) => void | Promise<void>;
    children: (ctx: UseFormWizardReturn<T>) => React.ReactNode;
    className?: string;
}

export interface FormStepProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export interface ConditionalFieldProps {
    condition: FieldCondition | FieldCondition[];
    /**
     * When true, all conditions must be satisfied (AND)
     * When false, any condition is sufficient (OR). Default: true
     */
    allOf?: boolean;
    children: React.ReactNode;
    /** Rendered when the condition is not met. Default: null */
    fallback?: React.ReactNode;
}

export type {FieldValues, RegisterOptions};
