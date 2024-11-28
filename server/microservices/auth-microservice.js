const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { buildFederatedSchema } = require('@apollo/federation');
const connectDB = require('../config/db');
const User = require('../models/User');
const cors = require('cors');

const app = express();
const port = 3004;
app.use(cors());

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    role: String!
  }

  type Mutation {
    signup(username: String!, password: String!, role: String!): User
    login(username: String!, password: String!): User
  }

  type Query {
    getPatients: [User]
    getPatientInfo(id: ID!): User
  }
`;

const resolvers = {
  Query: {
    getPatients: async () => {
      return await User.find({ role: 'patient' });
    },
    getPatientInfo: async (_, { id }) => {
      return await User.findById(id);
    },
  },
  Mutation: {
    signup: async (_, { username, password, role }) => {
      const user = new User({ username, password, role });
      await user.save();
      return user;
    },
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || !(await user.comparePassword(password))) throw new Error('Invalid credentials');
      return user;
    },
  },
};

connectDB();

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
});

server.start().then(() => {
  server.applyMiddleware({ app });
  app.listen(port, () => {
    console.log(`Auth microservice ready at http://localhost:${port}${server.graphqlPath}`);
  });
});
