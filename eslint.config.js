import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        React: 'readonly',
      },
    },
    rules: {
      // TypeScript strict rules - warnings for gradual improvement
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // General code quality - errors for serious issues
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn', // Warn instead of error for dev builds
      'no-eval': 'error',
      'no-implied-eval': 'error', 
      'no-new-func': 'error',
      'no-script-url': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'curly': 'warn', // Warn for now
      
      // Security-focused rules
      'no-new-object': 'error',
      'no-array-constructor': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      
      // Allow certain globals in browser environment
      'no-undef': 'off', // TypeScript handles this better
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      '*.config.js',
      '*.config.mjs',
      'eslint.config.js',
    ],
  },
];