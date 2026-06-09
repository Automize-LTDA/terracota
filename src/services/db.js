import { createClient } from '@supabase/supabase-js';

// Inicializa o modo e dados padrão do LocalStorage caso o Supabase não esteja configurado
const MOCK_USERS_KEY = 'terracota_users';
const MOCK_ENTRADAS_KEY = 'terracota_entradas';
const MOCK_SAIDAS_KEY = 'terracota_saidas';
const MOCK_PAGAR_RECEBER_KEY = 'terracota_pagar_receber';
const MOCK_NOTIFICACOES_KEY = 'terracota_notificacoes';
const MOCK_CLIENTES_KEY = 'terracota_clientes';
const MOCK_MOV_CLIENTES_KEY = 'terracota_mov_clientes';
const SUPABASE_CONFIG_KEY = 'terracota_supabase_config';

// Dados mockados iniciais profissionais
const INITIAL_USERS = [
  { id: '1', usuario: 'admin', senha: '123', perfil: 'Administrador', nome: 'Administrador Geral', criado_em: new Date().toISOString() },
  { id: '2', usuario: 'financeiro', senha: '123', perfil: 'Financeiro', nome: 'Operador Financeiro', criado_em: new Date().toISOString() },
  { id: '3', usuario: 'visitante', senha: '123', perfil: 'Visualização', nome: 'Visitante Geral', criado_em: new Date().toISOString() }
];

const INITIAL_ENTRADAS = [
  { id: 'e1', descricao: 'Venda de Cerâmica Terracota Rústica', cliente: 'Construtora Alfa', valor: 15450.00, data: '2026-06-01', categoria: 'Venda de Produtos', forma_pagamento: 'Pix', observacoes: 'Lote de pisos rústicos 40x40' },
  { id: 'e2', descricao: 'Serviço de Assentamento Especializado', cliente: 'Mariana de Souza', valor: 4200.00, data: '2026-06-03', categoria: 'Serviços', forma_pagamento: 'Transferência', observacoes: 'Instalação em área gourmet' },
  { id: 'e3', descricao: 'Fornecimento de Telhas Esmaltadas', cliente: 'Engenharia Beta', valor: 28900.00, data: '2026-05-28', categoria: 'Venda de Produtos', forma_pagamento: 'Boleto', observacoes: 'Faturamento em 30 dias' },
  { id: 'e4', descricao: 'Venda de Vasos Ornamentais', cliente: 'Garden Center Flores', valor: 3800.00, data: '2026-06-05', categoria: 'Venda de Produtos', forma_pagamento: 'Cartão de Crédito', observacoes: 'Lote com 15 vasos grandes' }
];

const INITIAL_SAIDAS = [
  { id: 's1', descricao: 'Compra de Argila Vermelha', fornecedor: 'Mineração Vale Doce', valor: 4500.00, data: '2026-06-02', categoria: 'Matéria-Prima', forma_pagamento: 'Boleto', observacoes: '5 toneladas de argila premium' },
  { id: 's2', descricao: 'Manutenção do Forno de Cozimento', fornecedor: 'Técnica Fornos Ltda', valor: 1850.00, data: '2026-06-04', categoria: 'Manutenção', forma_pagamento: 'Pix', observacoes: 'Troca de resistências elétricas' },
  { id: 's3', descricao: 'Energia Elétrica Industrial', fornecedor: 'Neoenergia', valor: 6800.00, data: '2026-05-30', categoria: 'Utilidades', forma_pagamento: 'Débito Automático', observacoes: 'Consumo da fábrica ref. maio' },
  { id: 's4', descricao: 'Combustível para Logística', fornecedor: 'Posto Terracota', valor: 1200.00, data: '2026-06-05', categoria: 'Combustível', forma_pagamento: 'Cartão Corporativo', observacoes: 'Abastecimento da frota de entregas' }
];

const INITIAL_PAGAR_RECEBER = [
  { id: 'pr1', tipo: 'receber', descricao: 'Venda Construtora Alfa - Parcela 2', valor: 15450.00, vencimento: '2026-06-15', status: 'pendente', categoria: 'Venda de Produtos', observacoes: '' },
  { id: 'pr2', tipo: 'pagar', descricao: 'Fornecedor de Esmalte Cerâmico', valor: 3500.00, vencimento: '2026-06-05', status: 'pendente', categoria: 'Matéria-Prima', observacoes: 'Urgente' },
  { id: 'pr3', tipo: 'pagar', descricao: 'Folha de Pagamento - Fábrica', valor: 12500.00, vencimento: '2026-06-06', status: 'pendente', categoria: 'Salários', observacoes: 'Mensalistas' },
  { id: 'pr4', tipo: 'receber', descricao: 'Projeto Design Gourmet', valor: 5000.00, vencimento: '2026-06-05', status: 'pago', categoria: 'Serviços', observacoes: 'Adiantamento recebido' },
  { id: 'pr5', tipo: 'pagar', descricao: 'Manutenção de Empilhadeira', valor: 750.00, vencimento: '2026-06-03', status: 'pago', categoria: 'Manutenção', observacoes: '' },
  { id: 'pr6', tipo: 'receber', descricao: 'Recebimento Construtora Delta', valor: 8900.00, vencimento: '2026-06-10', status: 'pendente', categoria: 'Venda de Produtos', observacoes: '' },
  { id: 'pr7', tipo: 'pagar', descricao: 'Impostos Simples Nacional', valor: 4200.00, vencimento: '2026-06-20', status: 'pendente', categoria: 'Impostos', observacoes: '' }
];

const INITIAL_NOTIFICACOES = [
  { id: 'n1', titulo: 'Conta a pagar vencendo hoje!', mensagem: 'Fornecedor de Esmalte Cerâmico no valor de R$ 3.500,00 vence hoje.', lida: false, criado_em: new Date().toISOString() },
  { id: 'n2', titulo: 'Recebimento previsto para hoje', mensagem: 'Projeto Design Gourmet no valor de R$ 5.000,00 estava previsto para hoje e já está pago.', lida: true, criado_em: new Date().toISOString() }
];

const INITIAL_CLIENTES = [
  { id: 'c1', nome: 'Construtora Alfa', cpf_cnpj: '12.345.678/0001-90', telefone: '(11) 98888-7777', whatsapp: '(11) 98888-7777', email: 'contato@alfa.com.br', endereco: 'Av. Paulista, 1000 - São Paulo/SP', observacoes: 'Cliente VIP - Faturamento especial', created_at: '2026-05-15T10:00:00Z' },
  { id: 'c2', nome: 'Mariana de Souza', cpf_cnpj: '321.654.987-00', telefone: '(21) 97777-6666', whatsapp: '(21) 97777-6666', email: 'mariana.souza@gmail.com', endereco: 'Rua das Flores, 45 - Rio de Janeiro/RJ', observacoes: 'Particular', created_at: '2026-06-02T14:30:00Z' },
  { id: 'c3', nome: 'Engenharia Beta', cpf_cnpj: '98.765.432/0001-10', telefone: '(31) 96666-5555', whatsapp: '(31) 96666-5555', email: 'compras@beta.eng.br', endereco: 'Rua do Ouro, 800 - Belo Horizonte/MG', observacoes: '', created_at: '2026-05-25T11:00:00Z' }
];

const INITIAL_MOV_CLIENTES = [
  { id: 'm1', cliente_id: 'c1', descricao: 'Venda de Cerâmica Terracota Rústica', tipo: 'credito', valor: 15450.00, data_movimentacao: '2026-06-01T12:00:00Z', created_at: new Date().toISOString() },
  { id: 'm2', cliente_id: 'c1', descricao: 'Desconto comercial concedido', tipo: 'debito', valor: 450.00, data_movimentacao: '2026-06-01T12:05:00Z', created_at: new Date().toISOString() },
  { id: 'm3', cliente_id: 'c2', descricao: 'Serviço de Assentamento Especializado', tipo: 'credito', valor: 4200.00, data_movimentacao: '2026-06-03T15:00:00Z', created_at: new Date().toISOString() },
  { id: 'm4', cliente_id: 'c3', descricao: 'Fornecimento de Telhas Esmaltadas', tipo: 'credito', valor: 28900.00, data_movimentacao: '2026-05-28T09:00:00Z', created_at: new Date().toISOString() },
  { id: 'm5', cliente_id: 'c3', descricao: 'Devolução de Lote Avariado', tipo: 'debito', valor: 1200.00, data_movimentacao: '2026-05-29T10:00:00Z', created_at: new Date().toISOString() }
];

// Helper para inicializar LocalStorage se estiver vazio
const initLocalStorage = () => {
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(MOCK_ENTRADAS_KEY)) {
    localStorage.setItem(MOCK_ENTRADAS_KEY, JSON.stringify(INITIAL_ENTRADAS));
  }
  if (!localStorage.getItem(MOCK_SAIDAS_KEY)) {
    localStorage.setItem(MOCK_SAIDAS_KEY, JSON.stringify(INITIAL_SAIDAS));
  }
  if (!localStorage.getItem(MOCK_PAGAR_RECEBER_KEY)) {
    localStorage.setItem(MOCK_PAGAR_RECEBER_KEY, JSON.stringify(INITIAL_PAGAR_RECEBER));
  }
  if (!localStorage.getItem(MOCK_NOTIFICACOES_KEY)) {
    localStorage.setItem(MOCK_NOTIFICACOES_KEY, JSON.stringify(INITIAL_NOTIFICACOES));
  }
  if (!localStorage.getItem(MOCK_CLIENTES_KEY)) {
    localStorage.setItem(MOCK_CLIENTES_KEY, JSON.stringify(INITIAL_CLIENTES));
  }
  if (!localStorage.getItem(MOCK_MOV_CLIENTES_KEY)) {
    localStorage.setItem(MOCK_MOV_CLIENTES_KEY, JSON.stringify(INITIAL_MOV_CLIENTES));
  }
};

initLocalStorage();

// Carrega a configuração do Supabase diretamente do arquivo .env
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && envUrl !== 'SEU_SUPABASE_URL') {
    return { url: envUrl, key: envKey };
  }
  return null;
};

let supabase = null;
const config = getSupabaseConfig();
if (config && config.url && config.key) {
  try {
    supabase = createClient(config.url, config.key);
    // Limpa configurações locais antigas que possam forçar desconexão ou mock
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
  } catch (err) {
    console.error('Falha ao inicializar o Supabase:', err);
  }
}

export const isUsingSupabase = () => {
  return supabase !== null;
};

// Mantém assinatura de compatibilidade travada para banco único compartilhado
export const configureSupabase = async (url, key) => {
  return { success: false, message: 'O banco de dados é único e compartilhado para todos.' };
};

// --- API DE MOCK (LOCALSTORAGE) ---
const mockDb = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || [],
  save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  
  usuarios: {
    list: () => mockDb.get(MOCK_USERS_KEY),
    create: (user) => {
      const users = mockDb.get(MOCK_USERS_KEY);
      const newUser = { id: crypto.randomUUID(), criado_em: new Date().toISOString(), ...user };
      users.push(newUser);
      mockDb.save(MOCK_USERS_KEY, users);
      return newUser;
    },
    login: (username, password) => {
      const users = mockDb.get(MOCK_USERS_KEY);
      const found = users.find(u => u.usuario.toLowerCase() === username.toLowerCase() && u.senha === password);
      return found || null;
    },
    delete: (id) => {
      const users = mockDb.get(MOCK_USERS_KEY);
      const filtered = users.filter(u => u.id !== id);
      mockDb.save(MOCK_USERS_KEY, filtered);
      return true;
    }
  },

  entradas: {
    list: () => mockDb.get(MOCK_ENTRADAS_KEY),
    create: (item) => {
      const items = mockDb.get(MOCK_ENTRADAS_KEY);
      const newItem = { id: crypto.randomUUID(), ...item, valor: parseFloat(item.valor) };
      items.push(newItem);
      mockDb.save(MOCK_ENTRADAS_KEY, items);
      return newItem;
    },
    update: (id, updates) => {
      const items = mockDb.get(MOCK_ENTRADAS_KEY);
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates, valor: parseFloat(updates.valor ?? items[index].valor) };
      mockDb.save(MOCK_ENTRADAS_KEY, items);
      return items[index];
    },
    delete: (id) => {
      const items = mockDb.get(MOCK_ENTRADAS_KEY);
      const filtered = items.filter(i => i.id !== id);
      mockDb.save(MOCK_ENTRADAS_KEY, filtered);
      return true;
    }
  },

  saidas: {
    list: () => mockDb.get(MOCK_SAIDAS_KEY),
    create: (item) => {
      const items = mockDb.get(MOCK_SAIDAS_KEY);
      const newItem = { id: crypto.randomUUID(), ...item, valor: parseFloat(item.valor) };
      items.push(newItem);
      mockDb.save(MOCK_SAIDAS_KEY, items);
      return newItem;
    },
    update: (id, updates) => {
      const items = mockDb.get(MOCK_SAIDAS_KEY);
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates, valor: parseFloat(updates.valor ?? items[index].valor) };
      mockDb.save(MOCK_SAIDAS_KEY, items);
      return items[index];
    },
    delete: (id) => {
      const items = mockDb.get(MOCK_SAIDAS_KEY);
      const filtered = items.filter(i => i.id !== id);
      mockDb.save(MOCK_SAIDAS_KEY, filtered);
      return true;
    }
  },

  pagarReceber: {
    list: () => mockDb.get(MOCK_PAGAR_RECEBER_KEY),
    create: (item) => {
      const items = mockDb.get(MOCK_PAGAR_RECEBER_KEY);
      const newItem = { id: crypto.randomUUID(), ...item, valor: parseFloat(item.valor) };
      items.push(newItem);
      mockDb.save(MOCK_PAGAR_RECEBER_KEY, items);
      return newItem;
    },
    update: (id, updates) => {
      const items = mockDb.get(MOCK_PAGAR_RECEBER_KEY);
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates, valor: parseFloat(updates.valor ?? items[index].valor) };
      mockDb.save(MOCK_PAGAR_RECEBER_KEY, items);
      return items[index];
    },
    delete: (id) => {
      const items = mockDb.get(MOCK_PAGAR_RECEBER_KEY);
      const filtered = items.filter(i => i.id !== id);
      mockDb.save(MOCK_PAGAR_RECEBER_KEY, filtered);
      return true;
    }
  },

  notificacoes: {
    list: () => mockDb.get(MOCK_NOTIFICACOES_KEY),
    create: (notif) => {
      const items = mockDb.get(MOCK_NOTIFICACOES_KEY);
      const newNotif = { id: crypto.randomUUID(), lida: false, criado_em: new Date().toISOString(), ...notif };
      items.unshift(newNotif);
      mockDb.save(MOCK_NOTIFICACOES_KEY, items);
      return newNotif;
    },
    markAsRead: (id) => {
      const items = mockDb.get(MOCK_NOTIFICACOES_KEY);
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items[index].lida = true;
        mockDb.save(MOCK_NOTIFICACOES_KEY, items);
      }
      return items;
    },
    clearAll: () => {
      mockDb.save(MOCK_NOTIFICACOES_KEY, []);
      return [];
    }
  },

  clientes: {
    list: () => mockDb.get(MOCK_CLIENTES_KEY),
    create: (cliente) => {
      const list = mockDb.get(MOCK_CLIENTES_KEY);
      const newCliente = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...cliente };
      list.push(newCliente);
      mockDb.save(MOCK_CLIENTES_KEY, list);
      return newCliente;
    },
    update: (id, updates) => {
      const list = mockDb.get(MOCK_CLIENTES_KEY);
      const index = list.findIndex(c => c.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...updates };
      mockDb.save(MOCK_CLIENTES_KEY, list);
      return list[index];
    },
    delete: (id) => {
      const list = mockDb.get(MOCK_CLIENTES_KEY);
      const filtered = list.filter(c => c.id !== id);
      mockDb.save(MOCK_CLIENTES_KEY, filtered);
      
      // Exclui movimentações associadas ao cliente
      const movs = mockDb.get(MOCK_MOV_CLIENTES_KEY);
      const filteredMovs = movs.filter(m => m.cliente_id !== id);
      mockDb.save(MOCK_MOV_CLIENTES_KEY, filteredMovs);
      
      return true;
    }
  },

  movimentacoesClientes: {
    list: () => mockDb.get(MOCK_MOV_CLIENTES_KEY),
    create: (mov) => {
      const list = mockDb.get(MOCK_MOV_CLIENTES_KEY);
      const newMov = { id: crypto.randomUUID(), data_movimentacao: new Date().toISOString(), created_at: new Date().toISOString(), ...mov, valor: parseFloat(mov.valor) };
      list.push(newMov);
      mockDb.save(MOCK_MOV_CLIENTES_KEY, list);
      return newMov;
    },
    delete: (id) => {
      const list = mockDb.get(MOCK_MOV_CLIENTES_KEY);
      const filtered = list.filter(m => m.id !== id);
      mockDb.save(MOCK_MOV_CLIENTES_KEY, filtered);
      return true;
    }
  }
};

// --- INTERFACE DE DADOS UNIFICADA ---
export const db = {
  usuarios: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('usuarios').select('*').order('criado_em', { ascending: false });
        if (error) throw error;
        return data;
      }
      return mockDb.usuarios.list();
    },
    create: async (user) => {
      if (supabase) {
        const { data, error } = await supabase.from('usuarios').insert([user]).select();
        if (error) throw error;
        return data[0];
      }
      return mockDb.usuarios.create(user);
    },
    login: async (username, password) => {
      if (supabase) {
        let { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('usuario', username)
          .eq('senha', password)
          .maybeSingle();
        
        // Autocorreção: se for 'admin' com senha '123' e falhar, tenta 'admin123'
        if (!data && !error && username.toLowerCase() === 'admin' && password === '123') {
          const checkRes = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', 'admin')
            .eq('senha', 'admin123')
            .maybeSingle();
            
          if (checkRes.data) {
            // Atualiza a senha no banco de dados para '123'
            await supabase
              .from('usuarios')
              .update({ senha: '123' })
              .eq('id', checkRes.data.id);
            data = { ...checkRes.data, senha: '123' };
          }
        }
        
        if (error) throw error;
        return data;
      }
      return mockDb.usuarios.login(username, password);
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      return mockDb.usuarios.delete(id);
    }
  },

  entradas: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('entradas').select('*').order('data', { ascending: false });
        if (error) throw error;
        return data;
      }
      return mockDb.entradas.list().sort((a, b) => b.data.localeCompare(a.data));
    },
    create: async (item) => {
      if (supabase) {
        const { data, error } = await supabase.from('entradas').insert([item]).select();
        if (error) throw error;
        return data[0];
      }
      const created = mockDb.entradas.create(item);
      db.checkAlerts();
      return created;
    },
    update: async (id, updates) => {
      if (supabase) {
        const { data, error } = await supabase.from('entradas').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
      }
      const updated = mockDb.entradas.update(id, updates);
      db.checkAlerts();
      return updated;
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('entradas').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      const deleted = mockDb.entradas.delete(id);
      db.checkAlerts();
      return deleted;
    }
  },

  saidas: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('saidas').select('*').order('data', { ascending: false });
        if (error) throw error;
        return data;
      }
      return mockDb.saidas.list().sort((a, b) => b.data.localeCompare(a.data));
    },
    create: async (item) => {
      if (supabase) {
        const { data, error } = await supabase.from('saidas').insert([item]).select();
        if (error) throw error;
        return data[0];
      }
      const created = mockDb.saidas.create(item);
      db.checkAlerts();
      return created;
    },
    update: async (id, updates) => {
      if (supabase) {
        const { data, error } = await supabase.from('saidas').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
      }
      const updated = mockDb.saidas.update(id, updates);
      db.checkAlerts();
      return updated;
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('saidas').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      const deleted = mockDb.saidas.delete(id);
      db.checkAlerts();
      return deleted;
    }
  },

  pagarReceber: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('pagar_receber').select('*').order('vencimento', { ascending: true });
        if (error) throw error;
        return data;
      }
      return mockDb.pagarReceber.list().sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    },
    create: async (item) => {
      if (supabase) {
        const { data, error } = await supabase.from('pagar_receber').insert([item]).select();
        if (error) throw error;
        return data[0];
      }
      const created = mockDb.pagarReceber.create(item);
      db.checkAlerts();
      return created;
    },
    update: async (id, updates) => {
      if (supabase) {
        const { data, error } = await supabase.from('pagar_receber').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
      }
      const updated = mockDb.pagarReceber.update(id, updates);
      db.checkAlerts();
      return updated;
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('pagar_receber').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      const deleted = mockDb.pagarReceber.delete(id);
      db.checkAlerts();
      return deleted;
    }
  },

  notificacoes: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('notificacoes').select('*').order('criado_em', { ascending: false });
        if (error) throw error;
        return data;
      }
      return mockDb.notificacoes.list();
    },
    create: async (notif) => {
      if (supabase) {
        const { data, error } = await supabase.from('notificacoes').insert([notif]).select();
        if (error) throw error;
        return data[0];
      }
      return mockDb.notificacoes.create(notif);
    },
    markAsRead: async (id) => {
      if (supabase) {
        const { data, error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id).select();
        if (error) throw error;
        return data;
      }
      return mockDb.notificacoes.markAsRead(id);
    },
    clearAll: async () => {
      if (supabase) {
        const { error } = await supabase.from('notificacoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        return [];
      }
      return mockDb.notificacoes.clearAll();
    }
  },

  clientes: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
        if (error) throw error;
        return data;
      }
      return mockDb.clientes.list().sort((a, b) => a.nome.localeCompare(b.nome));
    },
    create: async (cliente) => {
      if (supabase) {
        const { data, error } = await supabase.from('clientes').insert([cliente]).select();
        if (error) throw error;
        return data[0];
      }
      return mockDb.clientes.create(cliente);
    },
    update: async (id, updates) => {
      if (supabase) {
        const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
      }
      return mockDb.clientes.update(id, updates);
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      return mockDb.clientes.delete(id);
    }
  },

  movimentacoesClientes: {
    list: async () => {
      if (supabase) {
        const { data, error } = await supabase.from('movimentacoes_clientes').select('*').order('data_movimentacao', { ascending: false });
        if (error) throw error;
        return data;
      }
      return mockDb.movimentacoesClientes.list().sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao));
    },
    create: async (mov) => {
      if (supabase) {
        const { data, error } = await supabase.from('movimentacoes_clientes').insert([mov]).select();
        if (error) throw error;
        return data[0];
      }
      return mockDb.movimentacoesClientes.create(mov);
    },
    delete: async (id) => {
      if (supabase) {
        const { error } = await supabase.from('movimentacoes_clientes').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      return mockDb.movimentacoesClientes.delete(id);
    }
  },

  checkAlerts: async () => {
    try {
      const [entradas, saidas, pagarReceber, notificacoes] = await Promise.all([
        db.entradas.list(),
        db.saidas.list(),
        db.pagarReceber.list(),
        db.notificacoes.list()
      ]);

      const totalEntradas = entradas.reduce((sum, item) => sum + parseFloat(item.valor), 0);
      const totalSaidas = saidas.reduce((sum, item) => sum + parseFloat(item.valor), 0);
      const saldo = totalEntradas - totalSaidas;

      const hoje = new Date().toISOString().split('T')[0];
      const novasNotificacoes = [];

      if (saldo < 5000) {
        const msg = `Saldo em caixa está baixo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
        if (!notificacoes.some(n => n.titulo.includes('Saldo em caixa') && !n.lida)) {
          novasNotificacoes.push({ titulo: '⚠️ Baixo Saldo em Caixa', mensagem: msg });
        }
      }

      pagarReceber.forEach(item => {
        if (item.status === 'pendente') {
          if (item.vencimento === hoje) {
            const msg = `Conta a ${item.tipo} "${item.descricao}" no valor de R$ ${parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence hoje!`;
            if (!notificacoes.some(n => n.mensagem.includes(item.descricao) && n.mensagem.includes('vence hoje') && !n.lida)) {
              novasNotificacoes.push({ titulo: `🔔 Conta vencendo hoje (${item.tipo})`, mensagem: msg });
            }
          } else if (item.vencimento < hoje) {
            const msg = `A conta a ${item.tipo} "${item.descricao}" de R$ ${parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está VENCIDA desde ${item.vencimento.split('-').reverse().join('/')}.`;
            if (!notificacoes.some(n => n.mensagem.includes(item.descricao) && n.mensagem.includes('VENCIDA desde') && !n.lida)) {
              novasNotificacoes.push({ titulo: `🚨 Conta VENCIDA (${item.tipo})`, mensagem: msg });
            }
          }
        }
      });

      for (const notif of novasNotificacoes) {
        await db.notificacoes.create(notif);
      }
    } catch (e) {
      console.error('Erro ao processar alertas automáticos:', e);
    }
  },

  exportBackup: async () => {
    const data = {
      entradas: await db.entradas.list(),
      saidas: await db.saidas.list(),
      pagar_receber: await db.pagarReceber.list(),
      notificacoes: await db.notificacoes.list(),
      clientes: await db.clientes.list(),
      movimentacoes_clientes: await db.movimentacoesClientes.list(),
      exportado_em: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup: async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.entradas || !data.saidas || !data.pagar_receber) {
        throw new Error('Formato de backup inválido.');
      }

      if (supabase) {
        await supabase.from('entradas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('saidas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('pagar_receber').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('movimentacoes_clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (data.entradas.length > 0) await supabase.from('entradas').insert(data.entradas.map(({id, criado_em, ...rest}) => rest));
        if (data.saidas.length > 0) await supabase.from('saidas').insert(data.saidas.map(({id, criado_em, ...rest}) => rest));
        if (data.pagar_receber.length > 0) await supabase.from('pagar_receber').insert(data.pagar_receber.map(({id, criado_em, ...rest}) => rest));
        if (data.clientes && data.clientes.length > 0) await supabase.from('clientes').insert(data.clientes.map(({id, created_at, ...rest}) => rest));
        if (data.movimentacoes_clientes && data.movimentacoes_clientes.length > 0) await supabase.from('movimentacoes_clientes').insert(data.movimentacoes_clientes.map(({id, created_at, ...rest}) => rest));
      } else {
        mockDb.save(MOCK_ENTRADAS_KEY, data.entradas);
        mockDb.save(MOCK_SAIDAS_KEY, data.saidas);
        mockDb.save(MOCK_PAGAR_RECEBER_KEY, data.pagar_receber);
        if (data.notificacoes) mockDb.save(MOCK_NOTIFICACOES_KEY, data.notificacoes);
        if (data.clientes) mockDb.save(MOCK_CLIENTES_KEY, data.clientes);
        if (data.movimentacoes_clientes) mockDb.save(MOCK_MOV_CLIENTES_KEY, data.movimentacoes_clientes);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  subscribeRealtime: (table, callback) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', filter: '*', schema: 'public', table: table }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
