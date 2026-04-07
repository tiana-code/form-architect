import {describe, expect, it, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {FormWizard} from '../src';
import {FormStep} from '../src';
import type {StepConfig} from '../src';

interface TestData {
    name: string;
    email: string;
}

const steps: StepConfig<TestData>[] = [
    {id: 's1', title: 'Step 1', fields: ['name']},
    {id: 's2', title: 'Step 2', fields: ['email']},
];

describe('FormWizard', () => {
    it('renders the form and initial step', () => {
        render(
            <FormWizard<TestData>
                steps={steps}
                defaultValues={{name: '', email: ''}}
                onSubmit={vi.fn()}
            >
                {({currentStep}) => (
                    <FormStep title={currentStep.title}>
                        <span>{currentStep.id}</span>
                    </FormStep>
                )}
            </FormWizard>
        );
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('s1')).toBeInTheDocument();
    });

    it('advances step when next() is called with validate:false', async () => {
        render(
            <FormWizard<TestData>
                steps={steps}
                defaultValues={{name: '', email: ''}}
                onSubmit={vi.fn()}
            >
                {({currentStep, next}) => (
                    <div>
                        <span data-testid="step-title">{currentStep.title}</span>
                        <button type="button" onClick={() => void next({validate: false})}>
                            Next
                        </button>
                    </div>
                )}
            </FormWizard>
        );

        fireEvent.click(screen.getByText('Next'));
        await waitFor(() =>
            expect(screen.getByTestId('step-title').textContent).toBe('Step 2')
        );
    });

    it('calls onSubmit with form data when submitted', async () => {
        const onSubmit = vi.fn();
        render(
            <FormWizard<TestData>
                steps={steps}
                defaultValues={{name: 'Alice', email: 'a@b.com'}}
                onSubmit={onSubmit}
            >
                {() => <button type="submit">Submit</button>}
            </FormWizard>
        );

        fireEvent.click(screen.getByText('Submit'));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({name: 'Alice', email: 'a@b.com'})
            )
        );
    });

    it('exposes wizardState with correct progress', () => {
        render(
            <FormWizard<TestData>
                steps={steps}
                defaultValues={{name: '', email: ''}}
                onSubmit={vi.fn()}
            >
                {({wizardState}) => (
                    <span data-testid="progress">{wizardState.progress}</span>
                )}
            </FormWizard>
        );
        expect(screen.getByTestId('progress').textContent).toBe('0');
    });
});
