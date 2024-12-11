const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const csvParser = require('csv-parser');

const filePath = "../data/Disease_symptom_and_patient_profile_dataset.csv"; // Path to your CSV file

// 1. Load and Parse CSV Data
const loadCSV = async (filePath) => {
    const rows = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
};

// 2. Preprocess Data
const preprocessData = (data) => {
    const features = [];
    const labels = [];
    data.forEach(row => {
        console.log(row);
        if (row['Outcome Variable'] == 'Negative') {
            // Skip negative cases
            return;
        }
        const featureRow = [];
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
                    // Skip other columns (Cholesterol Level)
            }
        });
        features.push(featureRow);
        labels.push(row.Disease); // Collect the label
    });

    const uniqueLabels = [...new Set(labels)]; // Get unique diseases
    const labelToIndex = uniqueLabels.reduce((acc, label, index) => {
        acc[label] = index;
        return acc;
    }, {});

    const ys = labels.map(label => labelToIndex[label]); // Map labels to indices

    // console.log('Unique Labels:', uniqueLabels);
    // console.log('Label to Index:', labelToIndex);
    // console.log('Features:', features);

    return {
        xs: tf.tensor2d(features),
        ys: tf.oneHot(ys, uniqueLabels.length),
        labelToIndex,
        uniqueLabels
    };
};

// 3. Define the Model
const createModel = (inputShape, numClasses) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' })); // Multi-class classification
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
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
const predictDisease = (model, inputFeatures, uniqueLabels) => {
    const inputTensor = tf.tensor2d([inputFeatures]);
    const predictions = model.predict(inputTensor);
    const predictedIndex = predictions.argMax(-1).dataSync()[0];
    return uniqueLabels[predictedIndex];
};

// Predict top N diseases
const predictDiseases = (model, inputFeatures, uniqueLabels, topN = 3) => {
    const inputTensor = tf.tensor2d([inputFeatures]);
    const predictions = model.predict(inputTensor).arraySync()[0]; // Get raw probabilities
    const rankedDiseases = predictions
        .map((prob, index) => ({ disease: uniqueLabels[index], probability: prob }))
        .sort((a, b) => b.probability - a.probability) // Sort by probability descending
        .slice(0, topN); // Take top N diseases
    return rankedDiseases;
};

module.exports = {
    loadCSV,
    preprocessData,
    createModel,
    trainModel,
    predictDisease,
    predictDiseases
};

// Main Function
const main = async () => {
    console.log('Loading CSV...');
    const rawData = await loadCSV(filePath);
    console.log('Preprocessing Data...');
    const { xs, ys, labelToIndex, uniqueLabels } = preprocessData(rawData);
    
    console.log('Creating Model...');
    const model = createModel([xs.shape[1]], uniqueLabels.length);
    
    console.log('Training Model...');
    await trainModel(model, xs, ys);
    
    console.log('Making Predictions...');
    const testInput = [1,0,1,0,90,0,1];
    const predictedDisease = predictDisease(model, testInput, uniqueLabels);
    console.log(`Predicted Disease: ${predictedDisease}`);

    const topDiseases = predictDiseases(model, testInput, uniqueLabels, 5); // Get top 5 diseases
    console.log('Predicted Diseases and Probabilities:', topDiseases);

};

main().catch(console.error);
