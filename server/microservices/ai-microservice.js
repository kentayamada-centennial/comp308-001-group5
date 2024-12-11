const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { buildFederatedSchema } = require('@apollo/federation');
const cors = require('cors');


const { loadCSV, preprocessData, createModel, trainModel, predictDiseases } = require('../misc/PredictionModel');

const app = express();
const port = 3006;
app.use(cors());


async function initializeModel() {
    console.log('Loading CSV...');
    const rawData = await loadCSV();
    console.log('Preprocessing Data...');
    const { xs, ys, uniqueLabels, normalization } = preprocessData(rawData);

    console.log('Creating Model...');
    const model = createModel([xs.shape[1]], uniqueLabels.length);

    console.log('Training Model...');
    await trainModel(model, xs, ys);

    return { model, uniqueLabels, normalization };
}

let model, uniqueLabels, normalization;

async function initialize() {
    const result = await initializeModel();
    model = result.model;
    uniqueLabels = result.uniqueLabels;
    normalization = result.normalization;
}

initialize().catch(console.error);
console.log('Model initialized:', model);
console.log('Unique labels:', uniqueLabels);
console.log('Normalization parameters:', normalization);



const typeDefs = gql`
    input PredictFeatures {
        fever: Boolean,
        cough: Boolean,
        fatigue: Boolean,
        difficultyBreathing: Boolean,
        age: Int,
        gender: String,
        bloodPressure: Int
    }

    type PredictResult {
        disease: String,
        probability: Float
    }

    type Query {
        predictCondition(features: PredictFeatures): [PredictResult]
    }
`;

const resolvers = {
    Query: {
        predictCondition: async (parent, args, context) => {
            const { fever, cough, fatigue, difficultyBreathing, age, gender, bloodPressure } = args.features;
            let feverValue = fever ? 1 : 0;
            let coughValue = cough ? 1 : 0;
            let fatigueValue = fatigue ? 1 : 0;
            let difficultyBreathingValue = difficultyBreathing ? 1 : 0;
            let genderValue = gender === 'Male' ? 1 : 0;
            let bloodPressureValue;
            if (bloodPressure >= 120) {
                bloodPressureValue = 1;
            } else if (bloodPressure < 80) {
                bloodPressureValue = -1;
            } else {
                bloodPressureValue = 0;
            }

            console.log('Making Predictions...');
            const testInput = [feverValue, coughValue, fatigueValue, difficultyBreathingValue, age, genderValue, bloodPressureValue];
            const predictedDiseases = predictDiseases(model, testInput, uniqueLabels, normalization, 0.04);
            console.log('Predicted Diseases and Probabilities:', predictedDiseases);
        

            return predictedDiseases;
        }
    }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
});

server.start().then(() => {
  server.applyMiddleware({ app });
  app.listen(port, () => {
    console.log(`AI microservice ready at http://localhost:${port}${server.graphqlPath}`);
  });
});