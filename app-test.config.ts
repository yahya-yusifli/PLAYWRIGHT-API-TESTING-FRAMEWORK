import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

const processENV = process.env.TEST_ENV;
const env = processENV || 'PROD';
console.log('Test environment is: ' + env);

const config = {
    apiURL: 'https://conduit-api.bondaracademy.com/api',
    userEmail: 'pwapiuser@test.com',
    userPassword: 'Welcome'
};

if (env === 'QA') {
    config.userEmail = 'pwtest@test.com';
    config.userPassword = 'Welcome2';
}

if (env === 'PROD') {
    // if (!process.env.PROD_USERNAME || !process.env.PROD_PASSWORD) {
    //     throw Error(' Missing required environmant variables');
    // }
    config.userEmail = process.env.PROD_USERNAME as string,
    config.userPassword = process.env.PROD_PASSWORD as string
}

export { config };