import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox
} from '@mui/material';

const SUBMIT_CHECKLIST = gql`
  mutation SubmitChecklist($userId: ID!, $symptoms: [String!]!) {
    submitChecklist(userId: $userId, symptoms: $symptoms)
  }
`;

const GET_PATIENT_INFO = gql`
  query GetPatientInfo($id: ID!) {
    getPatientInfo(id: $id) {
      username
    }
  }
`;

const GET_TIPS = gql`
  query GetTips($userId: ID!) {
    getTips(userId: $userId) {
      id
      message
      timestamp
    }
  }
`;

const SEND_EMERGENCY_ALERT = gql`
  mutation SendEmergencyAlert($userId: ID!, $message: String!) {
    sendEmergencyAlert(userId: $userId, message: $message) {
      id
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

const SYMPTOMS = [
  'Fever',
  'Cough',
  'Shortness of Breath',
  'Sore Throat',
  'Fatigue',
  'Loss of Taste or Smell',
  'Congestion',
  'Headache',
];

const PatientDashboard = () => {
  const [userId, setUserId] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [sendEmergencyAlert] = useMutation(SEND_EMERGENCY_ALERT);
  const [addVitalSign] = useMutation(ADD_VITAL_SIGN);
  const [submitChecklist] = useMutation(SUBMIT_CHECKLIST);
  const { data: patientData, loading: patientLoading, error: patientError } = useQuery(GET_PATIENT_INFO, {
    variables: { id: userId },
    skip: !userId,
  });
  const { data, loading, error } = useQuery(GET_TIPS, {
    variables: { userId },
    skip: !userId,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      alert('No user ID found. Please log in again.');
      window.location.href = '/';
    }
  }, []);

  const handleSendEmergencyAlert = async () => {
    await sendEmergencyAlert({
      variables: { userId, message: emergencyMessage },
    });
    setEmergencyMessage('');
    alert('Emergency Alert Sent!');
  };

  const handleSymptomChange = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddVitalSign = async () => {
    await addVitalSign({
      variables: {
        userId,
        heartRate: parseInt(heartRate),
        bloodPressure,
        temperature: parseFloat(temperature),
        respiratoryRate: parseInt(respiratoryRate),
      },
    });
    setHeartRate('');
    setBloodPressure('');
    setTemperature('');
    setRespiratoryRate('');
    alert('Vital Signs Added!');
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom before submitting.');
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('No user ID found. Please log in again.');
        return;
      }

      await submitChecklist({ variables: { userId, symptoms: selectedSymptoms } });
      setSubmissionMessage('Checklist submitted successfully!');
      setSelectedSymptoms([]);
    } catch (error) {
      console.error('Error submitting checklist:', error);
      setSubmissionMessage('Failed to submit checklist. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" align="center" gutterBottom>
        Patient Dashboard
      </Typography>
      {!userId || patientLoading ? (
        <CircularProgress />
      ) : patientError ? (
        <Alert severity="error">{patientError.message}</Alert>
      ) : (
        <Box mt={4}>
          <Box>
            <Typography variant="h4" align="center">
              Welcome, {patientData?.getPatientInfo?.username}
            </Typography>
            <Typography variant="h6">Send Emergency Alert</Typography>
            <TextField
              label="Emergency Message"
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              onClick={handleSendEmergencyAlert}
              variant="contained"
              color="error"
            >
              Send Emergency Alert
            </Button>
          </Box>
          <Box mt={4}>
            <Typography variant="h6">Add Daily Vital Signs</Typography>
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
          </Box>
          <Box mt={4}>
          <Typography variant="h4" align="center" gutterBottom>
        Symptom Checklist
      </Typography>
        <Box mt={4}>
          <Typography variant="h6">Select Your Symptoms</Typography>
          {SYMPTOMS.map((symptom) => (
            <FormControlLabel
              key={symptom}
              control={
                <Checkbox
                  checked={selectedSymptoms.includes(symptom)}
                  onChange={() => handleSymptomChange(symptom)}
                />
              }
              label={symptom}
            />
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            Submit Checklist
          </Button>
          {submissionMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {submissionMessage}
            </Alert>
          )}
        </Box>
          </Box>
          <Box mt={4}>
            <Typography variant="h6">Motivational Tips</Typography>
            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error.message}</Alert>}
            {data && (
              <List>
                {data.getTips.map((tip) => (
                  <ListItem key={tip.id}>
                    <ListItemText
                      primary={tip.message}
                      secondary={new Date(
                        parseInt(tip.timestamp)
                      ).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PatientDashboard;
