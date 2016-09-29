# koa-custom-graphiql

Koa middleware to display [GraphiQL](https://github.com/graphql/graphiql), or your own custom build of it!

## Usage

```sh
npm i --save koa-custom-graphiql
```

Add it to your Koa app. You may want to use router middleware if your app serves more than GraphiQL.

```js
import graphiql from 'koa-custom-graphiql';

// the argument can be an options object or a (async) function that returns an object
router.get('/graphiql', graphiql(ctx => {
  return {
    // String of the base URL of the GraphQL endpoint
    // defaults to '/graphql'
    url: '/graphql',

    // specify URLs for your custom GraphiQL (must be hosted, localhost is fine)
    // defaults to the official GraphiQL
    js: 'http://static-server.example.org/graphiql.min.js',
    css: '/my-servers-style.css',

    // String to display in the query panel
    query: 'query Demo($token: String) { viewer(token: $token) { id } }',

    // Object used to populate the "variables" panel
    variables: {
      token: 'eyJhbGciOiJIUzI1NiJ9.YWNjb3VudFtpZGVd.-w3FiHaq5jIFIOzHErgdEQGvXXG6wClBUDFDVgwUyx8'
    },

    // Object to display in the result panel
    result: {
      data: {
        viewer: { id: 'account[ide]' }
      }
    },
  };
}));
```

Typically, you will want to populate the `query`, `variables`, and `result` fields from data in the Koa context, such as the query parameters or request body. `koa-custom-graphiql` will do this for you by default.
