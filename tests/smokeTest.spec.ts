/**
 * Smoke tests for core article/tag API flows.
 *
 * These tests use:
 * - `test` from fixtures (injects `api`),
 * - custom `expect` (schema + log-aware assertions),
 * - random article data generator.
 */

import { expect } from '../utils/custom-expect';
import { test } from '../utils/fixtures';
import { getNewRandomArticle } from '../utils/data-generator';


// Validates read endpoints and their baseline response contracts.
test('Get Articles', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    
    // `api` comes from fixtures -> RequestHandler.
    const response = await api
        .path('/articles')  
        .params({ limit: 10, offset: 0 })
        .getRequest(200);  
    
    // `shouldMatchSchema` calls utils/schema-validator.ts under the hood.
    // To generate a new schema file, call: shouldMatchSchema('tags', 'GET_tags', true)
    await expect(response).shouldMatchSchema('articles', 'GET_articles');
    expect(response.articles.length).shouldBeLessThanOrEqual(10);

    // Same fixture client, second endpoint.
    const response2 = await api
        .path('/tags')  
        .getRequest(200);  

    expect(response2.tags[0]).shouldEqual('Test');
    expect(response2.tags.length).shouldBeLessThanOrEqual(10);
});

// Isolated tag contract check.
test('Get Test Tags', async ({ api }) => {
    const response = await api
        .path('/tags')  
        .getRequest(200);  

    // To generate a new schema file, call: shouldMatchSchema('tags', 'GET_tags', true)
    await expect(response).shouldMatchSchema('tags', 'GET_tags'); 
    expect(response.tags[0]).shouldEqual('Test');
    expect(response.tags.length).shouldBeLessThanOrEqual(10);
});

// End-to-end lifecycle using one generated article.
test('Create, Update  and Delete Aricle', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    
    // Create
    const createArticleResponse = await api
        .path('/articles')  
        .body(articalRequest)
        .postRequest(201);
        
    // To generate a new schema file, call: shouldMatchSchema('tags', 'GET_tags', true)
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles'); 
    expect(createArticleResponse.article.title).shouldEqual(articalRequest.article.title);  
    const slugId = createArticleResponse.article.slug;

    // Update
    const articleTitleUpdated = getNewRandomArticle();
    const updateArticleResponse = await api
        .path(`/articles/${slugId}`)
        .body(articleTitleUpdated)
        .putRequest(200);

    expect(updateArticleResponse.article.title).shouldEqual(articleTitleUpdated.article.title);  
    const newSlugId = updateArticleResponse.article.slug;

    // Verify updated article appears in list.
    const articlesREsponse = await api
        .path('/articles')  
        .params({ limit: 10, offset: 0 })  
        .getRequest(200);  
    
    expect(articlesREsponse.articles[0].title).shouldEqual(articleTitleUpdated.article.title);  

    // Delete
    await api
        .path(`/articles/${newSlugId}`)  
        .deleteRequest(204);

    // Verify deletion by checking list again.
    const articlesREsponseTwo = await api
        .path('/articles')  
        .params({ limit: 10, offset: 0 })  
        .getRequest(200);  
    
    expect(articlesREsponseTwo.articles[0].title).not.shouldEqual(articalRequest);  


});

// Shorter lifecycle smoke case: create + delete.
test('Create and Delete Aricle', async ({ api }) => {
    const articalRequest = getNewRandomArticle();
    
    const createArticleResponse = await api
        .path('/articles')  
        .body(articalRequest)
        .postRequest(201);  
    
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles'); 
    expect(createArticleResponse.article.title).shouldEqual(articalRequest.article.title);  
    const slugId = createArticleResponse.article.slug;  

    // Verify it is visible in feed.
    const articlesREsponse = await api
        .path('/articles')  
        .params({ limit: 10, offset: 0 })  
        .getRequest(200);  
    
    expect(articlesREsponse.articles[0].title).shouldEqual(articalRequest.article.title);  

    // Cleanup
    await api
        .path(`/articles/${slugId}`)  
        .deleteRequest(204);  

    // Verify removed article is no longer first result.
    const articlesREsponseTwo = await api
        .path('/articles')  
        .params({ limit: 10, offset: 0 })  
        .getRequest(200);  
    
    expect(articlesREsponseTwo.articles[0].title).not.shouldEqual(articalRequest);  


});

