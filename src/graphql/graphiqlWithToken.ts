// from https://github.com/jrebecchi/graphiql-auth-token/blob/master/examples/ExampleWithExpressGraphQL.js

// function rendering the webpage with graphiql-auth-token
export default function renderGraphiQLAuthToken(data: any) {
  const queryString = data.query;
  const variablesString =
    data.variables != null ? JSON.stringify(data.variables, null, 2) : null;
  const operationName = data.operationName;
  return `<!--
  The request to this GraphQL server provided the header "Accept: text/html"
  and as a result has been presented GraphiQL - an in-browser IDE for
  exploring GraphQL.
  If you wish to receive JSON, provide the header "Accept: application/json" or
  add "&raw" to the end of the URL within a browser.
  -->
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>GraphiQL</title>
    <meta name="robots" content="noindex" />
    <meta name="referrer" content="origin" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        overflow: hidden;
      }
      #graphiql {
        height: 100vh;
        width: 100vh;
      }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql-auth-token@1.1.2/umd/graphiql-auth-token.css"> 
    <script src="https://unpkg.com/promise-polyfill@8.1.3/dist/polyfill.min.js"></script>
    <script src="https://unpkg.com/unfetch@4.1.0/dist/unfetch.umd.js"></script>
    <script src="https://unpkg.com/react@16.12.0/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@16.12.0/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/graphiql-auth-token@1.1.2/umd/graphiql-auth-token.min.js"></script>
    <script src="https://unpkg.com/socket.io-client@2.3.0/dist/socket.io.slim.js"></script>
    </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script>
      // Collect the URL parameters
      var parameters = {};
      window.location.search.substr(1).split('&').forEach(function (entry) {
        var eq = entry.indexOf('=');
        if (eq >= 0) {
          parameters[decodeURIComponent(entry.slice(0, eq))] =
            decodeURIComponent(entry.slice(eq + 1));
        }
      });
      // Produce a Location query string from a parameter object.
      function locationQuery(params) {
        return '?' + Object.keys(params).filter(function (key) {
          return Boolean(params[key]);
        }).map(function (key) {
          return encodeURIComponent(key) + '=' +
            encodeURIComponent(params[key]);
        }).join('&');
      }
      // Derive a fetch URL from the current URL, sans the GraphQL parameters.
      var graphqlParamNames = {
        query: true,
        variables: true,
        operationName: true
      };
      var otherParams = {};
      for (var k in parameters) {
        if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
          otherParams[k] = parameters[k];
        }
      }
      var fetchURL = locationQuery(otherParams);
      // Defines a GraphQL fetcher using the fetch API.
      function graphQLFetcher(graphQLParams) {
        var headers = { 'Content-Type': 'application/json' }
        if (token){
          headers['Authorization'] = '' + token;
        }
        return fetch(fetchURL, {
          method: 'post',
          headers,
          body: JSON.stringify(graphQLParams),
        }).then(function (response) {
            return response.json();
        });
      }
      var token = null;
      // Defines a callback call on token update
      function onTokenUpdate(newToken){
          token = newToken;
          localStorage.setItem("TOKEN", newToken);
      }
      // When the query and variables string is edited, update the URL bar so
      // that it can be easily shared.
      function onEditQuery(newQuery) {
        parameters.query = newQuery;
        updateURL();
      }
      function onEditVariables(newVariables) {
        parameters.variables = newVariables;
        updateURL();
      }
      function onEditOperationName(newOperationName) {
        parameters.operationName = newOperationName;
        updateURL();
      }
      function updateURL() {
        history.replaceState(null, null, locationQuery(parameters));
      }
      class GraphiQLIDE extends React.Component {
        
        constructor() {
            super();
            this.state = {
                notification: null,
                query: ${safeSerialize(queryString)},
            }
        }
        
        componentDidMount() {
          token = localStorage.getItem("TOKEN");
          /*this.socket = io(fetchURL);
          this.socket.on("notification", data => {
              this.setState({ notification: data, query: parameters.query });
          });*/
        }
        componentWillUnmount() {
            //this.socket.close();
        }
        render() {
          return React.createElement(GraphiQLAuthToken, {
            fetcher: graphQLFetcher,
            onTokenUpdate: onTokenUpdate,
            onEditQuery: onEditQuery,
            onEditVariables: onEditVariables,
            onEditOperationName: onEditOperationName,
            query: this.state.query,
            variables: ${safeSerialize(variablesString)},
            operationName: ${safeSerialize(operationName)},
            notification: this.state.notification
          });
        }
      }
      // Render <GraphiQLIDE /> into the body.
      ReactDOM.render(React.createElement(GraphiQLIDE), document.getElementById('graphiql'));
    </script>
  </body>
  </html>`;
}

// Ensures string values are safe to be used within a <script> tag.
function safeSerialize(data: any) {
  return data != null
    ? JSON.stringify(data).replace(/\//g, "\\/")
    : "undefined";
}
