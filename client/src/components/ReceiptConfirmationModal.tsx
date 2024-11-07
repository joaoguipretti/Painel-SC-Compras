import React, { useState } from 'react';
import './ReceiptConfirmationModal.css';

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (receiptData: { notaFiscal: string; atendeuNecessidade: boolean; novaFinalidade: string }) => void;
}

const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({ isOpen, onClose, onSave }) => {
  const [notaFiscal, setNotaFiscal] = useState('');
  const [atendeuNecessidade, setAtendeuNecessidade] = useState<boolean | null>(null);
  const [novaFinalidade, setNovaFinalidade] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (atendeuNecessidade !== null) {
      onSave({ notaFiscal, atendeuNecessidade, novaFinalidade });
      onClose();
    } else {
      alert('Selecione se atendeu a necessidade inicial.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2>Confirmar Recebimento</h2>
        
        <label>Nº Nota Fiscal:</label>
        <input
          type="text"
          value={notaFiscal}
          onChange={(e) => setNotaFiscal(e.target.value)}
        />

        <label>Atendeu a necessidade inicial?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="sim"
              checked={atendeuNecessidade === true}
              onChange={() => setAtendeuNecessidade(true)}
            />
            Sim
          </label>
          <label>
            <input
              type="radio"
              value="nao"
              checked={atendeuNecessidade === false}
              onChange={() => setAtendeuNecessidade(false)}
            />
            Não
          </label>
        </div>

        <label>Nova Finalidade:</label>
        <textarea
          value={novaFinalidade}
          onChange={(e) => setNovaFinalidade(e.target.value)}
        />

        <div className="button-group">
          <button className="save-button" onClick={handleSave}>Salvar</button>
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmationModal;
