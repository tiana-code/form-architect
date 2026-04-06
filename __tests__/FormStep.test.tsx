import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FormStep} from '../src';

describe('FormStep', () => {
    it('renders title', () => {
        render(<FormStep title="Personal Info"><span>content</span></FormStep>);
        expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(
            <FormStep title="Step" description="Fill in your details">
                <span>content</span>
            </FormStep>
        );
        expect(screen.getByText('Fill in your details')).toBeInTheDocument();
    });

    it('does not render description element when omitted', () => {
        render(<FormStep title="Step"><span>content</span></FormStep>);
        expect(screen.queryByRole('paragraph')).toBeNull();
    });

    it('renders children', () => {
        render(
            <FormStep title="Step">
                <input data-testid="field"/>
            </FormStep>
        );
        expect(screen.getByTestId('field')).toBeInTheDocument();
    });

    it('does not render heading when title is omitted', () => {
        render(<FormStep><span>bare content</span></FormStep>);
        expect(screen.queryByRole('heading')).toBeNull();
        expect(screen.getByText('bare content')).toBeInTheDocument();
    });

    it('applies aria-label from title', () => {
        render(<FormStep title="Address"><input/></FormStep>);
        expect(screen.getByRole('region', {name: 'Address'})).toBeInTheDocument();
    });
});
