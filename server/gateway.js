const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { ApolloGateway, IntrospectAndCompose } = require("@apollo/gateway");

const app = express();
const port = 4000;

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "auth", url: "http://localhost:3004/graphql" },
      { name: "vitalSigns", url: "http://localhost:3005/graphql" },
      { name: "ai", url: "http://localhost:3006/graphql" },
    ],
  }),
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
});

server.start().then(() => {
  server.applyMiddleware({ app });
  app.listen(port, () => {
    console.log(
      `🚀 Gateway ready at http://localhost:${port}${server.graphqlPath}`
    );
  });
});
