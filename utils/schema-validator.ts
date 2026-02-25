/**
 * Schema validation utilities for API responses.
 *
 * Called from:
 * - `utils/custom-expect.ts` matcher `shouldMatchSchema`.
 *
 * Why this file exists:
 * - keeps contract-check logic out of test files,
 * - allows one schema location for all endpoints,
 * - supports optional schema generation when starting new tests.
 */

import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import { createSchema } from 'genson-js';
import addFormats from 'ajv-formats';

// Root folder for all response schemas.
const SCHEMA_BASE_PATH = './response-schemas';

// AJV instance shared across validations.
const ajv = new Ajv({ 
    allErrors: true,
    verbose: true
});
addFormats(ajv);

/**
 * Validates one response body against one schema file.
 *
 * Flow:
 * 1) build schema path,
 * 2) optionally generate schema,
 * 3) load + compile schema,
 * 4) validate and throw detailed error if invalid.
 */
export async function validateSchema(dirName: string, fileName: string, responseBody: object, createSchemaFlag: boolean = false) {
    const schemaPath = path.join(SCHEMA_BASE_PATH, dirName, `${fileName}_schema.json`);

    // Used when first creating a contract for an endpoint.
    if (createSchemaFlag) await generateNewSchema(responseBody,schemaPath);

    const schema = await loadSchema(schemaPath);
    const validate = ajv.compile(schema);

    const valid = validate(responseBody);
    if (!valid) {
        throw Error(
            `Schema validation ${fileName}_schema.json FAILED!\n` +
            `${JSON.stringify(validate.errors, null, 4)}\n\n` +
            `Actual response body: \n` +
            `${JSON.stringify(responseBody, null, 4)}`
        )
    }
}

// Reads schema JSON from disk and parses it.
async function loadSchema(schemaPath: string) {
    try {
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        return JSON.parse(schemaContent);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to read schema file: ${error.message}`);
        }
        throw new Error('An unknown error occurred during schema loading');
    }
}

// Creates schema file from a sample response body.
async function generateNewSchema(responseBody:object, schemaPath:string) {
    try {
        const generateSchema = createSchema(responseBody);
        await fs.mkdir(path.dirname(schemaPath), { recursive: true });
        await fs.writeFile(schemaPath, JSON.stringify(generateSchema, null, 4));
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to create shema file: ${error.message}`);
        }

    }
}