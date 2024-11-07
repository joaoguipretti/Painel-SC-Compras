import React, { useEffect, useState } from 'react';
import PurchaseRequestModal from './PurchaseRequestModal';
import DateModal from './DateModal';
import ReceiptConfirmationModal from './ReceiptConfirmationModal';
import ReusableModal from './ReusableModal';
import './Dashboard.css';

interface DataItem {
  id: number;
  unidade: string;
  setor: string;
  requerente: string;
  item: string;
  necessidade: string;
  prioridade: string;
  status: 'Pendente' | 'Aceito' | 'Recusado' | 'Finalizado';
  dataPrevista?: string;
  numeroChamado?: string;
  numeroPedido?: string;
  notaFiscal?: string;             // Adicionado fora de 'recebimento'
  novaFinalidade?: string;         // Adicionado fora de 'recebimento'
  atendeuNecessidade?: boolean;    // Adicionado fora de 'recebimento'
  showActions?: boolean;
}


const Dashboard: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [userRole, setUserRole] = useState<string>(''); // Variável para armazenar o cargo do usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isChamadoModalOpen, setIsChamadoModalOpen] = useState(false);
  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [unidade, setUnidade] = useState<string>('');
  const [setor, setSetor] = useState<string>('');
  const [requerente, setRequerente] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [necessidade, setNecessidade] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('Alta');

  useEffect(() => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }
  
    const fetchUserRole = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/user/cargo', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          throw new Error('Token inválido ou expirado. Faça login novamente.');
        }
        if (!response.ok) throw new Error('Erro ao buscar o cargo do usuário');
        const responseData = await response.json();
        setUserRole(responseData.cargo || '');
      } catch (error) {
        console.error('Erro ao buscar o cargo do usuário:', error);
        alert(error.message);
      }
    };
  
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
    
      try {
        const response = await fetch('http://localhost:3001/api/requests', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        const responseData = await response.json();
        
        // Verifique se os dados estão sendo recebidos corretamente
        console.log("Dados recebidos do backend:", responseData.requests);
    
        // Atualize o estado com os dados recebidos
        setData(responseData.requests);
      } catch (error) {
        console.error('Erro ao buscar os requests:', error);
      }
    };
    
    fetchUserRole();
    fetchRequests();
  }, []);
  

  const canCreateRequest = userRole === 'ADM TI';
  const canApprove = userRole === 'Aprovador';

  const handleOpenModal = () => {
    if (canCreateRequest) {
      setIsModalOpen(true);
    } else {
      alert('Você não tem permissão para criar uma requisição de compra.');
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveRequest = async (requestData: {
    unidade: string;
    setor: string;
    requerente: string;
    item: string;
    necessidade: string;
    prioridade: string;
  }) => {
    const { unidade, setor, requerente, item, necessidade, prioridade } = requestData;
    if (!unidade || !setor || !requerente || !item || !necessidade || !prioridade) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ unidade, setor, requerente, item, necessidade, prioridade }),
      });
      if (!response.ok) throw new Error('Erro ao criar a requisição');
      alert('Requisição criada com sucesso!');
      setData((prevData) => [{ id: new Date().getTime(), ...requestData }, ...prevData]); // Adiciona ao topo
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro ao criar a requisição');
    }
  };

  const handleRowClick = (id: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, showActions: !item.showActions } : item
      )
    );
  };

  const handleAction = async (id: number, action: string) => {
    let statusToUpdate = '';
    let dataPrevista;

    if (action === 'Confirmar') {
      statusToUpdate = 'Aceito';
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, showActions: false } : item
        )
      );
    } else if (action === 'Recusar') {
      statusToUpdate = 'Recusado';
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, showActions: false } : item
        )
      );
    } else if (action === 'Aguardar') {
      statusToUpdate = 'Pendente';
      setSelectedRow(id);
      setIsDateModalOpen(true);
      return;
    } else if (action === 'Confirmar Recebimento') {
      setSelectedRow(id);
      setIsReceiptModalOpen(true); // Abre o modal de confirmação de recebimento
      return;
    }

    if (statusToUpdate) {
      try {
        const response = await fetch(`http://localhost:3001/api/request/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: statusToUpdate, dataPrevista }),
        });
        if (!response.ok) throw new Error('Erro ao atualizar o status da requisição');
        alert('Status atualizado com sucesso!');
        setData((prevData) =>
          prevData.map((item) =>
            item.id === id ? { ...item, status: statusToUpdate, dataPrevista } : item
          )
        );
      } catch (error) {
        console.error('Erro ao atualizar o status da requisição:', error);
        alert('Erro ao atualizar o status da requisição');
      }
    }
  };

  const handleReceiptSave = async (receiptData: { notaFiscal: string; atendeuNecessidade: boolean; novaFinalidade: string }) => {
    if (selectedRow !== null) {
      try {
        const response = await fetch(`http://localhost:3001/api/request/${selectedRow}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: 'Finalizado',
            notaFiscal: receiptData.notaFiscal,
            atendeuNecessidade: receiptData.atendeuNecessidade,
            novaFinalidade: receiptData.novaFinalidade,
          }),
        });
        if (!response.ok) throw new Error('Erro ao salvar as informações da Nota Fiscal');
        alert('Recebimento confirmado com sucesso!');
        
        // Atualize os dados no estado imediatamente após o salvamento
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedRow
              ? {
                  ...item,
                  status: 'Finalizado',
                  recebimento: {
                    notaFiscal: receiptData.notaFiscal,
                    atendeuNecessidade: receiptData.atendeuNecessidade,
                    novaFinalidade: receiptData.novaFinalidade,
                  },
                  showActions: false,
                }
              : item
          )
        );
        setIsReceiptModalOpen(false);
        setSelectedRow(null);
      } catch (error) {
        console.error('Erro ao salvar as informações da Nota Fiscal:', error);
        alert('Erro ao salvar as informações da Nota Fiscal');
      }
    }
  };
  

  const handleDateSave = async (date: string) => {
    if (selectedRow !== null) {
      try {
        const response = await fetch(`http://localhost:3001/api/request/${selectedRow}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: 'Pendente', dataPrevista: date }),
        });
        if (!response.ok) throw new Error('Erro ao salvar a data prevista');
        alert('Data prevista salva com sucesso!');
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedRow ? { ...item, status: 'Pendente', dataPrevista: date } : item
          )
        );
        setIsDateModalOpen(false);
        setSelectedRow(null);
      } catch (error) {
        console.error('Erro ao salvar a data prevista:', error);
        alert('Erro ao salvar a data prevista');
      }
    }
  };

  const handleChamadoSave = async (numeroChamado: string) => {
    if (selectedRow !== null) {
      try {
        const response = await fetch(`http://localhost:3001/api/request/${selectedRow}/chamado`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ numeroChamado }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar o número do chamado');
        }

        alert('Número do chamado salvo com sucesso!');
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedRow ? { ...item, numeroChamado } : item
          )
        );
        setIsChamadoModalOpen(false);
        setSelectedRow(null);
      } catch (error) {
        console.error('Erro ao salvar o número do chamado:', error);
        alert('Erro ao salvar o número do chamado');
      }
    }
  };

  const handlePedidoSave = async (numeroPedido: string) => {
    if (selectedRow !== null) {
      try {
        const response = await fetch(`http://localhost:3001/api/request/${selectedRow}/pedido`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ numeroPedido }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar o número do pedido');
        }

        alert('Número do pedido salvo com sucesso!');
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedRow ? { ...item, numeroPedido } : item
          )
        );
        setIsPedidoModalOpen(false);
        setSelectedRow(null);
      } catch (error) {
        console.error('Erro ao salvar o número do pedido:', error);
        alert('Erro ao salvar o número do pedido');
      }
    }
  };

  const getStatusColor = (status: 'Pendente' | 'Aceito' | 'Recusado' | 'Finalizado') => {
    switch (status) {
      case 'Aceito':
        return 'green';
      case 'Recusado':
        return 'red';
      case 'Finalizado':
        return 'black';
      default:
        return 'orange';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Requisições de Compra</h2>
        {canCreateRequest && (
          <button className="dashboard-button" onClick={handleOpenModal}>
            Criar Requisição de Compra
          </button>
        )}
      </header>
      <div className="dashboard-table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unidade</th>
              <th>Setor</th>
              <th>Requerente</th>
              <th>Item</th>
              <th className="necessidade-column">Necessidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <React.Fragment key={item.id}>
                  <tr onClick={() => handleRowClick(item.id)}>
                    <td>{item.id}</td>
                    <td>{item.unidade}</td>
                    <td>{item.setor}</td>
                    <td>{item.requerente}</td>
                    <td>{item.item}</td>
                    <td className="necessidade-column">{item.necessidade}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      ></span>
                      {item.status === 'Pendente' && item.dataPrevista && (
                        <div className="status-date">Data: {formatDate(item.dataPrevista)}</div>
                      )}
                    </td>
                  </tr>
                  {item.showActions && (
                    <tr>
                      <td colSpan={7}>
                        <div className="action-container">
                          <div className="action-buttons-left">
                            <div className="chamado-info">
                              <strong>Chamado:</strong> {item.numeroChamado || 'Não informado'}
                              {!item.numeroChamado && item.status === 'Aceito' && (
                                <button
                                  onClick={() => {
                                    setSelectedRow(item.id);
                                    setIsChamadoModalOpen(true);
                                  }}
                                >
                                  Adicionar Chamado
                                </button>
                              )}
                            </div>
                            <div className="nota-fiscal-info">
                              <strong>Pedido:</strong> {item.numeroPedido || 'Não informado'}
                              {!item.numeroPedido && item.status === 'Aceito' && (
                                <button
                                  onClick={() => {
                                    setSelectedRow(item.id);
                                    setIsPedidoModalOpen(true);
                                  }}
                                >
                                  Adicionar Pedido
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'flex' }}>
                              <div className="recebimento-info" style={{ marginRight: '20px' }}>
                                <div><strong>Nº Nota Fiscal:</strong> {item.notaFiscal || 'Não informado'}</div>
                                <div><strong>Nova Finalidade:</strong> {item.novaFinalidade || 'Não informada'}</div>
                                <div><strong>Atendeu Necessidade:</strong> 
                                  {item.atendeuNecessidade !== undefined 
                                    ? (item.atendeuNecessidade ? 'Sim' : 'Não') 
                                    : 'Não informado'}
                                </div>
                              </div>
                              <div className="item-necessidade-info">
                                <div><strong>Item:</strong> {item.item || 'Não informado'}</div>
                                <div><strong>Necessidade:</strong> {item.necessidade || 'Não informada'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="action-buttons-right">
                            {canApprove && item.status === 'Pendente' && (
                              <>
                                <button onClick={() => handleAction(item.id, 'Confirmar')}>Confirmar</button>
                                <button onClick={() => handleAction(item.id, 'Aguardar')}>Aguardar</button>
                                <button onClick={() => handleAction(item.id, 'Recusar')}>Recusar</button>
                              </>
                            )}
                            {item.status === 'Aceito' && (
                              <button onClick={() => handleAction(item.id, 'Confirmar Recebimento')}>
                                Confirmar Recebimento
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '10px' }}>
                  Nenhum dado disponível. Adicione novos registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PurchaseRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRequest}
        setUnidade={setUnidade}
        setSetor={setSetor}
        setRequerente={setRequerente}
        setItem={setItem}
        setNecessidade={setNecessidade}
        setPrioridade={setPrioridade}
      />
      <DateModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onSave={handleDateSave} />
      <ReceiptConfirmationModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSave={handleReceiptSave}
      />
      <ReusableModal
        isOpen={isChamadoModalOpen}
        title="Inserir Número do Chamado"
        inputPlaceholder="Número do Chamado"
        onClose={() => setIsChamadoModalOpen(false)}
        onSave={handleChamadoSave}
      />
      <ReusableModal
        isOpen={isPedidoModalOpen}
        title="Inserir Número do Pedido"
        inputPlaceholder="Número do Pedido"
        onClose={() => setIsPedidoModalOpen(false)}
        onSave={handlePedidoSave}
      />
    </div>
  );
};

export default Dashboard;
