import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Box, Button, TextField, Typography, Container, Alert, Select, MenuItem } from '@mui/material';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      role
    }
  }
`;

const SIGNUP_MUTATION = gql`
  mutation Signup($username: String!, $password: String!, $role: String!) {
    signup(username: $username, password: $password, role: $role) {
      id
    }
  }
`;

const Auth = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [login, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_MUTATION);
  const [signup, { loading: signupLoading, error: signupError }] = useMutation(SIGNUP_MUTATION);

  const handleLogin = async () => {
    try {
      const response = await login({
        variables: { username, password },
      });
      const { id, role } = response.data.login;
      localStorage.setItem('userId', id);
      localStorage.setItem('userRole', role);
      onLogin(role);
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleSignup = async () => {
    try {
      const response = await signup({
        variables: { username, password, role },
      });
      localStorage.setItem('userId', response.data.signup.id);
      onLogin(role);
    } catch (err) {
      console.error('Signup failed', err);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {isSignupMode ? 'Sign Up' : 'Login'}
        </Typography>
        <Box component="form" sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignupMode && (
            <Select
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ mt: 2 }}
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="nurse">Nurse</MenuItem>
            </Select>
          )}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={isSignupMode ? handleSignup : handleLogin}
            disabled={isSignupMode ? signupLoading : loginLoading}
          >
            {isSignupMode ? (signupLoading ? 'Signing up...' : 'Sign Up') : (loginLoading ? 'Logging in...' : 'Login')}
          </Button>
          {(loginError || signupError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {isSignupMode ? `Signup failed: ${signupError?.message}` : `Login failed: ${loginError?.message}`}
            </Alert>
          )}
          <Button
            color="secondary"
            onClick={() => setIsSignupMode(!isSignupMode)}
            sx={{ mt: 2 }}
          >
            {isSignupMode ? 'Already have an account? Log in' : 'Don’t have an account? Sign up'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Auth;
