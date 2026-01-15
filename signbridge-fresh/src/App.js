import './App.css';
import React, { useState } from 'react';
import Layout from './Layout';
import Communicate from './pages/Communicate';
import History from './pages/History';
import About from './pages/About';

function App() {
  const [route, setRoute] = useState('communicate');

  return (
    <div className="App">
      <Layout onNav={setRoute} current={route}>
        {route === 'communicate' && <Communicate />}
        {route === 'history' && <History />}
        {route === 'about' && <About />}
      </Layout>
    </div>
  );
}

export default App;
