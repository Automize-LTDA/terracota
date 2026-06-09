import React, { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Eye,
  KeyRound,
  X,
  Plus
} from 'lucide-react';

export default function Administradores({ 
  usuarios, 
  onAddUsuario, 
  onDeleteUsuario, 
  user, 
  addToast,
  showConfirm
}) {
  const [showModal, setShowModal] = useState(false);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState('Financeiro');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullname || !username || !password) {
      addToast('Todos os campos são obrigatórios.', 'warning');
      return;
    }

    // Prevenir duplicado
    if (usuarios.some(u => u.usuario.toLowerCase() === username.toLowerCase())) {
      addToast('Este usuário de login já existe no sistema.', 'error');
      return;
    }

    try {
      await onAddUsuario({
        nome: fullname,
        usuario: username,
        senha: password,
        perfil: profile
      });
      addToast(`Usuário "${fullname}" cadastrado com sucesso!`, 'success');
      
      // Reseta form
      setFullname('');
      setUsername('');
      setPassword('');
      setProfile('Financeiro');
      setShowModal(false);
    } catch (e) {
      addToast('Erro ao cadastrar usuário.', 'error');
    }
  };

  const handleDelete = (uItem) => {
    if (uItem.usuario.toLowerCase() === 'admin') {
      addToast('O usuário administrador principal ("admin") não pode ser excluído.', 'warning');
      return;
    }

    if (uItem.id === user.id) {
      addToast('Você não pode excluir sua própria conta logada.', 'warning');
      return;
    }

    showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir permanentemente o usuário "${uItem.nome || uItem.usuario}"? Esta ação removerá o acesso desta conta e não pode ser desfeita.`,
      async () => {
        try {
          await onDeleteUsuario(uItem.id);
          addToast(`Usuário "${uItem.nome || uItem.usuario}" excluído com sucesso.`, 'info');
        } catch (e) {
          addToast('Erro ao excluir usuário.', 'error');
        }
      },
      'danger'
    );
  };

  return (
    <>
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="admin-container animate-fade-in">
      
      {/* Título & Botão Novo Usuário */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound /> Controle de Acesso e Administradores
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Gerencie perfis, permissões e contas de usuários que acessam o ERP.</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Login / Usuário</th>
              <th>Nível de Permissão (Perfil)</th>
              <th>Data de Cadastro</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Excluir</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const isAdmin = u.perfil === 'Administrador';
              const isFin = u.perfil === 'Financeiro';
              
              let badgeBg = 'var(--color-primary-muted)';
              let badgeColor = 'var(--color-primary)';
              let icon = <ShieldAlert size={14} />;

              if (isAdmin) {
                badgeBg = 'var(--color-danger-muted)';
                badgeColor = 'var(--color-danger)';
                icon = <ShieldAlert size={14} />;
              } else if (isFin) {
                badgeBg = 'var(--color-success-muted)';
                badgeColor = 'var(--color-success)';
                icon = <ShieldCheck size={14} />;
              } else {
                badgeBg = 'rgba(59, 130, 246, 0.1)';
                badgeColor = 'var(--color-info)';
                icon = <Eye size={14} />;
              }

              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600' }}>{u.nome || 'Sem Nome'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>@{u.usuario}</td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-sm)', 
                      background: badgeBg, 
                      color: badgeColor,
                      fontSize: '0.75rem', 
                      fontWeight: '700' 
                    }}>
                      {icon} {u.perfil}
                    </span>
                  </td>
                  <td>
                    {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleDelete(u)}
                        disabled={u.usuario.toLowerCase() === 'admin' || u.id === user.id}
                        style={{ 
                          border: 'none', 
                          background: 'none', 
                          cursor: (u.usuario.toLowerCase() === 'admin' || u.id === user.id) ? 'not-allowed' : 'pointer', 
                          color: 'var(--color-danger)', 
                          padding: '0.25rem',
                          opacity: (u.usuario.toLowerCase() === 'admin' || u.id === user.id) ? 0.3 : 1
                        }}
                        title="Excluir Usuário"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal Novo Usuário */}
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
          <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Novo Usuário Administrativo</h3>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo..."
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome de Usuário (Login) *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome de login..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Senha de Acesso *</label>
                <input
                  type="password"
                  required
                  placeholder="Senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nível de Permissão (Perfil)</label>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="form-select"
                >
                  <option value="Administrador">Administrador (Total)</option>
                  <option value="Financeiro">Financeiro (Operador)</option>
                  <option value="Visualização">Visualização (Apenas Leitura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
        }
      `}</style>
    </>
  );
}
