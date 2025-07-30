import React from 'react';
import AppWithStores from './AppWithStores';

/**
 * Main App component that uses Zustand stores instead of React Context
 *
 * This is the entry point that has been migrated from using multiple
 * React Context providers to using Zustand stores for state management.
 *
 * Benefits:
 * - Reduced provider nesting (from 6 to 0)
 * - Better performance with selective re-renders
 * - Smaller bundle size
 * - Enhanced developer experience
 */
const App: React.FC = () => {
  return <AppWithStores />;
};

export default App;
