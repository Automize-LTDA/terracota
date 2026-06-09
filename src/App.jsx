import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Clientes from './pages/Clientes';
import Administradores from './pages/Administradores';
import { db } from './services/db';
import { ShieldAlert, CheckCircle, Info, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Dados globais do sistema
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [pagarReceber, setPagarReceber] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [movimentacoesClientes, setMovimentacoesClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Feedback Toasts
  const [toasts, setToasts] = useState([]);

  // Confirm Dialog State & Helper
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    type: 'danger'
  });

  const showConfirm = useCallback((title, message, onConfirm, type = 'danger') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  }, []);

  // Toast adder helper
  const addToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Verifica login persistido
  useEffect(() => {
    const savedUser = sessionStorage.getItem('terracota_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Carrega dados iniciais do banco
  const fetchAllData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        db.entradas.list(),
        db.saidas.list(),
        db.pagarReceber.list(),
        db.notificacoes.list(),
        db.clientes.list(),
        db.movimentacoesClientes.list(),
        db.usuarios.list()
      ]);

      const errors = [];
      
      if (results[0].status === 'fulfilled') setEntradas(results[0].value);
      else errors.push(`Entradas (${results[0].reason.message || results[0].reason})`);

      if (results[1].status === 'fulfilled') setSaidas(results[1].value);
      else errors.push(`Saídas (${results[1].reason.message || results[1].reason})`);

      if (results[2].status === 'fulfilled') setPagarReceber(results[2].value);
      else errors.push(`Calendário (${results[2].reason.message || results[2].reason})`);

      if (results[3].status === 'fulfilled') setNotifications(results[3].value);
      else errors.push(`Notificações (${results[3].reason.message || results[3].reason})`);

      if (results[4].status === 'fulfilled') setClientes(results[4].value);
      else errors.push(`Clientes (${results[4].reason.message || results[4].reason})`);

      if (results[5].status === 'fulfilled') setMovimentacoesClientes(results[5].value);
      else errors.push(`Transações de Clientes (${results[5].reason.message || results[5].reason})`);

      if (results[6].status === 'fulfilled') setUsuarios(results[6].value);
      else errors.push(`Usuários (${results[6].reason.message || results[6].reason})`);

      if (errors.length > 0) {
        console.error('Tabelas com erro ao carregar:', errors);
        addToast(`Erro ao carregar algumas tabelas: ${errors.join('; ')}`, 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Erro crítico ao carregar dados do banco', 'error');
    }
  }, [addToast]);

  // Roda alertas automáticos e sincroniza dados iniciais
  useEffect(() => {
    if (user) {
      fetchAllData().then(() => {
        db.checkAlerts().then(() => {
          db.notificacoes.list().then(setNotifications);
        });
      });
    }
  }, [user, fetchAllData]);

  // Habilita Supabase Realtime se configurado
  useEffect(() => {
    if (!user) return;

    // Assina atualizações nas tabelas relevantes
    const unsubEntradas = db.subscribeRealtime('entradas', () => fetchAllData());
    const unsubSaidas = db.subscribeRealtime('saidas', () => fetchAllData());
    const unsubPagarReceber = db.subscribeRealtime('pagar_receber', () => fetchAllData());
    const unsubNotif = db.subscribeRealtime('notificacoes', () => fetchAllData());
    const unsubClientes = db.subscribeRealtime('clientes', () => fetchAllData());
    const unsubMovClientes = db.subscribeRealtime('movimentacoes_clientes', () => fetchAllData());
    const unsubUsuarios = db.subscribeRealtime('usuarios', () => fetchAllData());

    return () => {
      unsubEntradas();
      unsubSaidas();
      unsubPagarReceber();
      unsubNotif();
      unsubClientes();
      unsubMovClientes();
      unsubUsuarios();
    };
  }, [user, fetchAllData]);

  const handleLoginSuccess = (loggedInUser) => {
    sessionStorage.setItem('terracota_session', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('terracota_session');
    setUser(null);
    setActiveTab('dashboard');
  };

  // CRUD Handlers - Entradas
  const handleAddEntrada = async (item) => {
    try {
      await db.entradas.create(item);
      // Espelha automaticamente no Calendário Financeiro como receita recebida/paga
      await db.pagarReceber.create({
        tipo: 'receber',
        descricao: item.descricao,
        valor: item.valor,
        vencimento: item.data,
        status: 'pago',
        categoria: item.categoria || 'Outros',
        observacoes: item.observacoes || 'Lançamento automático via fluxo de caixa (Entradas).'
      });
      addToast('Lançamento de entrada adicionado com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao adicionar entrada: ${e.message || e}`, 'error');
    }
  };

  const handleUpdateEntrada = async (id, updates) => {
    try {
      await db.entradas.update(id, updates);
      addToast('Entrada atualizada com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao atualizar entrada: ${e.message || e}`, 'error');
    }
  };

  const handleDeleteEntrada = async (id) => {
    try {
      await db.entradas.delete(id);
      addToast('Entrada excluída com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao excluir entrada: ${e.message || e}`, 'error');
    }
  };

  // CRUD Handlers - Saídas
  const handleAddSaida = async (item) => {
    try {
      await db.saidas.create(item);
      // Espelha automaticamente no Calendário Financeiro como despesa paga
      await db.pagarReceber.create({
        tipo: 'pagar',
        descricao: item.descricao,
        valor: item.valor,
        vencimento: item.data,
        status: 'pago',
        categoria: item.categoria || 'Outros',
        observacoes: item.observacoes || 'Lançamento automático via fluxo de caixa (Saídas).'
      });
      addToast('Lançamento de saída adicionado com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao adicionar saída: ${e.message || e}`, 'error');
    }
  };

  const handleUpdateSaida = async (id, updates) => {
    try {
      await db.saidas.update(id, updates);
      addToast('Saída atualizada com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao atualizar saída: ${e.message || e}`, 'error');
    }
  };

  const handleDeleteSaida = async (id) => {
    try {
      await db.saidas.delete(id);
      addToast('Saída excluída com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao excluir saída: ${e.message || e}`, 'error');
    }
  };

  // CRUD Handlers - Calendário Pagar/Receber
  const handleAddPagarReceber = async (item) => {
    try {
      await db.pagarReceber.create(item);
      
      // Se a conta for criada já marcada como paga, espelha no fluxo de caixa (entradas/saídas)
      if (item.status === 'pago') {
        if (item.tipo === 'receber') {
          await db.entradas.create({
            descricao: `${item.descricao} (Via Calendário)`,
            cliente: 'Cliente Geral',
            valor: item.valor,
            data: item.vencimento,
            categoria: item.categoria || 'Geral',
            forma_pagamento: 'Pix',
            observacoes: item.observacoes || 'Lançamento automático via calendário (Receita Paga).'
          });
        } else {
          await db.saidas.create({
            descricao: `${item.descricao} (Via Calendário)`,
            fornecedor: 'Fornecedor Geral',
            valor: item.valor,
            data: item.vencimento,
            categoria: item.categoria || 'Geral',
            forma_pagamento: 'Pix',
            observacoes: item.observacoes || 'Lançamento automático via calendário (Despesa Paga).'
          });
        }
        addToast('Lançamento registrado automaticamente no fluxo de caixa!', 'success');
      }
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao agendar compromisso: ${e.message || e}`, 'error');
    }
  };

  const handleUpdatePagarReceber = async (id, updates) => {
    try {
      // Busca o item original para verificar mudança de status
      const originalList = await db.pagarReceber.list();
      const originalItem = originalList.find(i => i.id === id);

      await db.pagarReceber.update(id, updates);

      // Se mudou de pendente para pago, espelha no fluxo de caixa (entradas/saídas)
      if (originalItem && originalItem.status === 'pendente' && updates.status === 'pago') {
        const targetDate = updates.vencimento || originalItem.vencimento;
        const targetDesc = updates.descricao || originalItem.descricao;
        const targetValor = updates.valor ?? originalItem.valor;
        const targetCategory = updates.categoria || originalItem.categoria;
        const targetTipo = updates.tipo || originalItem.tipo;

        if (targetTipo === 'receber') {
          await db.entradas.create({
            descricao: `${targetDesc} (Baixado do Calendário)`,
            cliente: 'Cliente Geral',
            valor: targetValor,
            data: targetDate,
            categoria: targetCategory || 'Geral',
            forma_pagamento: 'Pix',
            observacoes: updates.observacoes || originalItem.observacoes || 'Lançamento automático via baixa no calendário.'
          });
        } else {
          await db.saidas.create({
            descricao: `${targetDesc} (Baixado do Calendário)`,
            fornecedor: 'Fornecedor Geral',
            valor: targetValor,
            data: targetDate,
            categoria: targetCategory || 'Geral',
            forma_pagamento: 'Pix',
            observacoes: updates.observacoes || originalItem.observacoes || 'Lançamento automático via baixa no calendário.'
          });
        }
        addToast('Baixa confirmada e registrada no fluxo de caixa!', 'success');
      }
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao atualizar compromisso: ${e.message || e}`, 'error');
    }
  };

  const handleDeletePagarReceber = async (id) => {
    try {
      await db.pagarReceber.delete(id);
      addToast('Compromisso removido do calendário', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao excluir compromisso: ${e.message || e}`, 'error');
    }
  };

  // CRUD Handlers - Clientes
  const handleAddCliente = async (cliente) => {
    try {
      await db.clientes.create(cliente);
      addToast('Cliente cadastrado com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao cadastrar cliente: ${e.message || e}`, 'error');
    }
  };

  const handleUpdateCliente = async (id, updates) => {
    try {
      await db.clientes.update(id, updates);
      addToast('Cadastro do cliente atualizado com sucesso!', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao atualizar cliente: ${e.message || e}`, 'error');
    }
  };

  const handleDeleteCliente = async (id) => {
    try {
      await db.clientes.delete(id);
      addToast('Cliente excluído do sistema.', 'success');
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao excluir cliente: ${e.message || e}`, 'error');
    }
  };

  // CRUD Handlers - Usuários
  const handleAddUsuario = async (newUser) => {
    try {
      await db.usuarios.create(newUser);
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao criar usuário: ${e.message || e}`, 'error');
    }
  };

  const handleDeleteUsuario = async (id) => {
    try {
      await db.usuarios.delete(id);
      fetchAllData();
    } catch (e) {
      console.error(e);
      addToast(`Erro ao excluir usuário: ${e.message || e}`, 'error');
    }
  };

  const handleAddMovimentacao = async (mov) => {
    try {
      // 1. Cria a movimentação na tabela principal do cliente
      await db.movimentacoesClientes.create(mov);

      // 2. Busca o nome do cliente associado para enriquecer o histórico das outras abas
      const client = clientes.find(c => c.id === mov.cliente_id);
      const clientName = client ? client.nome : 'Cliente';
      const dataMov = mov.data_movimentacao.split('T')[0];

      if (mov.tipo === 'credito') {
        // 3. Adiciona automaticamente nas Entradas
        await db.entradas.create({
          descricao: `${mov.descricao} (Transação de Cliente)`,
          cliente: clientName,
          valor: mov.valor,
          data: dataMov,
          categoria: 'Venda de Produtos',
          forma_pagamento: 'Pix',
          observacoes: 'Lançamento automático via transação de cliente.'
        });

        // 4. Adiciona no calendário financeiro como conta a receber já paga
        await db.pagarReceber.create({
          tipo: 'receber',
          descricao: `${mov.descricao} - Cliente: ${clientName}`,
          valor: mov.valor,
          vencimento: dataMov,
          status: 'pago',
          categoria: 'Venda de Produtos',
          observacoes: 'Lançamento automático via transação de cliente.'
        });
      } else {
        // 3. Adiciona automaticamente nas Saídas
        await db.saidas.create({
          descricao: `${mov.descricao} (Transação de Cliente)`,
          fornecedor: clientName,
          valor: mov.valor,
          data: dataMov,
          categoria: 'Outros',
          forma_pagamento: 'Pix',
          observacoes: 'Lançamento automático via transação de cliente.'
        });

        // 4. Adiciona no calendário financeiro como conta a pagar já paga
        await db.pagarReceber.create({
          tipo: 'pagar',
          descricao: `${mov.descricao} - Cliente: ${clientName}`,
          valor: mov.valor,
          vencimento: dataMov,
          status: 'pago',
          categoria: 'Outros',
          observacoes: 'Lançamento automático via transação de cliente.'
        });
      }

      addToast('Transação espelhada no fluxo de caixa e calendário!', 'success');
      fetchAllData();
    } catch (e) {
      addToast('Erro ao espelhar transação comercial.', 'error');
    }
  };

  // Busca global nas listas se digitada no header
  const getFilteredList = (list, type) => {
    if (!globalSearch) return list;
    const searchLower = globalSearch.toLowerCase();
    return list.filter(item => {
      const matchDesc = item.descricao?.toLowerCase().includes(searchLower);
      const matchCategory = item.categoria?.toLowerCase().includes(searchLower);
      const matchPartner = type === 'entrada'
        ? item.cliente?.toLowerCase().includes(searchLower)
        : item.fornecedor?.toLowerCase().includes(searchLower);
      return matchDesc || matchCategory || matchPartner;
    });
  };

  const getFilteredPagarReceber = () => {
    if (!globalSearch) return pagarReceber;
    const searchLower = globalSearch.toLowerCase();
    return pagarReceber.filter(item => 
      item.descricao?.toLowerCase().includes(searchLower) ||
      item.categoria?.toLowerCase().includes(searchLower) ||
      item.tipo?.toLowerCase().includes(searchLower)
    );
  };

  const getFilteredClientes = () => {
    if (!globalSearch) return clientes;
    const searchLower = globalSearch.toLowerCase();
    return clientes.filter(c => 
      c.nome?.toLowerCase().includes(searchLower) ||
      c.cpf_cnpj?.includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)
    );
  };

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} addToast={addToast} />
        <ToastContainer toasts={toasts} setToasts={setToasts} />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />

      <Header 
        globalSearch={globalSearch} 
        setGlobalSearch={setGlobalSearch} 
        notifications={notifications}
        setNotifications={setNotifications}
        addToast={addToast} 
      />

      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            entradas={getFilteredList(entradas, 'entrada')} 
            saidas={getFilteredList(saidas, 'saida')} 
            pagarReceber={getFilteredPagarReceber()} 
          />
        )}
        
        {activeTab === 'entradas' && (
          <Transactions 
            type="entradas"
            data={getFilteredList(entradas, 'entrada')}
            onAdd={handleAddEntrada}
            onUpdate={handleUpdateEntrada}
            onDelete={handleDeleteEntrada}
            user={user}
            addToast={addToast}
            showConfirm={showConfirm}
          />
        )}

        {activeTab === 'saidas' && (
          <Transactions 
            type="saidas"
            data={getFilteredList(saidas, 'saida')}
            onAdd={handleAddSaida}
            onUpdate={handleUpdateSaida}
            onDelete={handleDeleteSaida}
            user={user}
            addToast={addToast}
            showConfirm={showConfirm}
          />
        )}

        {activeTab === 'clientes' && (
          <Clientes 
            clientes={getFilteredClientes()}
            movimentacoes={movimentacoesClientes}
            onAddCliente={handleAddCliente}
            onUpdateCliente={handleUpdateCliente}
            onDeleteCliente={handleDeleteCliente}
            onAddMovimentacao={handleAddMovimentacao}
            user={user}
            addToast={addToast}
            setActiveTab={setActiveTab}
            showConfirm={showConfirm}
          />
        )}

        {activeTab === 'calendario' && (
          <Calendar 
            pagarReceber={getFilteredPagarReceber()}
            onAdd={handleAddPagarReceber}
            onUpdate={handleUpdatePagarReceber}
            onDelete={handleDeletePagarReceber}
            user={user}
            addToast={addToast}
            showConfirm={showConfirm}
          />
        )}

        {activeTab === 'relatorios' && (
          <Reports 
            entradas={entradas}
            saidas={saidas}
            pagarReceber={pagarReceber}
            clientes={clientes}
            movimentacoes={movimentacoesClientes}
            user={user}
            addToast={addToast}
            showConfirm={showConfirm}
          />
        )}

        {activeTab === 'usuarios' && user?.perfil === 'Administrador' && (
          <Administradores 
            usuarios={usuarios}
            onAddUsuario={handleAddUsuario}
            onDeleteUsuario={handleDeleteUsuario}
            user={user}
            addToast={addToast}
            showConfirm={showConfirm}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} setToasts={setToasts} />
      <ConfirmDialog dialog={confirmDialog} />
    </div>
  );
}

function ToastContainer({ toasts, setToasts }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '350px',
      width: '100%'
    }}>
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        
        let borderClr = 'var(--color-primary)';
        let bgClr = 'var(--color-bg-card)';
        let icon = <Info size={18} style={{ color: 'var(--color-primary)' }} />;

        if (isSuccess) {
          borderClr = 'var(--color-success)';
          icon = <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
        } else if (isError) {
          borderClr = 'var(--color-danger)';
          icon = <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />;
        } else if (isWarning) {
          borderClr = 'var(--color-warning)';
          icon = <Info size={18} style={{ color: 'var(--color-warning)' }} />;
        }

        return (
          <div 
            key={toast.id}
            className="glass animate-fade-in"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `4px solid ${borderClr}`,
              background: 'var(--color-bg-card)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {icon}
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{toast.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmDialog({ dialog }) {
  if (!dialog.isOpen) return null;

  const isDanger = dialog.type === 'danger';
  const isWarning = dialog.type === 'warning';
  
  let headerColor = 'var(--color-primary)';
  if (isDanger) headerColor = 'var(--color-danger)';
  else if (isWarning) headerColor = 'var(--color-warning)';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="card animate-fade-in" style={{ 
        width: '450px', 
        maxWidth: '90%', 
        borderTop: `4px solid ${headerColor}`,
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            background: isDanger ? 'var(--color-danger-muted)' : (isWarning ? 'var(--color-warning-muted)' : 'var(--color-primary-muted)'),
            color: headerColor,
            padding: '0.625rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--color-text-main)' }}>
              {dialog.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: '1.5', marginBottom: 0 }}>
              {dialog.message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button 
            type="button" 
            onClick={dialog.onCancel} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={dialog.onConfirm} 
            className="btn"
            style={{ 
              background: headerColor, 
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
