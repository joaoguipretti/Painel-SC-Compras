import React, { useState } from 'react';
import './PurchaseRequestModal.css';

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    unidade: string;
    setor: string;
    requerente: string;
    item: string;
    necessidade: string;
    prioridade: string;
  }) => void;
}

const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({ isOpen, onClose, onSave }) => {
  const [unidade, setUnidade] = useState('');
  const [setor, setSetor] = useState('');
  const [requerente, setRequerente] = useState('');
  const [item, setItem] = useState('');
  const [necessidade, setNecessidade] = useState('');
  const [prioridade, setPrioridade] = useState('Alta');

  if (!isOpen) return null;

  const handleSave = () => {
    const requestData = { unidade, setor, requerente, item, necessidade, prioridade };
    onSave(requestData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Nova Requisição de Compra</h2>
        
        <label>Unidade:</label>
        <input type="text" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
        
        <label>Setor:</label>
        <input type="text" value={setor} onChange={(e) => setSetor(e.target.value)} />
        
        <label>Requerente:</label>
        <input type="text" value={requerente} onChange={(e) => setRequerente(e.target.value)} />
        
        <label>Item:</label>
        <input type="text" value={item} onChange={(e) => setItem(e.target.value)} />
        
        <label>Prioridade:</label>
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </select>

        <label>Necessidade:</label>
        <textarea value={necessidade} onChange={(e) => setNecessidade(e.target.value)} />

        <div className="button-group">
          <button className="save-button" onClick={handleSave}>Salvar</button>
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestModal;
