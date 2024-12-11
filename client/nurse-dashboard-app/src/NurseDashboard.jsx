import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql, useLazyQuery } from '@apollo/client';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  Container,
  Alert,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';

const GET_PATIENTS = gql`
  query GetPatients {
    getPatients {
      id
      username
    }
  }
`;

const ADD_TIP = gql`
  mutation AddTip($userId: ID!, $message: String!) {
    addTip(userId: $userId, message: $message) {
      id
    }
  }
`;

const GET_VITAL_SIGNS = gql`
  query GetVitalSigns($userId: ID!) {
    getVitalSigns(userId: $userId) {
      id
      heartRate
      bloodPressure
      temperature
      respiratoryRate
      timestamp
    }
  }
`;

const ADD_VITAL_SIGN = gql`
  mutation AddVitalSign(
    $userId: ID!
    $heartRate: Int
    $bloodPressure: String
    $temperature: Float
    $respiratoryRate: Int
  ) {
    addVitalSign(
      userId: $userId
      heartRate: $heartRate
      bloodPressure: $bloodPressure
      temperature: $temperature
      respiratoryRate: $respiratoryRate
    ) {
      id
    }
  }
`;

const GET_SYMPTOMS_CHECKLISTS = gql`
  query GetSymptomsChecklists($userId: ID!) {
    getSymptomChecklists(userId: $userId) {
      id
      symptoms
      timestamp
    }
  }
`;

const GET_NURSE_INFO = gql`
  query GetNurseInfo($id: ID!) {
    getPatientInfo(id: $id) {
      username
    }
  }
`;

const PREDICT_CONDITION = gql`
  query PredictCondition($features: PredictFeatures) {
    predictCondition(features: $features) {
      disease
      probability
    }
  }
`;

const NurseDashboard = () => {
  const [userId, setUserId] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [addTip] = useMutation(ADD_TIP);
  const { data: patientsData, loading: patientsLoading, error: patientsError } = useQuery(GET_PATIENTS);
  const { data: vitalsData, loading: vitalsLoading, error: vitalsError, refetch } = useQuery(GET_VITAL_SIGNS, {
    variables: { userId: selectedPatientId },
    skip: !selectedPatientId,
  });
  const { data: symptomsData, loading: symptomsLoading, error: symptomsError } = useQuery(GET_SYMPTOMS_CHECKLISTS, {
    variables: { userId: selectedPatientId },
    skip: !selectedPatientId,
  });
  const [addVitalSign] = useMutation(ADD_VITAL_SIGN);
  const { data: nurseData, loading: nurseLoading, error: nurseError } = useQuery(GET_NURSE_INFO, {
    variables: { id: userId },
    skip: !userId,
  });
  const [ predictionFeatures, setPredictionFeatures ] = useState({
    fever: true,
    cough: false,
    fatigue: true,
    difficultyBreathing: false,
    age: 25,
    gender: 'Male',
    bloodPressure: 120,
  });
  const [predictCondition, { loading: predictionLoading, error: predictionError, data: predictionData }] = useLazyQuery(PREDICT_CONDITION);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      alert('No user ID found. Please log in again.');
      window.location.href = '/';
    }
  }, []);

  const handleSendTip = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient before sending a tip.');
      return;
    }
    if (!tipMessage.trim()) {
      alert('Tip message cannot be empty.');
      return;
    }
    try {
      await addTip({ variables: { userId: selectedPatientId, message: tipMessage } });
      setTipMessage('');
      alert('Motivational tip sent successfully!');
    } catch (error) {
      console.error('Error sending tip:', error);
      alert('Failed to send the tip. Please try again.');
    }
  };

  const handleAddVitalSign = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }
    await addVitalSign({
      variables: {
        userId: selectedPatientId,
        heartRate: parseInt(heartRate),
        bloodPressure,
        temperature: parseFloat(temperature),
        respiratoryRate: parseInt(respiratoryRate),
      },
    });
    refetch();
    setHeartRate('');
    setBloodPressure('');
    setTemperature('');
    setRespiratoryRate('');
    alert('Vital Signs Added!');
  };

  const handlePrediction = async () => {
    await predictCondition({ 
      variables: {
        features: predictionFeatures
      },
      skip: !selectedPatientId,
    });
    console.log("Prediction Features: ", predictionFeatures);
  }
  useEffect(() => {
    if (predictionData) {
      console.log("Prediction: ", predictionData);
    }
  }, [predictionData]);
  useEffect(() => {
    let row = vitalsData?.getVitalSigns?.[0];
    if (row) {
      console.log("Latest Vitals: ", row);
      setPredictionFeatures({
        ...predictionFeatures,
        bloodPressure: parseInt(row.bloodPressure),
      })
    }
  }, [vitalsData]);
  useEffect(() => {
    let row = symptomsData?.getSymptomChecklists?.[0];
    if (row) {
      console.log("Latest Symptoms: ", row);
      let symptoms = row.symptoms;
      setPredictionFeatures({
        ...predictionFeatures,
        fever: symptoms.includes('Fever'),
        cough: symptoms.includes('Cough'),
        fatigue: symptoms.includes('Fatigue'),
        difficultyBreathing: symptoms.includes('Shortness of Breath'),
      })
    }
  }, [symptomsData]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" align="center" gutterBottom>
        Nurse Dashboard
      </Typography>
      {patientsLoading || nurseLoading ? (
        <CircularProgress />
      ) : patientsError || nurseError ? (
        <Alert severity="error">{patientsError.message}</Alert>
      ) : (
        <Box mt={4}>
          <Typography variant="h4" align="center">
            Welcome, {nurseData?.getPatientInfo?.username}
          </Typography>
          <Typography variant="h6">Select Patient</Typography>
          <Select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            fullWidth
          >
            <MenuItem value="" disabled>
              Select a Patient
            </MenuItem>
            {patientsData.getPatients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.username}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}
      {selectedPatientId && (
        <Box mt={4}>
          <Typography variant="h6">Patient Vital Signs</Typography>
          {vitalsLoading ? (
            <CircularProgress />
          ) : vitalsError ? (
            <Alert severity="error">{vitalsError.message}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Heart Rate</TableCell>
                    <TableCell>Blood Pressure</TableCell>
                    <TableCell>Temperature</TableCell>
                    <TableCell>Respiratory Rate</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vitalsData?.getVitalSigns?.map((vital) => (
                    <TableRow key={vital.id}>
                      <TableCell>{vital.heartRate}</TableCell>
                      <TableCell>{vital.bloodPressure}</TableCell>
                      <TableCell>{vital.temperature}</TableCell>
                      <TableCell>{vital.respiratoryRate}</TableCell>
                      <TableCell>
                        {new Date(parseInt(vital.timestamp)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
      {selectedPatientId && (
        <Box mt={4}>
          <Typography variant="h6">Patient Symptoms</Typography>
          {symptomsLoading ? (
            <CircularProgress />
          ) : symptomsError ? (
            <Alert severity="error">{symptomsError.message}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symptoms</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {symptomsData?.getSymptomChecklists?.map((symptoms) => (
                    <TableRow key={symptoms.id}>
                      <TableCell>{symptoms.symptoms.join(', ')}</TableCell>
                      <TableCell>
                        {new Date(parseInt(symptoms.timestamp)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
      {selectedPatientId && (
        <Box mt={4}>
          <Typography variant="h6">Predict Condition</Typography>
          <TextField
            label="Age"
            value={predictionFeatures.age}
            onChange={(e) => setPredictionFeatures({ ...predictionFeatures, age: parseInt(e.target.value) })}
            fullWidth
            margin="normal"
          />
          <Box mt={2}>
            <Typography variant="h6">Gender</Typography>
            <RadioGroup
              row
              value={predictionFeatures.gender}
              onChange={(e) => setPredictionFeatures({ ...predictionFeatures, gender: e.target.value })}
            >
              <FormControlLabel value="Male" control={<Radio />} label="Male" />
              <FormControlLabel value="Female" control={<Radio />} label="Female" />
            </RadioGroup>
          </Box>
          <Button onClick={handlePrediction} variant="contained" color="primary">
            Predict
          </Button>
          {predictionLoading ? (
            <CircularProgress />
          ) : predictionError ? (
            <Alert severity="error">{predictionError.message}</Alert>
          ) : (predictionData ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Disease</TableCell>
                    <TableCell>Probability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictionData?.predictCondition?.map((condition) => (
                    <TableRow key={condition.id}>
                      <TableCell>{condition.disease}</TableCell>
                      <TableCell>{(condition.probability * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null)}
        </Box>
      )}
      {selectedPatientId && (
        <Box mt={4}>
          <Typography variant="h6">Add Vital Signs</Typography>
          <TextField
            label="Heart Rate"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Blood Pressure"
            value={bloodPressure}
            onChange={(e) => setBloodPressure(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Temperature"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Respiratory Rate"
            value={respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button
            onClick={handleAddVitalSign}
            variant="contained"
            color="primary"
          >
            Add Vital Sign
          </Button>
          <Box mt={4}>
            <Typography variant="h6">Send Motivational Tip</Typography>
            <TextField
              label="Tip Message"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button onClick={handleSendTip} variant="contained" color="primary">
              Send Tip
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default NurseDashboard;
