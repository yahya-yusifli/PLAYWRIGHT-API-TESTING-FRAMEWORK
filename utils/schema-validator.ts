import fs from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import { createSchema } from 'genson-js';
import addFormats from 'ajv-formats';

const SCHEMA_BASE_PATH = './response-schemas';
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

export async function validateSchema(dirName: string, fileName: string, responseBody: object, createSchemaFlag: boolean = false) {
    const schemaPath = path.join(SCHEMA_BASE_PATH, dirName, `${fileName}_schema.json`);

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