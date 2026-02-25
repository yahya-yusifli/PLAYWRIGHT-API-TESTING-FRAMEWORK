# Playwright API Testing Framework

A TypeScript-based API testing framework built on Playwright Test.

## What this framework provides

- Reusable API client (`RequestHandler`) with fluent request chaining
- Shared fixtures for auth token + API client injection
- Custom assertions with API activity logs on failure
- JSON schema validation for API contract checks
- Random test-data generation for stable create/update tests

## Tech stack

- Playwright Test
- TypeScript
- AJV + ajv-formats (schema validation)
- genson-js (optional schema generation)
- faker (dynamic test data)

## Project structure

- `tests/`
  - `smokeTest.spec.ts` - core happy-path API scenarios
  - `nagativeTests.spec.ts` - negative/boundary validation scenarios
- `utils/`
  - `fixtures.ts` - test fixtures (`api`, `config`, `authToken`)
  - `request-handler.ts` - fluent API request helper
  - `custom-expect.ts` - custom matchers (`shouldMatchSchema`, etc.)
  - `schema-validator.ts` - schema loading/validation/generation
  - `data-generator.ts` - random article payload generator
  - `logger.ts` - per-test in-memory API request/response logger
- `helpers/`
  - `createToken.ts` - login helper used by worker fixture
- `response-schemas/`
  - endpoint schema files used by `shouldMatchSchema`
- `request-objects/`
  - reusable request templates

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
npm install
npx playwright install
```

## Environment configuration

The framework loads values from `.env` via `app-test.config.ts`.

Create a `.env` file in project root:

```env
TEST_ENV=PROD
PROD_USERNAME=your_email_here
PROD_PASSWORD=your_password_here
```

### Environment behavior

- `TEST_ENV=PROD` (default): uses `PROD_USERNAME` and `PROD_PASSWORD`
- `TEST_ENV=QA`: uses built-in QA credentials from config

## Running tests

### Run all tests

```bash
npx playwright test
```

### Run smoke tests only

```bash
npx playwright test tests/smokeTest.spec.ts
```

### Run negative tests only

```bash
npx playwright test tests/nagativeTests.spec.ts
```

### Run with HTML report

```bash
npx playwright test --reporter=html
npx playwright show-report
```

## How tests use the framework

1. Tests import `test` from `utils/fixtures.ts`
2. Fixture creates `authToken` (worker scope) and `api` (test scope)
3. `api` is an instance of `RequestHandler`
4. Assertions use custom `expect` from `utils/custom-expect.ts`
5. On failures, recent request/response logs are included automatically

## Request pattern

Typical usage in tests:

```ts
const response = await api
  .path('/articles')
  .params({ limit: 10, offset: 0 })
  .getRequest(200)
```

## Schema validation and generation

Schema assertion:

```ts
await expect(response).shouldMatchSchema('tags', 'GET_tags')
```

If you want to generate/update schema from current response, pass `true` as third parameter:

```ts
await expect(response).shouldMatchSchema('tags', 'GET_tags', true)
```

Generated files are written under `response-schemas/<dirName>/<fileName>_schema.json`.

> Recommended workflow: generate once, commit schema files, then run validations without `true`.

## Notes

- `RequestHandler` auto-injects `Authorization` header from fixture token
- Use `.clearAuth()` to test unauthenticated scenarios
- Request state is reset after each call to prevent leakage between requests

## Troubleshooting

- **401 Unauthorized**: check `.env` credentials and `TEST_ENV`
- **Schema validation failed**: inspect response body in error output and update schema if API contract intentionally changed
- **No tests found for a project**: verify Playwright project filters in `playwright.config.ts`
