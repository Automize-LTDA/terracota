import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Database, 
  Settings,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';
import { isUsingSupabase, getSupabaseConfig, configureSupabase, db } from '../services/db';

export default function Header({ 
  globalSearch, 
  setGlobalSearch, 
  notifications, 
  setNotifications, 
  addToast 
}) {
  const [theme, setTheme] = useState(localStorage.getItem('terracota_theme') || 'light');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(isUsingSupabase());

  // Aplicar tema no html/body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('terracota_theme', theme);
  }, [theme]);

  // Carregar chaves salvas ao abrir modal
  useEffect(() => {
    const savedConfig = getSupabaseConfig();
    if (savedConfig) {
      setSupabaseUrl(savedConfig.url || '');
      setSupabaseKey(savedConfig.key || '');
    }
  }, [showConfigModal]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMarkAsRead = async (id) => {
    try {
      const updated = await db.notificacoes.markAsRead(id);
      setNotifications(updated);
    } catch (e) {
      addToast('Erro ao marcar notificação como lida', 'error');
    }
  };

  const handleClearAllNotif = async () => {
    try {
      await db.notificacoes.clearAll();
      setNotifications([]);
      addToast('Notificações limpas com sucesso', 'success');
    } catch (e) {
      addToast('Erro ao limpar notificações', 'error');
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 900,
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      marginLeft: '260px',
      transition: 'var(--transition-smooth)'
    }}>
      {/* Busca Global */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px', maxWidth: '40%' }}>
        <Search size={18} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Busca global em todo o sistema..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="form-input"
          style={{
            width: '100%',
            paddingLeft: '2.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-main)',
            border: '1px solid var(--color-border)'
          }}
        />
      </div>

      {/* Controles de Ação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        

        {/* Notificações Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--color-text-main)',
              position: 'relative',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            className="btn-icon"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'var(--color-danger)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-bg-card)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notificações Dropdown */}
          {showNotifDropdown && (
            <div className="glass" style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: '320px',
              marginTop: '0.75rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid var(--color-border)',
              maxHeight: '400px',
              overflowY: 'auto',
              background: 'var(--color-bg-card)',
              zIndex: 950
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Central de Notificações</h4>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAllNotif}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Trash2 size={12} /> Limpar
                  </button>
                )}
              </div>
              <div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Nenhuma notificação ativa.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--color-border)',
                        background: notif.lida ? 'transparent' : 'var(--color-primary-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)' }}>{notif.titulo}</span>
                        {!notif.lida && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-success)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Marcar como lida"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-main)' }}>{notif.mensagem}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {new Date(notif.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tema Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'var(--color-text-main)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          className="btn-icon"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

      </div>

      {/* Modal Configuração Supabase */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div className="card animate-fade-in" style={{ width: '450px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setShowConfigModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
              <Database size={20} /> Banco de Dados Compartilhado
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.75rem', fontWeight: '600' }}>
              Modo Conectado: Nuvem Geral
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              O sistema está sincronizado em tempo real com o banco de dados Supabase da empresa. Qualquer alteração feita aqui será refletida instantaneamente para todos os administradores e colaboradores em outros dispositivos.
            </p>

            <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: '600' }}>Banco de Dados:</span>
                <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {supabaseUrl ? supabaseUrl.replace('https://', '') : 'Conectado'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: '600' }}>Status do Serviço:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={14} /> Ativo & Sincronizado
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                className="btn btn-primary"
                style={{ width: '100px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX for Responsive header */}
      <style>{`
        @media (max-width: 768px) {
          header {
            margin-left: 0 !important;
            padding: 0.85rem 1rem !important;
            padding-left: 4.5rem !important;
          }
        }
      `}</style>
    </header>
  );
}
