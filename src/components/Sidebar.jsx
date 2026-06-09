import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  CalendarDays, 
  FileSpreadsheet, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert,
  User,
  Users,
  UserCog
} from 'lucide-react';
import logo from '../assets/logo.jpg';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'entradas', label: 'Entradas', icon: TrendingUp, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'saidas', label: 'Saídas', icon: TrendingDown, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'calendario', label: 'Calendário Fin.', icon: CalendarDays, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'relatorios', label: 'Relatórios e Impressão', icon: FileSpreadsheet, roles: ['Administrador', 'Financeiro', 'Visualização'] },
    { id: 'usuarios', label: 'Administradores', icon: UserCog, roles: ['Administrador'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.perfil));

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-toggle-btn"
        onClick={toggleSidebar}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          padding: '0.625rem',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          boxShadow: '0 4px 6px var(--color-shadow)'
        }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <aside 
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          height: '100vh',
          background: 'var(--color-bg-sidebar)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999,
          transition: 'var(--transition-smooth)'
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem'
        }}>
          <img 
            src={logo} 
            alt="Terracota Cerâmica Logo" 
            style={{
              maxWidth: '85%',
              height: 'auto',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }} 
          />
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--color-primary)',
            marginTop: '0.5rem',
            letterSpacing: '0.5px',
            textAlign: 'center'
          }}>
            PAINEL FINANCEIRO
          </h2>
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className="btn-nav"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: isActive ? 'var(--color-primary-muted)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontWeight: isActive ? '600' : '400',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                  transition: 'var(--transition-smooth)',
                  width: '100%'
                }}
              >
                <IconComponent size={18} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Info Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-primary-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={user?.nome || user?.usuario}>
                {user?.nome || user?.usuario}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <ShieldAlert size={12} />
                {user?.perfil}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'var(--transition-smooth)',
              width: '100%'
            }}
          >
            <LogOut size={14} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 998
          }}
        />
      )}

      {/* Styled JSX for Responsive sidebar behavior */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle-btn {
            display: flex !important;
          }
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
