import React, { useState } from 'react';
import './ReusableModal.css';

interface ReusableModalProps {
  isOpen: boolean;
  title: string;
  inputPlaceholder: string;
  onClose: () => void;
  onSave: (inputValue: string) => void;
}

const ReusableModal: React.FC<ReusableModalProps> = ({ isOpen, title, inputPlaceholder, onClose, onSave }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSave = () => {
    onSave(inputValue);
    setInputValue("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={inputPlaceholder}
        />
        <div className="button-group">
          <button className="save-button" onClick={handleSave}>Salvar</button>
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ReusableModal;
