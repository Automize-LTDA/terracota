import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  TableProperties, 
  BarChart3, 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  Edit2,
  Eye,
  Plus
} from 'lucide-react';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

const formatCpfCnpj = (value) => {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    let formatted = clean;
    if (clean.length > 9) {
      formatted = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
    } else if (clean.length > 6) {
      formatted = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`;
    } else if (clean.length > 3) {
      formatted = `${clean.substring(0, 3)}.${clean.substring(3)}`;
    }
    return formatted;
  } else {
    const truncated = clean.substring(0, 14);
    let formatted = truncated;
    if (truncated.length > 12) {
      formatted = `${truncated.substring(0, 2)}.${truncated.substring(2, 5)}.${truncated.substring(5, 8)}/${truncated.substring(8, 12)}-${truncated.substring(12)}`;
    } else if (truncated.length > 8) {
      formatted = `${truncated.substring(0, 2)}.${truncated.substring(2, 5)}.${truncated.substring(5, 8)}/${truncated.substring(8)}`;
    } else if (truncated.length > 5) {
      formatted = `${truncated.substring(0, 2)}.${truncated.substring(2, 5)}.${truncated.substring(5)}`;
    } else if (truncated.length > 2) {
      formatted = `${truncated.substring(0, 2)}.${truncated.substring(2)}`;
    }
    return formatted;
  }
};

const formatPhone = (value) => {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    let formatted = clean;
    if (clean.length > 6) {
      formatted = `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6, 10)}`;
    } else if (clean.length > 2) {
      formatted = `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    }
    return formatted;
  } else {
    const truncated = clean.substring(0, 11);
    let formatted = truncated;
    if (truncated.length > 7) {
      formatted = `(${truncated.substring(0, 2)}) ${truncated.substring(2, 7)}-${truncated.substring(7)}`;
    } else if (truncated.length > 2) {
      formatted = `(${truncated.substring(0, 2)}) ${truncated.substring(2)}`;
    }
    return formatted;
  }
};

const formatEmail = (value) => {
  if (!value) return '';
  return value.toLowerCase().replace(/\s/g, '');
};

export default function Clientes({ 
  clientes, 
  movimentacoes, 
  onAddCliente, 
  onUpdateCliente, 
  onDeleteCliente, 
  onAddMovimentacao, 
  user, 
  addToast,
  setActiveTab,
  showConfirm
}) {
  const [activeSubTab, setActiveSubTab] = useState('resumo'); // 'resumo', 'cadastro', 'lista'
  const [selectedCliente, setSelectedCliente] = useState(null); // Detalhes Modal
  const [editingCliente, setEditingCliente] = useState(null); // Cliente em edição no formulário
  
  // States do formulário de cadastro
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // States de filtros & listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [saldoFilter, setSaldoFilter] = useState('todos'); // 'todos', 'positivo', 'negativo'
  const [sortBy, setSortBy] = useState('nome'); // 'nome', 'data', 'debito', 'credito', 'valorFinal'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // States de filtros no modal de histórico
  const [modalPeriodFilter, setModalPeriodFilter] = useState('30dias'); // 'hoje', '7dias', '30dias', 'custom'
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  // State para adicionar transação rápida no modal
  const [quickDesc, setQuickDesc] = useState('');
  const [quickTipo, setQuickTipo] = useState('credito');
  const [quickValor, setQuickValor] = useState('');
  const [quickData, setQuickData] = useState(new Date().toISOString().split('T')[0]);

  const isReadOnly = user?.perfil === 'Visualização';

  // Cálculos financeiros consolidados por cliente
  const clientFinancials = useMemo(() => {
    const map = {};
    
    // Inicializar todos os clientes
    clientes.forEach(c => {
      map[c.id] = {
        creditos: 0,
        debitos: 0,
        dataUltimaMov: c.created_at,
        movs: []
      };
    });

    // Mapear movimentações
    movimentacoes.forEach(m => {
      if (map[m.cliente_id]) {
        if (m.tipo === 'credito') {
          map[m.cliente_id].creditos += parseFloat(m.valor);
        } else {
          map[m.cliente_id].debitos += parseFloat(m.valor);
        }
        map[m.cliente_id].movs.push(m);
        // Atualiza data mais recente
        if (m.data_movimentacao > map[m.cliente_id].dataUltimaMov) {
          map[m.cliente_id].dataUltimaMov = m.data_movimentacao;
        }
      }
    });

    return map;
  }, [clientes, movimentacoes]);

  // Limpar campos do form
  const handleClearFields = () => {
    setEditingCliente(null);
    setNome('');
    setCpfCnpj('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setEndereco('');
    setObservacoes('');
  };

  // Carrega cliente no formulário para edição
  const handleEditClick = (cliente) => {
    if (isReadOnly) {
      addToast('Seu perfil de Visualização não permite editar dados.', 'warning');
      return;
    }
    setEditingCliente(cliente);
    setNome(cliente.nome);
    setCpfCnpj(formatCpfCnpj(cliente.cpf_cnpj));
    setTelefone(formatPhone(cliente.telefone || ''));
    setWhatsapp(formatPhone(cliente.whatsapp || ''));
    setEmail(formatEmail(cliente.email || ''));
    setEndereco(cliente.endereco || '');
    setObservacoes(cliente.observacoes || '');
    setActiveSubTab('cadastro');
  };

  // Salvar/Editar Cliente
  const handleSaveCliente = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!nome) {
      addToast('O Nome do Cliente é obrigatório.', 'warning');
      return;
    }

    // Validar e-mail
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      addToast('Formato de e-mail inválido.', 'warning');
      return;
    }

    // Validar telefone (pelo menos 8 digitos se inserido)
    const digitsOnly = telefone.replace(/\D/g, '');
    if (telefone && digitsOnly.length < 8) {
      addToast('Telefone inválido.', 'warning');
      return;
    }

    // Prevenir CPF/CNPJ duplicado
    const isDuplicated = clientes.some(c => 
      c.cpf_cnpj.replace(/\D/g, '') === cpfCnpj.replace(/\D/g, '') && 
      (!editingCliente || c.id !== editingCliente.id)
    );
    if (isDuplicated) {
      addToast('CPF ou CNPJ já cadastrado no sistema.', 'error');
      return;
    }

    const clientData = {
      nome,
      cpf_cnpj: cpfCnpj,
      telefone,
      whatsapp,
      email,
      endereco,
      observacoes
    };

    try {
      if (editingCliente) {
        await onUpdateCliente(editingCliente.id, clientData);
        addToast('Cadastro do cliente atualizado!', 'success');
      } else {
        await onAddCliente(clientData);
        addToast('Cliente cadastrado com sucesso!', 'success');
      }
      handleClearFields();
      setActiveSubTab('lista');
    } catch (err) {
      addToast('Erro ao salvar cliente.', 'error');
    }
  };

  const handleDeleteCliente = (id) => {
    if (isReadOnly) {
      addToast('Seu perfil de Visualização não permite excluir dados.', 'warning');
      return;
    }
    showConfirm(
      'Confirmar Exclusão de Cliente',
      'Tem certeza que deseja excluir este cliente e todas as suas movimentações financeiras? Esta ação removerá os dados permanentemente.',
      async () => {
        try {
          await onDeleteCliente(id);
          addToast('Cliente e movimentações removidos.', 'info');
          if (selectedCliente && selectedCliente.id === id) {
            setSelectedCliente(null);
          }
        } catch (e) {
          addToast('Erro ao deletar cliente.', 'error');
        }
      },
      'danger'
    );
  };

  // Adicionar movimentação no modal do cliente
  const handleAddQuickMov = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!quickDesc || !quickValor) {
      addToast('Insira a descrição e o valor da movimentação', 'warning');
      return;
    }

    try {
      await onAddMovimentacao({
        cliente_id: selectedCliente.id,
        descricao: quickDesc,
        tipo: quickTipo,
        valor: parseFloat(quickValor),
        data_movimentacao: new Date(quickData + 'T12:00:00').toISOString()
      });
      addToast('Movimentação registrada com sucesso!', 'success');
      setQuickDesc('');
      setQuickValor('');
      
      // Atualiza o estado local do modal
      const updatedMovs = await db.movimentacoesClientes.list();
      const clientMovs = updatedMovs.filter(m => m.cliente_id === selectedCliente.id);
      setSelectedCliente(prev => ({
        ...prev,
        movs: clientMovs
      }));
    } catch (err) {
      addToast('Erro ao registrar movimentação.', 'error');
    }
  };

  // Processa dados dos clientes na listagem
  const processedClients = useMemo(() => {
    return clientes.map(c => {
      const fin = clientFinancials[c.id] || { creditos: 0, debitos: 0, dataUltimaMov: c.created_at };
      return {
        ...c,
        credito: fin.creditos,
        debito: fin.debitos,
        valorFinal: fin.creditos - fin.debitos,
        data: fin.dataUltimaMov
      };
    });
  }, [clientes, clientFinancials]);

  // Filtra listagem de clientes
  const filteredClients = useMemo(() => {
    return processedClients.filter(c => {
      const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cpf_cnpj.includes(searchTerm);
      
      const matchDate = !dateFilter || c.data.startsWith(dateFilter);
      
      let matchSaldo = true;
      if (saldoFilter === 'positivo') matchSaldo = c.valorFinal > 0;
      if (saldoFilter === 'negativo') matchSaldo = c.valorFinal < 0;

      return matchSearch && matchDate && matchSaldo;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [processedClients, searchTerm, dateFilter, saldoFilter, sortBy, sortOrder]);

  // Paginação
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Dados Financeiros Gerais do Dashboard
  const dashboardStats = useMemo(() => {
    const totalClientes = clientes.length;
    
    // Ativos são aqueles com alguma movimentação cadastrada
    const ativos = Object.keys(clientFinancials).filter(id => 
      clientFinancials[id].creditos > 0 || clientFinancials[id].debitos > 0
    ).length;

    const totalCreditos = movimentacoes.filter(m => m.tipo === 'credito').reduce((s, m) => s + parseFloat(m.valor), 0);
    const totalDebitos = movimentacoes.filter(m => m.tipo === 'debito').reduce((s, m) => s + parseFloat(m.valor), 0);
    const saldoGeral = totalCreditos - totalDebitos;

    return {
      totalClientes,
      ativos,
      totalCreditos,
      totalDebitos,
      saldoGeral
    };
  }, [clientes, movimentacoes, clientFinancials]);

  // Configuração de Gráficos do Dashboard de Clientes
  const clientCharts = useMemo(() => {
    // 1. Créditos x Débitos (Donut)
    const donutData = {
      labels: ['Créditos (Entradas)', 'Débitos (Saídas)'],
      datasets: [{
        data: [dashboardStats.totalCreditos, dashboardStats.totalDebitos],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 1
      }]
    };

    // 2. Top 10 Clientes Faturamento (Créditos)
    const top10 = processedClients
      .sort((a, b) => b.credito - a.credito)
      .slice(0, 10)
      .filter(c => c.credito > 0);

    const barData = {
      labels: top10.map(c => c.nome),
      datasets: [{
        label: 'Crédito Acumulado (R$)',
        data: top10.map(c => c.credito),
        backgroundColor: 'rgba(160, 82, 45, 0.8)',
        borderRadius: 4
      }]
    };

    // 3. Evolução financeira mensal (Geral de Clientes por mês em 2026)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const valoresCreditos = Array(12).fill(0);
    const valoresDebitos = Array(12).fill(0);

    movimentacoes.forEach(m => {
      const mes = new Date(m.data_movimentacao).getMonth();
      if (m.tipo === 'credito') {
        valoresCreditos[mes] += parseFloat(m.valor);
      } else {
        valoresDebitos[mes] += parseFloat(m.valor);
      }
    });

    const lineData = {
      labels: meses,
      datasets: [
        {
          label: 'Total Receitas (R$)',
          data: valoresCreditos,
          borderColor: '#10B981',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Total Despesas (R$)',
          data: valoresDebitos,
          borderColor: '#EF4444',
          tension: 0.3,
          fill: false
        }
      ]
    };

    return {
      donutData,
      barData,
      lineData
    };
  }, [dashboardStats, processedClients, movimentacoes]);

  // Filtra histórico de transações dentro do modal de detalhes
  const modalFilteredHistory = useMemo(() => {
    if (!selectedCliente) return [];
    
    const clientMovs = clientFinancials[selectedCliente.id]?.movs || [];
    const hoje = new Date();
    
    return clientMovs.filter(m => {
      const movDate = new Date(m.data_movimentacao);
      
      if (modalPeriodFilter === 'hoje') {
        return movDate.toDateString() === hoje.toDateString();
      } else if (modalPeriodFilter === '7dias') {
        const diffTime = Math.abs(hoje - movDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } else if (modalPeriodFilter === '30dias') {
        const diffTime = Math.abs(hoje - movDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      } else if (modalPeriodFilter === 'custom') {
        const dateStr = m.data_movimentacao.split('T')[0];
        const matchStart = !modalStartDate || dateStr >= modalStartDate;
        const matchEnd = !modalEndDate || dateStr <= modalEndDate;
        return matchStart && matchEnd;
      }
      return true;
    }).sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao));
  }, [selectedCliente, modalPeriodFilter, modalStartDate, modalEndDate, clientFinancials]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatBRL = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="clientes-container animate-fade-in">
      
      {/* Título do Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users /> Gestão Comercial de Clientes
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Cadastre clientes, controle faturamentos, receitas e despesas associadas.</p>
        </div>

        {/* Barra de Ações com Sub-abas e Botão de Fechar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            background: 'var(--color-primary-light)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}>
            {[
              { id: 'resumo', label: 'Resumo / Dashboard', icon: BarChart3 },
              { id: 'cadastro', label: editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente', icon: UserPlus },
              { id: 'lista', label: 'Clientes Cadastrados', icon: TableProperties }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: 'none',
                    background: activeSubTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: activeSubTab === tab.id ? 'white' : 'var(--color-primary)',
                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn"
            style={{
              padding: '0.58rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            title="Fechar aba de Clientes"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ABA 1: RESUMO / DASHBOARD DE CLIENTES */}
      {activeSubTab === 'resumo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Cards Estatísticos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem'
          }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Clientes</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{dashboardStats.totalClientes}</h3>
              </div>
              <div style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} />
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-info)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Clientes Ativos</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{dashboardStats.ativos}</h3>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-success)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total em Créditos</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(dashboardStats.totalCreditos)}</h3>
              </div>
              <div style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-danger)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total em Débitos</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(dashboardStats.totalDebitos)}</h3>
              </div>
              <div style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={18} />
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white', border: 'none' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Saldo Geral</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(dashboardStats.saldoGeral)}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} />
              </div>
            </div>
          </div>

          {/* Gráficos do Módulo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem'
          }} className="charts-grid">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Créditos x Débitos de Clientes</h4>
              <div style={{ height: '250px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: '200px' }}>
                  <Doughnut data={clientCharts.donutData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Faturamento por Cliente (Top 10)</h4>
              <div style={{ height: '250px', position: 'relative' }}>
                <Bar data={clientCharts.barData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 2' }} className="chart-full card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Evolução Comercial Mensal</h4>
              <div style={{ height: '250px', position: 'relative' }}>
                <Line data={clientCharts.lineData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CADASTRO E EDIÇÃO DE CLIENTES */}
      {activeSubTab === 'cadastro' && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
            {editingCliente ? `Editar Cliente: ${editingCliente.nome}` : 'Cadastrar Novo Cliente'}
          </h3>

          <form onSubmit={handleSaveCliente} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="grid-responsive">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome comercial ou da pessoa..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="form-input"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CPF / CNPJ *</label>
                <input
                  type="text"
                  required
                  placeholder="Apenas números ou formatado..."
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  className="form-input"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="grid-responsive">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  className="form-input"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  className="form-input"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(formatEmail(e.target.value))}
                  className="form-input"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Endereço Completo</label>
              <input
                type="text"
                placeholder="Rua, número, bairro, cidade/UF..."
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="form-input"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações</label>
              <textarea
                placeholder="Dados bancários, prazos preferenciais, descontos acordados..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="form-textarea"
                rows="3"
                disabled={isReadOnly}
              />
            </div>

            {!isReadOnly && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleClearFields} className="btn btn-secondary">
                  Limpar Campos
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCliente ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ABA 3: TABELA DE CLIENTES CADASTRADOS */}
      {activeSubTab === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Painel de Filtros */}
          <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{ width: '180px' }}>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="form-input"
                style={{ width: '100%' }}
                title="Filtrar por data de movimentação"
              />
            </div>

            <div style={{ width: '180px' }}>
              <select
                value={saldoFilter}
                onChange={(e) => { setSaldoFilter(e.target.value); setCurrentPage(1); }}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="todos">Todos os Saldos</option>
                <option value="positivo">Saldo Positivo</option>
                <option value="negativo">Saldo Negativo</option>
              </select>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('nome')}>
                    Nome do Cliente {sortBy === 'nome' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('debito')}>
                    Débito (Saídas) {sortBy === 'debito' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('credito')}>
                    Crédito (Receitas) {sortBy === 'credito' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('data')}>
                    Última Atividade {sortBy === 'data' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('valorFinal')}>
                    Valor Final {sortBy === 'valorFinal' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      Nenhum cliente localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{c.nome}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: '500' }}>
                        {formatBRL(c.debito)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: '500' }}>
                        {formatBRL(c.credito)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {new Date(c.data).toLocaleDateString('pt-BR')} {new Date(c.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: '700', 
                        color: c.valorFinal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                      }}>
                        {c.valorFinal >= 0 ? '+' : ''} {formatBRL(c.valorFinal)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => {
                              const fin = clientFinancials[c.id];
                              setSelectedCliente({ ...c, movs: fin?.movs || [] });
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-info)' }}
                            title="Ver Detalhes & Histórico"
                          >
                            <Eye size={16} />
                          </button>
                          {!isReadOnly && (
                            <>
                              <button 
                                onClick={() => handleEditClick(c)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCliente(c.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Página {currentPage} de {totalPages} ({filteredClients.length} clientes)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Próxima <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* MODAL DE DETALHES DO CLIENTE E HISTÓRICO FINANCEIRO */}
      {selectedCliente && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div className="card animate-fade-in" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => { setSelectedCliente(null); setModalPeriodFilter('30dias'); }}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            
            <h2 style={{ marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Perfil do Cliente</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }} className="grid-responsive">
              
              {/* Esquerda: Dados Pessoais & Lançamento Rápido */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '0.75rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
                    Informações Cadastrais
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <p><strong>Nome:</strong> {selectedCliente.nome}</p>
                    <p><strong>CPF/CNPJ:</strong> {selectedCliente.cpf_cnpj}</p>
                    <p><strong>Tel:</strong> {selectedCliente.telefone || 'Não informado'}</p>
                    <p><strong>E-mail:</strong> {selectedCliente.email || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> {selectedCliente.endereco || 'Não informado'}</p>
                    {selectedCliente.observacoes && <p><strong>Obs:</strong> {selectedCliente.observacoes}</p>}
                  </div>
                </div>

                {/* Resumo Financeiro do Cliente no Modal */}
                <div style={{ background: 'var(--color-bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Resumo Financeiro</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Créditos (Recebidos):</span>
                      <strong style={{ color: 'var(--color-success)' }}>+{formatBRL(selectedCliente.credito)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Débitos (Custos):</span>
                      <strong style={{ color: 'var(--color-danger)' }}>-{formatBRL(selectedCliente.debito)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                      <span>Saldo Líquido:</span>
                      <strong style={{ color: selectedCliente.valorFinal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatBRL(selectedCliente.valorFinal)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Lançar nova transação rápida */}
                {!isReadOnly && (
                  <form onSubmit={handleAddQuickMov} style={{ background: 'var(--color-bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={14} /> Registrar Transação Comercial
                    </h4>
                    <input
                      type="text"
                      required
                      placeholder="Descrição (ex. Compra de peça, serviço...)"
                      value={quickDesc}
                      onChange={(e) => setQuickDesc(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Valor R$"
                        value={quickValor}
                        onChange={(e) => setQuickValor(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                      />
                      <select
                        value={quickTipo}
                        onChange={(e) => setQuickTipo(e.target.value)}
                        className="form-select"
                        style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                      >
                        <option value="credito">Crédito (+)</option>
                        <option value="debito">Débito (-)</option>
                      </select>
                    </div>
                    <input
                      type="date"
                      required
                      value={quickData}
                      onChange={(e) => setQuickData(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
                      Adicionar Lançamento
                    </button>
                  </form>
                )}
              </div>

              {/* Direita: Tabela de histórico com filtros */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: '700' }}>Histórico de Movimentações</h4>
                  
                  {/* Seletor de Período do Modal */}
                  <select
                    value={modalPeriodFilter}
                    onChange={(e) => setModalPeriodFilter(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <option value="hoje">Hoje</option>
                    <option value="7dias">Últimos 7 dias</option>
                    <option value="30dias">Últimos 30 dias</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {/* Filtro personalizado de datas no modal */}
                {modalPeriodFilter === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <input 
                      type="date" 
                      value={modalStartDate} 
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.7rem', padding: '0.25rem' }}
                    />
                    <span style={{ fontSize: '0.75rem' }}>a</span>
                    <input 
                      type="date" 
                      value={modalEndDate} 
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.7rem', padding: '0.25rem' }}
                    />
                  </div>
                )}

                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', maxHeight: '350px' }}>
                  <table className="custom-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Tipo</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalFilteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            Nenhum registro para este período.
                          </td>
                        </tr>
                      ) : (
                        modalFilteredHistory.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontSize: '0.75rem' }}>
                              {new Date(m.data_movimentacao).toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ fontSize: '0.75rem', fontWeight: '500' }}>{m.descricao}</td>
                            <td style={{ fontSize: '0.75rem' }}>
                              <span style={{ 
                                padding: '1px 4px', 
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                background: m.tipo === 'credito' ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
                                color: m.tipo === 'credito' ? 'var(--color-success)' : 'var(--color-danger)'
                              }}>
                                {m.tipo === 'credito' ? 'CRÉDITO' : 'DÉBITO'}
                              </span>
                            </td>
                            <td style={{ 
                              textAlign: 'right', 
                              fontSize: '0.75rem', 
                              fontWeight: '700', 
                              color: m.tipo === 'credito' ? 'var(--color-success)' : 'var(--color-danger)'
                            }}>
                              {m.tipo === 'credito' ? '+' : '-'} {formatBRL(parseFloat(m.valor))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Rodapé do Modal com Botão de Fechar */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1rem'
            }}>
              <button 
                onClick={() => { setSelectedCliente(null); setModalPeriodFilter('30dias'); }}
                className="btn btn-secondary"
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos em linha responsivos para grid */}
      <style>{`
        .grid-responsive {
          display: grid;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .clientes-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
