module.exports = {
  root: false, // Don't look for configs in parent directories
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    // Remove project reference to avoid tsconfig issues
    // project: "./tsconfig.json",
    // tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-unused-vars": "off", // Turn off base rule as it can report incorrect errors
  },
};

