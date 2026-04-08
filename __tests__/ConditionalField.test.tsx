import React from 'react';
import {describe, expect, it} from 'vitest';
import {render, screen, act, fireEvent} from '@testing-library/react';
import {useForm, FormProvider} from 'react-hook-form';
import {ConditionalField} from '../src';
import type {FieldCondition} from '../src';

interface FormValues {
    role: string;
    score: number;
    tags: string[];
    active: boolean;
}

function TestWrapper({
    defaultValues,
    condition,
    allOf,
    fallback,
    unregisterOnHide,
    children,
}: {
    defaultValues: FormValues;
    condition: FieldCondition | FieldCondition[];
    allOf?: boolean;
    fallback?: React.ReactNode;
    unregisterOnHide?: boolean;
    children: React.ReactNode;
}) {
    const methods = useForm<FormValues>({defaultValues});
    return (
        <FormProvider {...methods}>
            <form>
                <ConditionalField
                    condition={condition}
                    {...(allOf !== undefined ? {allOf} : {})}
                    {...(fallback !== undefined ? {fallback} : {})}
                    {...(unregisterOnHide !== undefined ? {unregisterOnHide} : {})}
                >
                    {children}
                </ConditionalField>
            </form>
        </FormProvider>
    );
}

const defaults: FormValues = {
    role: 'admin',
    score: 85,
    tags: ['react', 'ts'],
    active: true,
};

describe('ConditionalField', () => {
    it('renders children when eq condition is met', () => {
        render(
            <TestWrapper
                defaultValues={defaults}
                condition={{watchField: 'role', operator: 'eq', value: 'admin'}}
            >
                <span>Admin panel</span>
            </TestWrapper>
        );
        expect(screen.getByText('Admin panel')).toBeInTheDocument();
    });

    it('hides children when eq condition is not met', () => {
        render(
            <TestWrapper
                defaultValues={{...defaults, role: 'viewer'}}
                condition={{watchField: 'role', operator: 'eq', value: 'admin'}}
            >
                <span>Admin panel</span>
            </TestWrapper>
        );
        expect(screen.queryByText('Admin panel')).toBeNull();
    });

    it('renders fallback when condition is not met', () => {
        render(
            <TestWrapper
                defaultValues={{...defaults, role: 'viewer'}}
                condition={{watchField: 'role', operator: 'eq', value: 'admin'}}
                fallback={<span>No access</span>}
            >
                <span>Admin panel</span>
            </TestWrapper>
        );
        expect(screen.getByText('No access')).toBeInTheDocument();
        expect(screen.queryByText('Admin panel')).toBeNull();
    });

    it('evaluates gt operator correctly', () => {
        render(
            <TestWrapper
                defaultValues={defaults}
                condition={{watchField: 'score', operator: 'gt', value: 80}}
            >
                <span>High score</span>
            </TestWrapper>
        );
        expect(screen.getByText('High score')).toBeInTheDocument();
    });

    it('evaluates truthy operator', () => {
        render(
            <TestWrapper
                defaultValues={defaults}
                condition={{watchField: 'active', operator: 'truthy'}}
            >
                <span>Is active</span>
            </TestWrapper>
        );
        expect(screen.getByText('Is active')).toBeInTheDocument();
    });

    it('evaluates falsy operator', () => {
        render(
            <TestWrapper
                defaultValues={{...defaults, active: false}}
                condition={{watchField: 'active', operator: 'falsy'}}
            >
                <span>Inactive message</span>
            </TestWrapper>
        );
        expect(screen.getByText('Inactive message')).toBeInTheDocument();
    });

    it('evaluates includes operator for arrays', () => {
        render(
            <TestWrapper
                defaultValues={defaults}
                condition={{watchField: 'tags', operator: 'includes', value: 'react'}}
            >
                <span>React tag present</span>
            </TestWrapper>
        );
        expect(screen.getByText('React tag present')).toBeInTheDocument();
    });

    it('evaluates multiple conditions with allOf=true (AND)', () => {
        const conditions: FieldCondition[] = [
            {watchField: 'role', operator: 'eq', value: 'admin'},
            {watchField: 'score', operator: 'gte', value: 80},
        ];
        render(
            <TestWrapper defaultValues={defaults} condition={conditions} allOf={true}>
                <span>Both met</span>
            </TestWrapper>
        );
        expect(screen.getByText('Both met')).toBeInTheDocument();
    });

    it('hides content when one of allOf conditions fails', () => {
        const conditions: FieldCondition[] = [
            {watchField: 'role', operator: 'eq', value: 'admin'},
            {watchField: 'score', operator: 'gt', value: 90},
        ];
        render(
            <TestWrapper defaultValues={defaults} condition={conditions} allOf={true}>
                <span>Both met</span>
            </TestWrapper>
        );
        expect(screen.queryByText('Both met')).toBeNull();
    });

    it('shows content when any condition is met with allOf=false (OR)', () => {
        const conditions: FieldCondition[] = [
            {watchField: 'role', operator: 'eq', value: 'superuser'},
            {watchField: 'score', operator: 'gte', value: 80},
        ];
        render(
            <TestWrapper defaultValues={defaults} condition={conditions} allOf={false}>
                <span>At least one met</span>
            </TestWrapper>
        );
        expect(screen.getByText('At least one met')).toBeInTheDocument();
    });

    it('renders children when condition array is empty', () => {
        render(
            <TestWrapper defaultValues={defaults} condition={[]}>
                <span>Always visible</span>
            </TestWrapper>
        );
        expect(screen.getByText('Always visible')).toBeInTheDocument();
    });

    it('unregisterOnHide: when condition becomes false, children are hidden', async () => {
        interface WatchedForm {
            role: string;
            score: number;
            tags: string[];
            active: boolean;
        }

        function UnregisterTestWrapper() {
            const methods = useForm<WatchedForm>({defaultValues: {...defaults, role: 'admin'}});

            return (
                <FormProvider {...methods}>
                    <form>
                        <input {...methods.register('role')} data-testid="role-input" />
                        <ConditionalField
                            condition={{watchField: 'role', operator: 'eq', value: 'admin'}}
                            unregisterOnHide={true}
                        >
                            <span>Admin panel</span>
                        </ConditionalField>
                    </form>
                </FormProvider>
            );
        }

        render(<UnregisterTestWrapper />);

        expect(screen.getByText('Admin panel')).toBeInTheDocument();

        await act(async () => {
            fireEvent.change(screen.getByTestId('role-input'), {target: {value: 'viewer'}});
        });

        expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
    });
});
