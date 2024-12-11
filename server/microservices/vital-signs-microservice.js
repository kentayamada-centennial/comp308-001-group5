const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { buildFederatedSchema } = require('@apollo/federation');
const connectDB = require('../config/db');
const cors = require('cors');
const VitalSign = require('../models/VitalSign');
const Tip = require('../models/Tip');
const SymptomChecklist = require('../models/SymptomChecklist');
const EmergencyAlert = require('../models/EmergencyAlert');

const app = express();
const port = 3005;
app.use(cors());

const typeDefs = gql`
  type VitalSign {
    id: ID!
    userId: ID!
    heartRate: Int
    bloodPressure: String
    temperature: Float
    respiratoryRate: Int
    timestamp: String
  }

  type SymptomChecklist {
    id: ID!
    userId: ID!
    symptoms: [String!]!
    timestamp: String!
  }

  type Tip {
    id: ID!
    userId: ID!
    message: String!
    timestamp: String!
  }

  type EmergencyAlert {
    id: ID!
    userId: ID!
    message: String!
    timestamp: String!
  }

  type Query {
    getVitalSigns(userId: ID!): [VitalSign]
    getSymptomChecklists(userId: ID!): [SymptomChecklist]
    getTips(userId: ID!): [Tip]
    getEmergencyAlerts(userId: ID!): [EmergencyAlert]
  }

  type Mutation {
    addVitalSign(
      userId: ID!
      heartRate: Int
      bloodPressure: String
      temperature: Float
      respiratoryRate: Int
    ): VitalSign

    addTip(userId: ID!, message: String!): Tip

    sendEmergencyAlert(userId: ID!, message: String!): EmergencyAlert

    predictCondition(symptoms: [String!]!): [String!]

    submitChecklist(userId: ID!, symptoms: [String!]!): String
  }
`;

const resolvers = {
  Query: {
    getVitalSigns: async (_, { userId }) => {
      return await VitalSign.find({ userId }).sort({ timestamp: -1 });
    },
    getSymptomChecklists: async (_, { userId }) => {
      return await SymptomChecklist.find({ userId }).sort({ timestamp: -1 });
    },
    getTips: async (_, { userId }) => {
      return await Tip.find({ userId }).sort({ timestamp: -1 });
    },
    getEmergencyAlerts: async (_, { userId }) => {
      return await EmergencyAlert.find({ userId }).sort({ timestamp: -1 });
    },
  },
  Mutation: {
    addVitalSign: async (_, { userId, heartRate, bloodPressure, temperature, respiratoryRate }) => {
      const vitalSign = new VitalSign({
        userId,
        heartRate,
        bloodPressure,
        temperature,
        respiratoryRate,
        timestamp: new Date().toISOString(),
      });
      return await vitalSign.save();
    },
    addTip: async (_, { userId, message }) => {
      const tip = new Tip({
        userId,
        message,
        timestamp: new Date().toISOString(),
      });
      return await tip.save();
    },
    sendEmergencyAlert: async (_, { userId, message }) => {
      const alert = new EmergencyAlert({
        userId,
        message,
        timestamp: new Date().toISOString(),
      });
      return await alert.save();
    },
    predictCondition: async (_, { symptoms }) => {
      const conditions = [];
      if (symptoms.includes('fever') && symptoms.includes('cough')) {
        conditions.push('COVID-19', 'Flu');
      }
      if (symptoms.includes('shortness of breath') && symptoms.includes('chest pain')) {
        conditions.push('Heart Attack', 'Pneumonia');
      }
      return conditions.length > 0 ? conditions : ['Unknown Condition'];
    },
    submitChecklist: async (_, { userId, symptoms }) => {
      console.log(`User ${userId} submitted symptoms:`, symptoms);
      const checklist = new SymptomChecklist({
        userId,
        symptoms,
        timestamp: new Date().toISOString(),
      });
      await checklist.save();
      return 'Checklist submitted successfully!';
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
    console.log(`Vital Signs microservice ready at http://localhost:${port}${server.graphqlPath}`);
  });
});
