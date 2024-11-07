import React, { useState } from 'react';
import './UserRegistration.css';


const UserRegistration: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADM TI');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      setMessage('Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, cargo: role }),
      });

      if (response.ok) {
        setMessage('Usuário registrado com sucesso!');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Erro ao registrar usuário');
      }
    } catch (error) {
      console.error('Erro ao registrar o usuário:', error);
      setMessage('Erro ao registrar o usuário');
    }
  };

  return (
    <div className="registration-container">
      <h2>Cadastro de Usuário</h2>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite o email"
        />
      </div>
      <div className="form-group">
        <label>Senha:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite a senha"
        />
      </div>
      <div className="form-group">
        <label>Cargo:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ADM TI">ADM TI</option>
          <option value="Service Desk">Service Desk</option>
          <option value="Aprovador">Aprovador</option>
        </select>
      </div>
      <button onClick={handleRegister}>Registrar Usuário</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UserRegistration;
