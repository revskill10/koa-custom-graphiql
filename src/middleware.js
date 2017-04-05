'use strict'

// Current latest version of GraphiQL
const GRAPHIQL_VERSION = '0.9.3'

export default function createMiddleware(getOptions) {
  return async function middleware(ctx) {
    // koa 1 binds the context to this rather than passing as an arg. we want to try to support both
    if (this && this.request) {
      ctx = this
    }
    const options = getDefaultOptions(ctx)
    let overrides = {}
    if (typeof getOptions === 'function') {
      overrides = getOptions(ctx)
    } else if (typeof getOptions === 'object') {
      overrides = getOptions
    }
    Object.assign(options, typeof overrides.then === 'function' ? (await overrides) : overrides)

    ctx.body = renderHtml(options)
    ctx.type = 'text/html'
  }
}

function getDefaultOptions(ctx) {
  const body = ctx.request.body || {}
  const query = body.query || ctx.query.query

  let variables
  let variablesString = body.variables || ctx.query.variables
  try {
    variables = JSON.parse(variablesString)
  } catch (e) {}

  let result
  let resultString = body.result || ctx.query.result
  try {
    result = JSON.parse(resultString)
  } catch (e) {}

  const css = `//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.css`
  const js = `//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.min.js`
  const url = '/graphql'

  return { query, variables, result, css, js, url }
}

/**
 * See express-graphql for the original implementation
 */
function renderHtml(options) {
  const queryString = options.query
  const variablesString = options.variables ?
    JSON.stringify(options.variables, null, 2) :
    null
  const resultString = options.result ?
    JSON.stringify(options.result, null, 2) :
    null

  // How to Meet Ladies
  return (
`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
    #content {
      height: 100%
    }
  </style>
  <link href="${options.css}" rel="stylesheet" />
  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.3.2/react.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.3.2/react-dom.js"></script>
  <script src="${options.js}"></script>
</head>
<body>
  <div id="content"></div>
  <script>
    // Collect the URL parameters
    var parameters = {}
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=')
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1))
      }
    })
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key])
      }).join('&')
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    }
    var otherParams = {}
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k]
      }
    }
    var fetchURL = ${JSON.stringify(options.url)} + locationQuery(otherParams)
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      let headers = {}
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function(response) {
        for (let header of response.headers.entries()) {
          headers[header[0]] = decodeURIComponent(header[1])
        }
        return response.text()
      }).then(function(respText) {
        try {
          const body = JSON.parse(respText)
          Object.defineProperty(body, '_headers', {
            value: headers,
            enumberable: false
          })
          return body
        } catch (e) {
          return respText
        }
      })
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery
      updateURL()
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables
      updateURL()
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters))
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        query: ${JSON.stringify(queryString)},
        response: ${JSON.stringify(resultString)},
        variables: ${JSON.stringify(variablesString)}
      }),
      document.getElementById('content')
    )
  </script>
</body>
</html>`
  )
}
