import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  CreditCard
} from 'lucide-react';

export default function Transactions({ 
  type, // 'entradas' ou 'saidas'
  data, 
  onAdd, 
  onUpdate, 
  onDelete, 
  user,
  addToast,
  showConfirm
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Filtros e busca
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Formulário
  const [description, setDescription] = useState('');
  const [entity, setEntity] = useState(''); // Cliente para entradas, Fornecedor para saídas
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');

  const isReadOnly = user?.perfil === 'Visualização';

  // Opções de Categorias e Formas de Pagamento
  const categories = type === 'entradas' 
    ? ['Venda de Produtos', 'Serviços', 'Rendimentos', 'Outros'] 
    : ['Matéria-Prima', 'Manutenção', 'Utilidades', 'Combustível', 'Salários', 'Impostos', 'Outros'];

  const paymentMethods = ['Pix', 'Boleto', 'Transferência', 'Cartão de Crédito', 'Cartão Corporativo', 'Dinheiro'];

  // Reseta form ao fechar/abrir modal
  const handleOpenModal = (item = null) => {
    if (isReadOnly) {
      addToast('Seu perfil de Visualização não permite fazer alterações.', 'warning');
      return;
    }
    
    if (item) {
      setEditingItem(item);
      setDescription(item.descricao);
      setEntity(type === 'entradas' ? item.cliente : item.fornecedor);
      setValue(item.valor.toString());
      setDate(item.data);
      setCategory(item.categoria);
      setPaymentMethod(item.forma_pagamento);
      setNotes(item.observacoes || '');
    } else {
      setEditingItem(null);
      setDescription('');
      setEntity('');
      setValue('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(categories[0]);
      setPaymentMethod('Pix');
      setNotes('');
    }
    setShowModal(true);
  };

  const handleConfirmPayment = async () => {
    if (isReadOnly) return;
    
    // 1. Atualiza observações no form
    const confirmedNotes = notes ? `${notes}\n[PAGAMENTO CONFIRMADO EM ${new Date().toLocaleDateString('pt-BR')}]` : `[PAGAMENTO CONFIRMADO EM ${new Date().toLocaleDateString('pt-BR')}]`;
    setNotes(confirmedNotes);

    // 2. Dispara a atualização de entradas
    const itemData = {
      descricao: description,
      [type === 'entradas' ? 'cliente' : 'fornecedor']: entity,
      valor: parseFloat(value),
      data: date,
      categoria: category,
      forma_pagamento: paymentMethod,
      observacoes: confirmedNotes
    };
    
    await onUpdate(editingItem.id, itemData);

    // 3. Tenta encontrar a conta correspondente no pagar_receber (calendário) e marcar como pago
    try {
      const prList = await db.pagarReceber.list();
      // Procura uma conta pendente que bata com o valor e a descrição/cliente
      const matchingAccount = prList.find(acc => 
        acc.tipo === 'receber' && 
        acc.status === 'pendente' && 
        (acc.descricao.toLowerCase().includes(description.toLowerCase()) || 
         description.toLowerCase().includes(acc.descricao.toLowerCase()))
      );

      if (matchingAccount) {
        await db.pagarReceber.update(matchingAccount.id, { status: 'pago' });
        addToast('Pagamento confirmado e liquidado no calendário financeiro!', 'success');
      } else {
        addToast('Lançamento atualizado como pago nas entradas!', 'success');
      }
    } catch (e) {
      addToast('Lançamento atualizado como pago!', 'success');
    }

    setShowModal(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!description || !entity || !value || !date || !category) {
      addToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    const itemData = {
      descricao: description,
      [type === 'entradas' ? 'cliente' : 'fornecedor']: entity,
      valor: parseFloat(value),
      data: date,
      categoria: category,
      forma_pagamento: paymentMethod,
      observacoes: notes
    };

    if (editingItem) {
      onUpdate(editingItem.id, itemData);
      addToast('Lançamento atualizado com sucesso!', 'success');
    } else {
      onAdd(itemData);
      addToast('Lançamento adicionado com sucesso!', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (isReadOnly) {
      addToast('Seu perfil de Visualização não permite excluir dados.', 'warning');
      return;
    }
    showConfirm(
      'Confirmar Exclusão de Lançamento',
      'Tem certeza que deseja excluir permanentemente este lançamento financeiro? Esta ação altera o saldo em caixa e não pode ser desfeita.',
      () => {
        onDelete(id);
        addToast('Lançamento excluído com sucesso.', 'info');
      },
      'danger'
    );
  };

  // Processamento dos dados filtrados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const entityName = type === 'entradas' ? item.cliente : item.fornecedor;
      const matchSearch = 
        item.descricao.toLowerCase().includes(search.toLowerCase()) ||
        entityName.toLowerCase().includes(search.toLowerCase());

      const matchCategory = !categoryFilter || item.categoria === categoryFilter;
      const matchPayment = !paymentFilter || item.forma_pagamento === paymentFilter;
      const matchStartDate = !startDate || item.data >= startDate;
      const matchEndDate = !endDate || item.data <= endDate;

      return matchSearch && matchCategory && matchPayment && matchStartDate && matchEndDate;
    });
  }, [data, search, categoryFilter, paymentFilter, startDate, endDate, type]);



  const formatBRL = (val) => {
    return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="transactions-container animate-fade-in">
      
      {/* Título & Ações Principais */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {type === 'entradas' ? <ArrowUpRight style={{ color: 'var(--color-success)' }} /> : <ArrowDownRight style={{ color: 'var(--color-danger)' }} />}
            Gestão de {type === 'entradas' ? 'Entradas (Receitas)' : 'Saídas (Despesas)'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Filtre, edite e exporte as movimentações financeiras da empresa.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isReadOnly && (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus size={16} /> Novo Lançamento
            </button>
          )}
        </div>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Campo de Busca */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por descrição ou cliente/fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Filtro de Categoria */}
          <div style={{ width: '180px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="">Todas Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filtro de Forma de Pagamento */}
          <div style={{ width: '180px' }}>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="">Todas Formas Pag.</option>
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Filtros de Data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>{type === 'entradas' ? 'Cliente' : 'Fornecedor'}</th>
              <th>Categoria</th>
              <th>Forma Pag.</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Nenhum lançamento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id}>
                  <td>{item.data ? (item.data.includes('T') ? item.data.split('T')[0] : item.data).split('-').reverse().join('/') : 'N/A'}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{item.descricao}</div>
                    {item.observacoes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.observacoes}</div>}
                  </td>
                  <td>{type === 'entradas' ? item.cliente : item.fornecedor}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '500' }}>
                      <Tag size={12} /> {item.categoria}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                      <CreditCard size={12} style={{ color: 'var(--color-text-muted)' }} /> {item.forma_pagamento}
                    </span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: '700', 
                    color: type === 'entradas' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {type === 'entradas' ? '+' : '-'} {formatBRL(item.valor)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenModal(item)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '0.25rem' }}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.25rem' }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal CRUD Lançamento */}
      {showModal && (
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
          <div className="card animate-fade-in" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              {editingItem ? 'Editar Lançamento' : `Novo Lançamento - ${type === 'entradas' ? 'Entrada' : 'Saída'}`}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descrição *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="Ex. Compra de argila, serviço de pintura..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{type === 'entradas' ? 'Cliente *' : 'Fornecedor *'}</label>
                <input
                  type="text"
                  required
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="form-input"
                  placeholder={type === 'entradas' ? "Nome do cliente..." : "Nome do fornecedor..."}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="form-input"
                    placeholder="0,00"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Data *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Forma de Pagamento *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-select"
                  >
                    {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Alguma nota importante sobre a transação..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                {type === 'entradas' && editingItem && (
                  <button 
                    type="button" 
                    onClick={handleConfirmPayment}
                    className="btn btn-success"
                  >
                    Confirmar Pagamento
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .transactions-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
        }
      `}</style>
    </>
  );
}
