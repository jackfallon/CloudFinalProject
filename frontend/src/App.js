import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import EventList from './components/EventList';
import CreateEvent from './components/CreateEvent';
import EventDetails from './components/EventDetails';

window.DEBUG_LOG = window.DEBUG_LOG || ((...args) => {
  if (process.env.REACT_APP_DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
});

window.DEBUG_LOG('Environment variables:', {
  REGION: process.env.REACT_APP_REGION,
  USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID,
  USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  API_URL: process.env.REACT_APP_API_URL
});

// Configure Amplify
const amplifyConfig = {
  Auth: {
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  },
  API: {
    endpoints: [
      {
        name: 'events',
        endpoint: process.env.REACT_APP_API_URL,
        region: process.env.REACT_APP_REGION
      }
    ]
  }
};

window.DEBUG_LOG('Amplify config:', amplifyConfig);
Amplify.configure(amplifyConfig);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  useEffect(() => {
    // Check authentication status
    Auth.currentAuthenticatedUser()
      .then(user => window.DEBUG_LOG('Current user:', user))
      .catch(err => window.DEBUG_LOG('Auth error:', err));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator>
        {({ signOut, user }) => {
          window.DEBUG_LOG('Authenticated user:', user);
          return (
            <Router>
              <Navigation signOut={signOut} user={user} />
              <Routes>
                <Route path="/" element={<EventList />} />
                <Route path="/create-event" element={<CreateEvent />} />
                <Route path="/event/:id" element={<EventDetails />} />
              </Routes>
            </Router>
          );
        }}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;
