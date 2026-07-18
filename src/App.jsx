import React from 'react';
import { StoreProvider } from './StoreContext';
import Layout from './Layout';

function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  );
}

export default App;

