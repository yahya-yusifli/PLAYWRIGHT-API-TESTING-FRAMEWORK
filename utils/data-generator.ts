import articleRequestPayload from '../request-objects/POST-article.json';
import { faker } from '@faker-js/faker';

export function getNewRandomArticle() {
    const articalRequest = JSON.parse(JSON.stringify(articleRequestPayload));

    articalRequest.article.title = faker.lorem.sentence(5);
    articalRequest.article.description = faker.lorem.sentence(3);
    articalRequest.article.body = faker.lorem.paragraph(8);

    return articalRequest;
}