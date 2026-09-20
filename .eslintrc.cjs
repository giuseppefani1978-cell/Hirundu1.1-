module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'prettier',
  ],
  rules: {
    'react/prop-types': 'off',
    // Existing legacy game code intentionally uses defensive empty catch blocks and
    // carries some unused compatibility helpers. Keep these visible without making
    // them release blockers; runtime correctness rules such as no-undef stay errors.
    'no-empty': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-definitions': 'warn',
    '@typescript-eslint/array-type': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
  },
};
