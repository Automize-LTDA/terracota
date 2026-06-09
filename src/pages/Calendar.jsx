import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Info,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  X
} from 'lucide-react';

export default function Calendar({ 
  pagarReceber, 
  onAdd, 
  onUpdate, 
  onDelete, 
  user,
  addToast,
  showConfirm
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedDayAccounts, setSelectedDayAccounts] = useState(null); // Para o modal do dia
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form para nova conta
  const [newTipo, setNewTipo] = useState('pagar');
  const [newDesc, setNewDesc] = useState('');
  const [newValor, setNewValor] = useState('');
  const [newVenc, setNewVenc] = useState('');
  const [newCat, setNewCat] = useState('Matéria-Prima');
  const [newObs, setNewObs] = useState('');

  // Editar conta inline
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editVenc, setEditVenc] = useState('');
  const [editStatus, setEditStatus] = useState('pendente');

  const isReadOnly = user?.perfil === 'Visualização';

  // Configurações de data do mês
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Mapear contas indexadas por data
  const accountsByDate = useMemo(() => {
    const map = {};
    pagarReceber.forEach(account => {
      const dateStr = account.vencimento;
      if (!map[dateStr]) {
        map[dateStr] = { pagar: [], receber: [], totalPagar: 0, totalReceber: 0 };
      }
      if (account.tipo === 'pagar') {
        map[dateStr].pagar.push(account);
        map[dateStr].totalPagar += parseFloat(account.valor);
      } else {
        map[dateStr].receber.push(account);
        map[dateStr].totalReceber += parseFloat(account.valor);
      }
    });
    return map;
  }, [pagarReceber]);

  // Lista de dias do mês atual para exibição na grid
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Dias em branco do mês anterior para alinhar a grid
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const dateObj = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: dateObj, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(year, month, i);
      days.push({ date: dateObj, isCurrentMonth: true });
    }

    return days;
  }, [year, month]);

  // Dias da semana atual (para visualização semanal)
  const daysInWeek = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Domingo da semana
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      days.push(dateObj);
    }
    return days;
  }, [currentDate]);

  // Drag and Drop handlers
  const handleDragStart = (e, accountId) => {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', accountId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    if (isReadOnly) return;

    const accountId = e.dataTransfer.getData('text/plain');
    if (!accountId) return;

    const account = pagarReceber.find(a => a.id === accountId);
    if (!account) return;

    if (account.vencimento === dateStr) return;

    try {
      await onUpdate(accountId, { vencimento: dateStr });
      const formattedDate = dateStr ? dateStr.split('-').reverse().join('/') : 'N/A';
      addToast(`Conta "${account.descricao}" remarcada para ${formattedDate}`, 'success');
    } catch (err) {
      addToast('Erro ao atualizar data de vencimento.', 'error');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newDesc || !newValor || !newVenc) {
      addToast('Preencha os campos obrigatórios', 'warning');
      return;
    }

    try {
      await onAdd({
        tipo: newTipo,
        descricao: newDesc,
        valor: parseFloat(newValor),
        vencimento: newVenc,
        status: 'pendente',
        categoria: newCat,
        observacoes: newObs
      });
      addToast('Compromisso financeiro agendado!', 'success');
      setShowAddModal(false);
      
      // Limpa formulário
      setNewDesc('');
      setNewValor('');
      setNewVenc('');
      setNewObs('');
    } catch (e) {
      addToast('Erro ao agendar compromisso.', 'error');
    }
  };

  const handleSaveInlineEdit = async (account) => {
    if (isReadOnly) return;
    try {
      await onUpdate(account.id, {
        descricao: editDesc,
        valor: parseFloat(editValor),
        vencimento: editVenc,
        status: editStatus
      });
      addToast('Conta atualizada com sucesso', 'success');
      setEditingAccountId(null);
      // Atualiza modal se estiver aberto
      if (selectedDayAccounts) {
        const updatedAccounts = pagarReceber.filter(a => a.vencimento === selectedDayAccounts.dateStr);
        setSelectedDayAccounts({ ...selectedDayAccounts, accounts: updatedAccounts });
      }
    } catch (e) {
      addToast('Erro ao atualizar conta', 'error');
    }
  };

  const handleDeleteAccount = (id) => {
    if (isReadOnly) return;
    showConfirm(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta conta do calendário financeiro? Esta ação é definitiva.',
      async () => {
        try {
          await onDelete(id);
          addToast('Conta removida do calendário', 'info');
          if (selectedDayAccounts) {
            const updatedAccounts = pagarReceber.filter(a => a.vencimento === selectedDayAccounts.dateStr);
            if (updatedAccounts.length === 0) {
              setSelectedDayAccounts(null);
            } else {
              setSelectedDayAccounts({ ...selectedDayAccounts, accounts: updatedAccounts });
            }
          }
        } catch (e) {
          addToast('Erro ao excluir conta', 'error');
        }
      },
      'danger'
    );
  };

  const openDayDrawer = (dateStr) => {
    const dayData = accountsByDate[dateStr];
    const accounts = [...(dayData?.pagar || []), ...(dayData?.receber || [])];
    if (accounts.length > 0) {
      setSelectedDayAccounts({ dateStr, accounts });
    } else {
      if (!isReadOnly) {
        setNewVenc(dateStr);
        setShowAddModal(true);
      }
    }
  };

  const formatBRL = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatMonthName = (date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <>
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="calendar-container animate-fade-in">
      
      {/* Cabeçalho do Calendário */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon /> Calendário Financeiro
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Arraste e solte contas para redefinir o vencimento. Vermelho para contas a pagar, verde para receber.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Seletor de visualização */}
          <div style={{
            display: 'flex',
            background: 'var(--color-primary-light)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}>
            {['month', 'week', 'day'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: 'none',
                  background: viewMode === mode ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--color-primary)',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {mode === 'month' ? 'Mensal' : mode === 'week' ? 'Semanal' : 'Diário'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={handlePrev} className="btn btn-secondary" style={{ padding: '0.5rem' }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', minWidth: '150px', textAlign: 'center' }}>
              {viewMode === 'month' && formatMonthName(currentDate)}
              {viewMode === 'week' && `Semana de ${daysInWeek[0].getDate()}/${daysInWeek[0].getMonth()+1}`}
              {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <button onClick={handleNext} className="btn btn-secondary" style={{ padding: '0.5rem' }}><ChevronRight size={16} /></button>
          </div>

          {!isReadOnly && (
            <button onClick={() => { setNewVenc(new Date().toISOString().split('T')[0]); setShowAddModal(true); }} className="btn btn-primary">
              <Plus size={16} /> Novo Agendamento
            </button>
          )}
        </div>
      </div>

      {/* VISUALIZAÇÃO MENSAL */}
      {viewMode === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          
          {/* Cabeçalho da Grid (Dias da semana) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', padding: '0.5rem 0' }}>{d}</div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            minHeight: '480px'
          }}>
            {daysInMonth.map((dayItem, index) => {
              const dateStr = dayItem.date.toISOString().split('T')[0];
              const dayData = accountsByDate[dateStr];
              
              // Regras visuais
              const hasPagar = dayData && dayData.pagar.length > 0;
              const hasReceber = dayData && dayData.receber.length > 0;
              const hasBoth = hasPagar && hasReceber;

              let borderStyle = '1px solid var(--color-border)';
              let bgStyle = 'var(--color-bg-card)';
              
              if (dayItem.isCurrentMonth) {
                if (hasBoth) {
                  borderStyle = '2px dashed var(--color-warning)';
                  bgStyle = 'linear-gradient(135deg, var(--color-danger-muted) 0%, var(--color-success-muted) 100%)';
                } else if (hasPagar) {
                  borderStyle = '2px solid var(--color-danger)';
                  bgStyle = 'var(--color-danger-muted)';
                } else if (hasReceber) {
                  borderStyle = '2px solid var(--color-success)';
                  bgStyle = 'var(--color-success-muted)';
                }
              } else {
                bgStyle = 'rgba(0,0,0,0.02)';
              }

              return (
                <div
                  key={index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  onClick={() => openDayDrawer(dateStr)}
                  className="tooltip-trigger"
                  style={{
                    background: bgStyle,
                    border: borderStyle,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    opacity: dayItem.isCurrentMonth ? 1 : 0.4
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
                    {dayItem.date.getDate()}
                  </span>

                  {/* Marcadores de compromissos */}
                  {dayData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '0.5rem' }}>
                      {hasReceber && (
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--color-success)', background: 'rgba(16,185,129,0.15)', padding: '1px 4px', borderRadius: '4px' }}>
                          🟢 +{formatBRL(dayData.totalReceber)}
                        </div>
                      )}
                      {hasPagar && (
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.15)', padding: '1px 4px', borderRadius: '4px' }}>
                          🔴 -{formatBRL(dayData.totalPagar)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tooltip ao passar o mouse */}
                  {dayData && (
                    <div className="tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', minWidth: '180px' }}>
                      <p style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px', marginBottom: '2px' }}>
                        {dayItem.date.toLocaleDateString('pt-BR')}
                      </p>
                      {hasReceber && (
                        <p style={{ color: '#6EE7B7' }}>🟢 A Receber: {formatBRL(dayData.totalReceber)} ({dayData.receber.length} contas)</p>
                      )}
                      {hasPagar && (
                        <p style={{ color: '#FCA5A5' }}>🔴 A Pagar: {formatBRL(dayData.totalPagar)} ({dayData.pagar.length} contas)</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO SEMANAL */}
      {viewMode === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', minHeight: '400px' }}>
          {daysInWeek.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayData = accountsByDate[dateStr];
            
            return (
              <div 
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                    {day.getDate()}
                  </h4>
                </div>

                {/* Contas do dia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                  {dayData ? (
                    [...(dayData.receber || []), ...(dayData.pagar || [])].map(acc => (
                      <div
                        key={acc.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, acc.id)}
                        onClick={() => openDayDrawer(dateStr)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'grab',
                          background: acc.tipo === 'receber' ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
                          borderLeft: `3px solid ${acc.tipo === 'receber' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                          color: acc.tipo === 'receber' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.descricao}</div>
                        <div>{formatBRL(acc.valor)}</div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', display: 'block', marginTop: '2rem' }}>
                      Sem contas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISUALIZAÇÃO DIÁRIA */}
      {viewMode === 'day' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
            Contas do Dia - {currentDate.toLocaleDateString('pt-BR')}
          </h3>
          {(() => {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = accountsByDate[dateStr];
            const accounts = dayData ? [...dayData.receber, ...dayData.pagar] : [];
            
            if (accounts.length === 0) {
              return (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Nenhum compromisso financeiro para este dia.
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(acc => (
                  <div 
                    key={acc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary-light)',
                      borderLeft: `4px solid ${acc.tipo === 'receber' ? 'var(--color-success)' : 'var(--color-danger)'}`
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>{acc.descricao}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Status: <span style={{ fontWeight: '600', color: acc.status === 'pago' ? 'var(--color-success)' : 'var(--color-warning)' }}>{acc.status.toUpperCase()}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{formatBRL(acc.valor)}</span>
                      {!isReadOnly && (
                        <button 
                          onClick={() => {
                            onUpdate(acc.id, { status: acc.status === 'pago' ? 'pendente' : 'pago' });
                            addToast('Status da conta atualizado!', 'success');
                          }}
                          className={`btn ${acc.status === 'pago' ? 'btn-secondary' : 'btn-success'}`}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                        >
                          {acc.status === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      </div>

      {/* DRAWER / MODAL LISTAGEM DETALHADA DO DIA (MENSAL/SEMANAL) */}
      {selectedDayAccounts && (
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
          <div className="card animate-fade-in" style={{ width: '550px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => { setSelectedDayAccounts(null); setEditingAccountId(null); }}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary)' }}>
              Detalhamento de {selectedDayAccounts.dateStr.split('-').reverse().join('/')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {selectedDayAccounts.accounts.map(acc => {
                const isEditing = editingAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      background: acc.tipo === 'receber' ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
                      borderLeft: `4px solid ${acc.tipo === 'receber' ? 'var(--color-success)' : 'var(--color-danger)'}`
                    }}
                  >
                    {isEditing ? (
                      /* Formulário Inline Edit */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8rem' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <input
                            type="number"
                            value={editValor}
                            onChange={(e) => setEditValor(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.8rem' }}
                          />
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="form-select"
                            style={{ fontSize: '0.8rem' }}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago / Recebido</option>
                          </select>
                        </div>
                        <input
                          type="date"
                          value={editVenc}
                          onChange={(e) => setEditVenc(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingAccountId(null)} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                            Cancelar
                          </button>
                          <button onClick={() => handleSaveInlineEdit(acc)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Exibição Padrão */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{acc.descricao}</h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Categoria: {acc.categoria}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: acc.status === 'pago' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {acc.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '800' }}>{formatBRL(acc.valor)}</span>
                          {!isReadOnly && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button 
                                onClick={() => {
                                  setEditingAccountId(acc.id);
                                  setEditDesc(acc.descricao);
                                  setEditValor(acc.valor.toString());
                                  setEditVenc(acc.vencimento);
                                  setEditStatus(acc.status);
                                }}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDeleteAccount(acc.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CONTA */}
      {showAddModal && (
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
          <div className="card animate-fade-in" style={{ width: '450px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Novo Compromisso Financeiro</h3>
            
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}>
                    <input type="radio" checked={newTipo === 'pagar'} onChange={() => setNewTipo('pagar')} /> Contas a Pagar (Despesa)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}>
                    <input type="radio" checked={newTipo === 'receber'} onChange={() => setNewTipo('receber')} /> Contas a Receber (Receita)
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do compromisso..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={newValor}
                    onChange={(e) => setNewValor(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={newVenc}
                    onChange={(e) => setNewVenc(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoria</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="form-select"
                >
                  <option value="Matéria-Prima">Matéria-Prima</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Venda de Produtos">Venda de Produtos</option>
                  <option value="Salários">Salários</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Observações</label>
                <textarea
                  placeholder="Instruções de pagamento..."
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  className="form-textarea"
                  rows="2"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .calendar-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
        }
      `}</style>
    </>
  );
}
