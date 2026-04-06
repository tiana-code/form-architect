import React from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import type {FieldCondition, ConditionOperator, ConditionalFieldProps} from '../types';

function evaluate(operator: ConditionOperator, fieldValue: unknown, testValue: unknown): boolean {
    switch (operator) {
        case 'eq':
            return fieldValue === testValue;
        case 'neq':
            return fieldValue !== testValue;
        case 'gt':
            return typeof fieldValue === 'number' && typeof testValue === 'number'
                ? fieldValue > testValue
                : false;
        case 'gte':
            return typeof fieldValue === 'number' && typeof testValue === 'number'
                ? fieldValue >= testValue
                : false;
        case 'lt':
            return typeof fieldValue === 'number' && typeof testValue === 'number'
                ? fieldValue < testValue
                : false;
        case 'lte':
            return typeof fieldValue === 'number' && typeof testValue === 'number'
                ? fieldValue <= testValue
                : false;
        case 'includes':
            return Array.isArray(fieldValue)
                ? fieldValue.includes(testValue)
                : typeof fieldValue === 'string' && typeof testValue === 'string'
                    ? fieldValue.includes(testValue)
                    : false;
        case 'truthy':
            return Boolean(fieldValue);
        case 'falsy':
            return !fieldValue;
        default:
            return false;
    }
}

function useSatisfied(condition: FieldCondition): boolean {
    const formValues = useWatch({name: condition.watchField});
    return evaluate(condition.operator, formValues, condition.value);
}

function SingleCondition({
                             condition,
                             allOf,
                             children,
                             fallback,
                         }: {
    condition: FieldCondition;
    allOf: boolean;
    children: React.ReactNode;
    fallback: React.ReactNode;
}) {
    const satisfied = useSatisfied(condition);
    void allOf;
    return <>{satisfied ? children : fallback}</>;
}

function MultiCondition({
                            conditions,
                            allOf,
                            children,
                            fallback,
                        }: {
    conditions: FieldCondition[];
    allOf: boolean;
    children: React.ReactNode;
    fallback: React.ReactNode;
}) {
    const results = conditions.map((c) => {
        return useSatisfied(c);
    });
    const satisfied = allOf ? results.every(Boolean) : results.some(Boolean);
    return <>{satisfied ? children : fallback}</>;
}

export function ConditionalField({
                                     condition,
                                     allOf = true,
                                     children,
                                     fallback = null,
                                 }: ConditionalFieldProps) {
    useFormContext();

    if (Array.isArray(condition)) {
        if (condition.length === 0) return <>{children}</>;
        if (condition.length === 1) {
            return (
                <SingleCondition condition={condition[0]} allOf={allOf} fallback={fallback}>
                    {children}
                </SingleCondition>
            );
        }
        return (
            <MultiCondition conditions={condition} allOf={allOf} fallback={fallback}>
                {children}
            </MultiCondition>
        );
    }

    return (
        <SingleCondition condition={condition} allOf={allOf} fallback={fallback}>
            {children}
        </SingleCondition>
    );
}
