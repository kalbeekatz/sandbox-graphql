import React from "react";
import { render } from "react-dom";
import { ApolloProvider } from "react-apollo";
import { InMemoryCache, ApolloLink, ApolloClient, split } from "apollo-boost";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { persistCache } from "apollo-cache-persist";
import { createUploadLink } from "apollo-upload-client";
import App from "./App";

// キャッシュのつなぎこみと永続化
const cache = new InMemoryCache();
persistCache({
  cache,
  storage: localStorage, // TODO: localStorage は使わない https://techracho.bpsinc.jp/hachi8833/2019_10_09/80851
});

if (localStorage["apollo-cache-persist"]) {
  let cacheData = JSON.parse(localStorage["apollo-cache-persist"]);
  cache.restore(cacheData);
}

// バックエンドと接続する場所を設定する
const httpLink = createUploadLink({
  uri: "http://localhost:4000/graphql",
});
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: { reconnect: true },
});

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext((context) => ({
    headers: {
      ...context.headers,
      authorization: localStorage.getItem("token"),
    },
  }));
  return forward(operation);
});

const httpAuthLink = authLink.concat(httpLink);

// GraphQL のオペレーションが Subscription の場合は WebSocket で接続
// query か mutation の場合は HTTP で接続
const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wsLink,
  httpAuthLink
);

const client = new ApolloClient({
  cache,
  link,
});

render(
  <ApolloProvider
    client={client} // コンポーネントがGraphQLサービスからデータを受け取れるようになる redux でいう store との接続
  >
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
