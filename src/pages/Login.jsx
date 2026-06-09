import React, { useState } from 'react';
import { db } from '../services/db';
import logo from '../assets/logo.jpg';
import { Shield, Key, User, PlusCircle, HelpCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, addToast }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register states
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regProfile, setRegProfile] = useState('Administrador');
  
  // Recovery states
  const [recoverUser, setRecoverUser] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Por favor, preencha todos os campos', 'warning');
      return;
    }

    try {
      const user = await db.usuarios.login(username, password);
      if (user) {
        addToast(`Bem-vindo, ${user.usuario}!`, 'success');
        onLoginSuccess(user);
      } else {
        addToast('Usuário ou senha incorretos.', 'error');
      }
    } catch (err) {
      addToast('Erro ao realizar login.', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUser || !regPass) {
      addToast('Preencha todos os campos do cadastro', 'warning');
      return;
    }

    try {
      const existing = await db.usuarios.list();
      if (existing.some(u => u.usuario.toLowerCase() === regUser.toLowerCase())) {
        addToast('Este usuário já existe.', 'error');
        return;
      }

      await db.usuarios.create({
        usuario: regUser,
        senha: regPass,
        perfil: regProfile
      });

      addToast('Usuário administrador cadastrado com sucesso!', 'success');
      setIsRegistering(false);
      setUsername(regUser);
      setPassword(regPass);
    } catch (err) {
      addToast('Erro ao cadastrar usuário.', 'error');
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!recoverUser) {
      addToast('Insira seu usuário', 'warning');
      return;
    }

    try {
      const users = await db.usuarios.list();
      const found = users.find(u => u.usuario.toLowerCase() === recoverUser.toLowerCase());
      if (found) {
        setRecoveryMessage(`Sua senha é: "${found.senha}". Guarde-a em segurança!`);
        addToast('Senha localizada!', 'success');
      } else {
        addToast('Usuário não encontrado no sistema.', 'error');
        setRecoveryMessage('');
      }
    } catch (e) {
      addToast('Erro ao recuperar senha.', 'error');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle, var(--color-primary-light) 0%, var(--color-bg-main) 100%)',
      padding: '1rem'
    }}>
      <div className="card glass animate-fade-in" style={{
        width: '400px',
        maxWidth: '100%',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img 
            src={logo} 
            alt="Terracota Cerâmica Logo" 
            style={{ width: '160px', height: 'auto', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }} 
          />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', letterSpacing: '1px' }}>
            PAINEL FINANCEIRO
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Acesse as contas corporativas
          </p>
        </div>

        {/* MODO RECUPERAÇÃO DE SENHA */}
        {isRecovering ? (
          <form onSubmit={handleRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Recuperar Senha
            </h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome de Usuário</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Seu usuário..."
                  value={recoverUser}
                  onChange={(e) => setRecoverUser(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            {recoveryMessage && (
              <div style={{
                background: 'var(--color-primary-muted)',
                color: 'var(--color-primary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: '500',
                textAlign: 'center',
                border: '1px solid var(--color-primary)'
              }}>
                {recoveryMessage}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Verificar
            </button>

            <button 
              type="button" 
              onClick={() => { setIsRecovering(false); setRecoveryMessage(''); }}
              className="btn btn-secondary" 
              style={{ width: '100%' }}
            >
              Voltar ao Login
            </button>
          </form>
        ) : isRegistering ? (
          /* MODO CADASTRO DE NOVO USUÁRIO */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={18} /> Novo Usuário Admin
            </h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Usuário</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Nome de usuário..."
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  placeholder="Nova senha..."
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nível de Permissão (Perfil)</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <select
                  value={regProfile}
                  onChange={(e) => setRegProfile(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                >
                  <option value="Administrador">Administrador (Total)</option>
                  <option value="Financeiro">Financeiro (Operador)</option>
                  <option value="Visualização">Visualização (Leitura)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Confirmar Cadastro
            </button>

            <button 
              type="button" 
              onClick={() => setIsRegistering(false)} 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          /* MODO LOGIN PADRÃO */
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Usuário</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Digite seu usuário..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Senha</label>
                <button
                  type="button"
                  onClick={() => setIsRecovering(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  placeholder="Digite sua senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Entrar no Painel
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span>Primeiro acesso?</span>
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}
              >
                Cadastre-se aqui
              </button>
            </div>
            
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.02)',
              border: '1px dashed var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: '1.4'
            }}>
              💡 <strong>Dica de Acesso Rápido:</strong><br />
              • Admin: usuario <code>admin</code> / senha <code>123</code><br />
              • Operador: usuario <code>financeiro</code> / senha <code>123</code>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
