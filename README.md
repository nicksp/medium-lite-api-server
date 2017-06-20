# Medium Clone API Server

## Getting Started

To get the Node server running locally:

- Clone the repo `git clone https://github.com/nicksp/medium-lite-api-server.git`
- `yarn install` to install all the dependencies
- Install MongoDB Community Edition ([instructions](https://docs.mongodb.com/manual/installation/#tutorials)) and run it by executing `mongod` command.
- `yarn run dev` to start the local server

## Code Overview

### Dependencies

- [Express](https://github.com/expressjs/express) - the server for handling and routing HTTP requests
- [express-jwt](https://github.com/auth0/express-jwt) - middleware for validating JWTs for authentication
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JsonWebToken implementation for node.js
- [Mongoose](https://github.com/Automattic/mongoose) - for modeling and mapping MongoDB data to JS
- [mongoose-unique-validator](https://github.com/blakehaswell/mongoose-unique-validator) - for handling unique validation errors in Mongoose. Mongoose only handles validation at the document level, so a unique index across a collection will throw an exception at the driver level. The `mongoose-unique-validator` plugin helps us by formatting the error like a normal mongoose `ValidationError`.
- [Passport](https://github.com/jaredhanson/passport) - for handling user authentication
- [slug](https://github.com/dodo/node-slug) - for encoding titles into a URL-friendly format

### Application Structure

- `app.js` - an entry point to the application. This file defines express server and connects it to MongoDB using mongoose. It also requires the routes and models we're using in the application.
- `services/` - this directory contains configuration for Passport.
- `config/` - this folder is a central location for configuration/environment variables.
- `routes/` - this folder contains the route definitions for the API.
- `models/` - this directory contains the schema definitions for Mongoose models.

### Error Handling

In `routes/api/index.js`, we define an error-handling middleware for handling Mongoose's `ValidationError`. This middleware will respond with a 422 status code and format the response to have error messages the clients can understand.

### Authentication

Requests are authenticated using the `Authorization` header with a valid JWT. We define two express middlewares in `routes/auth.js` that can be used to authenticate requests. The `required` middleware configures the `express-jwt` middleware using the application's secret and will return a 401 status code if the request cannot be authenticated. The payload of the JWT can then be accessed from `req.payload` in the endpoint. The `optional` middleware configures the `express-jwt` in the same way as `required`, but will *not* return a 401 status code if the request cannot be authenticated.
