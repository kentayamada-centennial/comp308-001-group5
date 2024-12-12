const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const csvParser = require('csv-parser');
const faker = require('@faker-js/faker');

// Dataset Source: https://www.kaggle.com/datasets/uom190346a/disease-symptoms-and-patient-profile-dataset
const filePath = "data/Disease_symptom_and_patient_profile_dataset.csv"; // Path to your CSV file

// 1. Load and Parse CSV Data
const loadCSV = async () => {
    const rows = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
};

const generateSyntheticSamples = (minoritySamples, count) => {
    const syntheticSamples = [];
    for (let i = 0; i < count; i++) {
        const randomSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
        const syntheticSample = randomSample.map(value =>
            typeof value === 'number'
                ? value + faker.datatype.float({ min: -0.1, max: 0.1 }) // Add small noise to numerical values
                : value // Keep categorical values unchanged
        );
        syntheticSamples.push(syntheticSample);
    }
    return syntheticSamples;
};

// 2. Preprocess Data
const preprocessData = (data) => {
    const features = [];
    const labels = [];
    const allDiseases = new Set();

    data.forEach(row => {
        if (row['Outcome Variable'] === 'Negative') return; // Skip negative cases

        const diseases = row.Disease.split(','); // Assuming multiple diseases are comma-separated
        diseases.forEach(d => allDiseases.add(d.trim())); // Collect all unique diseases
    });

    const uniqueLabelsArray = Array.from(allDiseases);

    const classSamples = {}; // Collect samples by class
    data.forEach(row => {
        if (row['Outcome Variable'] === 'Negative') return; // Skip negative cases

        const featureRow = [];
        const diseases = row.Disease.split(',');

        Object.keys(row).forEach(key => {
            switch (key) {
                case 'Disease':
                    break;
                case 'Fever':
                case 'Cough':
                case 'Fatigue':
                case 'Difficulty Breathing':
                    featureRow.push(row[key] === 'Yes' ? 1 : 0);
                    break;
                case 'Age':
                    featureRow.push(parseInt(row[key]) || 0);
                    break;
                case 'Gender':
                    featureRow.push(row[key] === 'Male' ? 1 : 0);
                    break;
                case 'Blood Pressure':
                    if (row[key] === 'High') featureRow.push(1);
                    else if (row[key] === 'Low') featureRow.push(-1);
                    else featureRow.push(0);
                    break;
                default:
                    break;
            }
        });

        features.push(featureRow);

        const labelRow = uniqueLabelsArray.map(disease =>
            diseases.includes(disease) ? 1 : 0
        );
        labels.push(labelRow);

        // Save feature and label for each disease
        diseases.forEach(disease => {
            if (!classSamples[disease]) classSamples[disease] = [];
            classSamples[disease].push({ featureRow, labelRow });
        });
    });

    // Identify minority classes and generate synthetic samples
    // const maxClassSize = Math.max(...Object.values(classSamples).map(samples => samples.length));
    // Object.entries(classSamples).forEach(([disease, samples]) => {
    //     const additionalSamples = maxClassSize - samples.length;
    //     if (additionalSamples > 0) {
    //         const minorityFeatures = samples.map(s => s.featureRow);
    //         const syntheticFeatures = generateSyntheticSamples(minorityFeatures, additionalSamples);

    //         // Add synthetic samples to the dataset
    //         syntheticFeatures.forEach(featureRow => {
    //             features.push(featureRow);
    //             const labelRow = uniqueLabelsArray.map(d => (d === disease ? 1 : 0));
    //             labels.push(labelRow);
    //         });
    //     }
    // });

    const featureTensor = tf.tensor2d(features);
    const mean = featureTensor.mean(0);
    const std = featureTensor.sub(mean).pow(2).mean(0).sqrt();

    const normalizedFeatures = featureTensor.sub(mean).div(std);

    const labelTensor = tf.tensor2d(labels, [labels.length, uniqueLabelsArray.length]);

    return {
        xs: normalizedFeatures,
        ys: labelTensor,
        uniqueLabels: uniqueLabelsArray,
        normalization: { mean, std },
    };
};




// 3. Define the Model
const createModel = (inputShape, numClasses) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'sigmoid' })); // Multi-label output
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy', // Multi-label loss function
        metrics: ['accuracy']
    });
    return model;
};

// 4. Train the Model
const trainModel = async (model, xs, ys) => {
    // Due to poor data quality, we will use a validation size and higher patience
    await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.1,
        callbacks: tf.callbacks.earlyStopping({ patience: 10 })
    });
    console.log('Training Complete');
};

// 5. Make Predictions

// Predict a single disease
const predictDisease = (model, inputFeatures, uniqueLabels, threshold = 0.5) => {
    const inputTensor = tf.tensor2d([inputFeatures]); // Normalize input features
    const predictions = model.predict(inputTensor).arraySync()[0]; // Get raw probabilities
    const possibleDiseases = predictions
        .map((prob, index) => ({ disease: uniqueLabels[index], probability: prob }))
        .filter(disease => disease.probability >= threshold); // Only include diseases above threshold
    return possibleDiseases;
};

// Predict top N diseases
const predictDiseases = (model, inputFeatures, uniqueLabels, normalization, threshold = 0.5) => {
    const { mean, std } = normalization;
    const normalizedInput = tf.tensor2d([inputFeatures]).sub(mean).div(std); // Normalize input
    const predictions = model.predict(normalizedInput).arraySync()[0]; // Get raw probabilities
    const possibleDiseases = predictions
        .map((prob, index) => ({ disease: uniqueLabels[index], probability: prob }))
        .filter(disease => disease.probability >= threshold) // Only include diseases above threshold
        .sort((a, b) => b.probability - a.probability); // Sort by probability in descending order
    return possibleDiseases;
};



module.exports = {
    loadCSV,
    preprocessData,
    createModel,
    trainModel,
    predictDisease,
    predictDiseases
};

// // Main Function
// const main = async () => {
//     console.log('Loading CSV...');
//     const rawData = await loadCSV();
//     console.log('Preprocessing Data...');
//     const { xs, ys, uniqueLabels, normalization } = preprocessData(rawData);

//     // console.log('Class Distribution After Balancing:');
//     // const classDistribution = labels.reduce((acc, label) => {
//     //     label.forEach((value, index) => {
//     //         acc[index] = (acc[index] || 0) + value;
//     //     });
//     //     return acc;
//     // }, {});
//     // console.log(classDistribution);

//     console.log('Creating Model...');
//     const model = createModel([xs.shape[1]], uniqueLabels.length);

//     console.log('Training Model...');
//     await trainModel(model, xs, ys);

//     console.log('Making Predictions...');
//     const testInput = [1, 1, 1, 1, 25, 0, 0]; // Example input features
//     const predictedDiseases = predictDiseases(model, testInput, uniqueLabels, normalization, 0.02);
//     console.log('Predicted Diseases and Probabilities:', predictedDiseases);
// };


// main().catch(console.error);
