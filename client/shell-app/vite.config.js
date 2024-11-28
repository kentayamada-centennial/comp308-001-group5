import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shellApp',
      remotes: {
        authApp: 'http://localhost:3001/assets/remoteEntry.js',
        nurseDashboardApp: 'http://localhost:3002/assets/remoteEntry.js',
        patientDashboardApp: 'http://localhost:3003/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', '@apollo/client', 'graphql'],
    }),
  ],
});
