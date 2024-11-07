import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Armazena o token e o cargo do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.cargo); // Certifique-se de usar 'cargo' se o backend retornar 'cargo'
      console.log("Cargo do usuário:", data.cargo);

      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Campos de login */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
        />
        <button type="submit">Entrar</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;
