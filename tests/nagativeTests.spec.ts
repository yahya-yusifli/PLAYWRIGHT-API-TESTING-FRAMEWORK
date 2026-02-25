/**
 * Negative tests for validation behavior.
 *
 * Uses same `api` fixture as smoke tests, but intentionally sends invalid data
 * and asserts backend validation output.
 */

import { test } from '../utils/fixtures';
import { expect } from '../utils/custom-expect';

// Boundary matrix for username validation.
// forEach creates one Playwright test per row.
[{ username: 'dd', usernameErrorMessage: 'is too short (minimum is 3 characters)' },
{ username: 'ddd', usernameErrorMessage: '' },
{ username: 'dddddddddddddddddddd', usernameErrorMessage: '' },
{ username: 'ddddddddddddddddddddd', usernameErrorMessage: 'is too long (maximum is 20 characters)' },
].forEach(({ username, usernameErrorMessage }) => {

    // Purpose: prove username rule boundaries (min=3, max=20) from API side.
    test(`Error message validation for ${username}`, async ({ api }) => {
        // clearAuth() is intentional: signup endpoint should be public.
        const newUserResponse = await api
            .path('/users')
            .body({
                "user": {
                    "email": "d",
                    "password": "d",
                    "username": username
                }
            })
            .clearAuth()
            .postRequest(422);

        const errors = newUserResponse.errors;
        
        if (username.length >= 3 && username.length <= 20) {
            if (errors) {
                expect(errors).not.toHaveProperty('username');
            }
        } else {
            expect(errors).toHaveProperty('username');
            expect(errors.username[0]).shouldEqual(usernameErrorMessage);
        }
    });
})

