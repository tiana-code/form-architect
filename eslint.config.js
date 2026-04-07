import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    {
        files: ['src/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {jsx: true},
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
];
