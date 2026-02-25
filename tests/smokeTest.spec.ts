import { expect } from '../utils/custom-expect';
import { test } from '../utils/fixtures';
import { getNewRandomArticle } from '../utils/data-generator';


// Test getting articles list
test('Get Articles', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    const response = await api
        .path('/articles')  // Articles endpoint
        .params({ limit: 10, offset: 0 })  // Pagination parameters
        .getRequest(200);  // Expect 200 OK
    await expect(response).shouldMatchSchema('articles', 'GET_articles'); // add true for generate schema if not created
    expect(response.articles.length).shouldBeLessThanOrEqual(10);  // Check max 10 articles returned

    const response2 = await api
        .path('/tags')  // Tags endpoint
        .getRequest(200);  // Expect 200 OK

    expect(response2.tags[0]).shouldEqual('Test');  // Check first tag is 'Test'
    expect(response2.tags.length).shouldBeLessThanOrEqual(10);  // Check max 10 tags
});

// Test getting tags
test('Get Test Tags', async ({ api }) => {
    const response = await api
        .path('/tags')  // Tags endpoint
        .getRequest(200);  // Expect 200 OK
    await expect(response).shouldMatchSchema('tags', 'GET_tags'); // add true for generate schema if not created
    expect(response.tags[0]).shouldEqual('Test');  // Check first tag is 'Test'
    expect(response.tags.length).shouldBeLessThanOrEqual(10);  // Check max 10 tags
});

// Test creating and deleting an article
test('Create, Update  and Delete Aricle', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    // Create article with POST
    const createArticleResponse = await api
        .path('/articles')  // Articles endpoint
        .body(articalRequest)
        .postRequest(201);  // Expect 201 Created
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles'); // add true for generate schema if not created
    expect(createArticleResponse.article.title).shouldEqual(articalRequest.article.title);  // Verify title
    const slugId = createArticleResponse.article.slug;  // Get article slug for later use

    // Update article with PUT
    const articleTitleUpdated = getNewRandomArticle();
    const updateArticleResponse = await api
        .path(`/articles/${slugId}`)  // Article update endpoint with slug
        .body(articleTitleUpdated)
        .putRequest(200);  // Expect 200 OK

    expect(updateArticleResponse.article.title).shouldEqual(articleTitleUpdated.article.title);  // Verify update
    const newSlugId = updateArticleResponse.article.slug;  // Slug might change after update

    // Verify article exists in list after update
    const articlesREsponse = await api
        .path('/articles')  // Articles list endpoint
        .params({ limit: 10, offset: 0 })  // Pagination
        .getRequest(200);  // Expect 200 OK
    expect(articlesREsponse.articles[0].title).shouldEqual(articleTitleUpdated.article.title);  // Check article is in list

    // Delete article
    await api
        .path(`/articles/${newSlugId}`)  // Article delete endpoint
        .deleteRequest(204);  // Expect 204 No Content

    // Verify article is deleted (removed from list)
    const articlesREsponseTwo = await api
        .path('/articles')  // Articles list endpoint
        .params({ limit: 10, offset: 0 })  // Pagination
        .getRequest(200);  // Expect 200 OK
    expect(articlesREsponseTwo.articles[0].title).not.shouldEqual(articalRequest);  // Article should not be first anymore


});


test('Create and Delete Aricle', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    // Create article with POST
    const createArticleResponse = await api
        .path('/articles')  // Articles endpoint
        .body(articalRequest)
        .postRequest(201);  // Expect 201 Created
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles'); // add true for generate schema if not created
    expect(createArticleResponse.article.title).shouldEqual(articalRequest.article.title);  // Verify title
    const slugId = createArticleResponse.article.slug;  // Get article slug for later use

    // Verify article exists in list after update
    const articlesREsponse = await api
        .path('/articles')  // Articles list endpoint
        .params({ limit: 10, offset: 0 })  // Pagination
        .getRequest(200);  // Expect 200 OK
    expect(articlesREsponse.articles[0].title).shouldEqual(articalRequest.article.title);  // Check article is in list

    // Delete article
    await api
        .path(`/articles/${slugId}`)  // Article delete endpoint
        .deleteRequest(204);  // Expect 204 No Content

    // Verify article is deleted (removed from list)
    const articlesREsponseTwo = await api
        .path('/articles')  // Articles list endpoint
        .params({ limit: 10, offset: 0 })  // Pagination
        .getRequest(200);  // Expect 200 OK
    expect(articlesREsponseTwo.articles[0].title).not.shouldEqual(articalRequest);  // Article should not be first anymore


});

