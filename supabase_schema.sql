-- Schema para Banco de Dados do Painel Administrativo Financeiro Terracota

-- Limpa as tabelas existentes para garantir que o schema seja recriado do zero sem conflitos
DROP TABLE IF EXISTS movimentacoes_clientes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS pagar_receber CASCADE;
DROP TABLE IF EXISTS saidas CASCADE;
DROP TABLE IF EXISTS entradas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL DEFAULT 'Colaborador',
    usuario VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('Administrador', 'Financeiro', 'Visualização')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de entradas
CREATE TABLE IF NOT EXISTS entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data DATE NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de saídas
CREATE TABLE IF NOT EXISTS saidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    fornecedor VARCHAR(255) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data DATE NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a pagar e receber (Calendário Financeiro)
CREATE TABLE IF NOT EXISTS pagar_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pagar', 'receber')),
    descricao TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pago', 'pendente')),
    categoria VARCHAR(100) NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentações financeiras de clientes (Débito e Crédito)
CREATE TABLE IF NOT EXISTS movimentacoes_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('credito','debito')),
    valor DECIMAL(15,2) NOT NULL,
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar replicação em tempo real para as tabelas que requerem Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE entradas;
ALTER PUBLICATION supabase_realtime ADD TABLE saidas;
ALTER PUBLICATION supabase_realtime ADD TABLE pagar_receber;
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE movimentacoes_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;

-- Desativar RLS (Row Level Security) para permitir consultas e cadastros pelo site
ALTER TABLE entradas DISABLE ROW LEVEL SECURITY;
ALTER TABLE saidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagar_receber DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Usuário Administrador Inicial Padrão
INSERT INTO usuarios (usuario, senha, perfil, nome)
VALUES ('admin', '123', 'Administrador', 'Administrador Geral')
ON CONFLICT (usuario) DO NOTHING;
