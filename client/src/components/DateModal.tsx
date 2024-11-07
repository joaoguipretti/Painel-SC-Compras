import React, { useState } from 'react';

interface DateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
}

const DateModal: React.FC<DateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(selectedDate);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '300px' }}>
        <h2>Selecionar Data de Aguardando</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button onClick={handleSave} style={{ marginRight: '10px' }}>Salvar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default DateModal;
