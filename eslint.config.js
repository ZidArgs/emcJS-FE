import {
    defineConfig, globalIgnores
} from "eslint/config";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";
import stylistic from "@stylistic/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

// fix globals
const browserGlobals = {
    ...globals.browser,
    AudioWorkletGlobalScope: false // this is the default,
};
delete browserGlobals["AudioWorkletGlobalScope "];

export default defineConfig([
    globalIgnores([
        "**/node_modules",
        "**/.idea",
        "**/.vscode",
        "**/lib",
        "gulpfile.js"
    ]),
    {
        extends: compat.extends("eslint:recommended"),

        languageOptions: {
            globals: {
                ...browserGlobals,
                ...globals.node,
                WeakRef: false,
                Iterator: false,
                importScripts: false
            },

            parser: babelParser,
            ecmaVersion: 2021,
            sourceType: "module",

            parserOptions: {
                ecmaFeatures: {
                    jsx: false,
                    experimentalObjectRestSpread: true
                }
            }
        },
        plugins: {"@stylistic": stylistic},
        rules: {
            "no-unused-expressions": "error",
            "no-unused-private-class-members": "error",
            "no-var": "error",
            "dot-location": ["error", "property"],

            indent: ["error", 4, {SwitchCase: 1}],

            curly: "error",
            "no-case-declarations": "error",
            "default-case-last": "error",
            "no-trailing-spaces": ["error"],
            "eol-last": ["error", "always"],

            "no-multiple-empty-lines": ["error", {
                max: 1,
                maxEOF: 1,
                maxBOF: 1
            }],

            "no-unneeded-ternary": "error",

            "brace-style": ["error", "1tbs", {allowSingleLine: false}],

            "no-unused-vars": ["error", {
                vars: "local",
                args: "after-used",
                caughtErrors: "all"
            }],

            "keyword-spacing": ["error", {
                before: true,
                after: true
            }],

            "space-before-function-paren": ["error", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always"
            }],

            "@stylistic/function-paren-newline": ["error", {minItems: 6}],

            "@stylistic/function-call-spacing": ["error", "never"],

            "space-before-blocks": ["error", "always"],
            "space-in-parens": ["error", "never"],
            "arrow-parens": ["error", "always"],
            "object-curly-spacing": ["error", "never"],
            "array-bracket-spacing": ["error", "never"],
            "computed-property-spacing": ["error", "never"],

            "comma-spacing": ["error", {
                before: false,
                after: true
            }],

            "comma-dangle": ["error", {
                arrays: "never",
                objects: "never",
                imports: "never",
                exports: "never",
                functions: "never"
            }],

            "prefer-const": "error",
            "default-param-last": ["error"],
            "nonblock-statement-body-position": ["error", "beside"],

            "object-property-newline": ["error", {allowAllPropertiesOnSameLine: false}],

            "object-curly-newline": ["error", {
                ObjectExpression: {
                    multiline: true,
                    minProperties: 2
                },

                ObjectPattern: {
                    multiline: true,
                    minProperties: 2
                },

                ImportDeclaration: {
                    multiline: true,
                    minProperties: 2
                },

                ExportDeclaration: {
                    multiline: true,
                    minProperties: 2
                }
            }],

            "lines-between-class-members": ["error", "always"],
            semi: ["error", "always"],

            "padded-blocks": ["error", {
                blocks: "never",
                switches: "never",
                classes: "always"
            }],

            "space-infix-ops": "error",

            quotes: ["error", "double", {allowTemplateLiterals: true}],

            "no-dupe-else-if": "error",
            "no-duplicate-case": "error",
            "no-lonely-if": "error",

            "no-extra-parens": ["error", "all", {
                returnAssign: false,
                nestedBinaryExpressions: false,
                enforceForArrowConditionals: false,
                enforceForSequenceExpressions: false,
                enforceForNewInMemberExpressions: false
            }],

            "no-fallthrough": "off",

            "padding-line-between-statements": ["error", {
                blankLine: "always",
                prev: "import",
                next: "*"
            }, {
                blankLine: "any",
                prev: "import",
                next: "import"
            }, {
                blankLine: "always",
                prev: "export",
                next: "*"
            }, {
                blankLine: "always",
                prev: "*",
                next: "export"
            }, {
                blankLine: "always",
                prev: "class",
                next: "*"
            }, {
                blankLine: "always",
                prev: "*",
                next: "class"
            }, {
                blankLine: "always",
                prev: "function",
                next: "*"
            }, {
                blankLine: "always",
                prev: "*",
                next: "function"
            }, {
                blankLine: "always",
                prev: "iife",
                next: "*"
            }, {
                blankLine: "always",
                prev: "*",
                next: "iife"
            }]
        }
    }
]);
