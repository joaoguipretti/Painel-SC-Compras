import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserRegistration from './components/UserRegistration'; // Atualize o caminho conforme necessário

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route path="/register" element={<UserRegistration />} /> {/* Rota para a tela de cadastro */}
      </Routes>
    </Router>
  );
};

export default App;
