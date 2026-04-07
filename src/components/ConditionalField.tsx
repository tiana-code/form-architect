import {useMemo} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import type {ConditionOperator, ConditionalFieldProps} from '../types';

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

export function ConditionalField({
                                     condition,
                                     allOf = true,
                                     children,
                                     fallback = null,
                                 }: ConditionalFieldProps) {
    useFormContext();

    const conditions = useMemo(
        () => (Array.isArray(condition) ? condition : [condition]),
        [condition]
    );

    const watchFields = useMemo(
        () => conditions.map((c) => c.watchField),
        [conditions]
    );

    const values = useWatch({name: watchFields});

    if (conditions.length === 0) return <>{children}</>;

    const fieldValues = Array.isArray(values) ? values : [values];

    const results = conditions.map((c, i) =>
        evaluate(c.operator, fieldValues[i], c.value)
    );

    const satisfied = allOf ? results.every(Boolean) : results.some(Boolean);

    return <>{satisfied ? children : fallback}</>;
}
