import articleRequestPayload from '../request-objects/POST-article.json';
import { faker } from '@faker-js/faker';

/**
 * Creates a fresh article payload for each test.
 *
 * Called from:
 * - test files that create or update an article.
 *
 * Why this exists:
 * - keeps test data creation in one place,
 * - avoids mutating the shared JSON template,
 * - reduces collisions by generating unique values each run.
 */
export function getNewRandomArticle() {
    // We clone the template so one test cannot leak data into another test.
    const articalRequest = JSON.parse(JSON.stringify(articleRequestPayload));

    // Random values make create/update flows independent from previous runs.
    articalRequest.article.title = faker.lorem.sentence(5);
    articalRequest.article.description = faker.lorem.sentence(3);
    articalRequest.article.body = faker.lorem.paragraph(8);

    return articalRequest;
}