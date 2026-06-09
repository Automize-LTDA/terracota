import React, { useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  Scale, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard({ entradas, saidas, pagarReceber }) {
  
  // Cálculos financeiros
  const metrics = useMemo(() => {
    const totalEntradas = entradas.reduce((sum, item) => sum + parseFloat(item.valor), 0);
    const totalSaidas = saidas.reduce((sum, item) => sum + parseFloat(item.valor), 0);
    
    const totalReceber = pagarReceber
      .filter(item => item.tipo === 'receber' && item.status === 'pendente')
      .reduce((sum, item) => sum + parseFloat(item.valor), 0);
      
    const totalPagar = pagarReceber
      .filter(item => item.tipo === 'pagar' && item.status === 'pendente')
      .reduce((sum, item) => sum + parseFloat(item.valor), 0);

    const saldo = totalEntradas - totalSaidas;
    
    // Lucro Mensal (entradas - saídas do mês atual)
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    const entradasMes = entradas
      .filter(item => item.data.startsWith(anoMesAtual))
      .reduce((sum, item) => sum + parseFloat(item.valor), 0);
      
    const saidasMes = saidas
      .filter(item => item.data.startsWith(anoMesAtual))
      .reduce((sum, item) => sum + parseFloat(item.valor), 0);
      
    const lucroMensal = entradasMes - saidasMes;

    return {
      totalEntradas,
      totalSaidas,
      totalReceber,
      totalPagar,
      saldo,
      lucroMensal
    };
  }, [entradas, saidas, pagarReceber]);

  // Indicadores
  const indicators = useMemo(() => {
    const hojeStr = new Date().toISOString().split('T')[0];
    
    const proximosVencimentos = pagarReceber
      .filter(item => item.status === 'pendente' && item.vencimento >= hojeStr)
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      .slice(0, 5);

    const contasAtrasadas = pagarReceber
      .filter(item => item.status === 'pendente' && item.vencimento < hojeStr)
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

    const recebimentosPrevistos = pagarReceber
      .filter(item => item.tipo === 'receber' && item.status === 'pendente')
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      .slice(0, 5);

    // Últimas movimentações mistas
    const movEntradas = entradas.map(e => ({ ...e, tipoMov: 'entrada' }));
    const movSaidas = saidas.map(s => ({ ...s, tipoMov: 'saida' }));
    const ultimasMovimentacoes = [...movEntradas, ...movSaidas]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 6);

    return {
      proximosVencimentos,
      contasAtrasadas,
      recebimentosPrevistos,
      ultimasMovimentacoes
    };
  }, [entradas, saidas, pagarReceber]);

  // Configuração dos Gráficos
  const chartTheme = {
    terracota: '#A0522D',
    terracotaLight: 'rgba(160, 82, 45, 0.2)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.2)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.2)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.2)',
    gray: '#9CA3AF'
  };

  // 1. Gráfico Entradas x Saídas (Mensal de 2026)
  const lineChartData = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const valoresEntradas = Array(12).fill(0);
    const valoresSaidas = Array(12).fill(0);

    entradas.forEach(item => {
      const mes = new Date(item.data + 'T00:00:00').getMonth();
      valoresEntradas[mes] += parseFloat(item.valor);
    });

    saidas.forEach(item => {
      const mes = new Date(item.data + 'T00:00:00').getMonth();
      valoresSaidas[mes] += parseFloat(item.valor);
    });

    return {
      labels: meses,
      datasets: [
        {
          label: 'Entradas (R$)',
          data: valoresEntradas,
          borderColor: chartTheme.success,
          backgroundColor: chartTheme.successLight,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Saídas (R$)',
          data: valoresSaidas,
          borderColor: chartTheme.danger,
          backgroundColor: chartTheme.dangerLight,
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [entradas, saidas]);

  // 2. Fluxo de Caixa Mensal (Bar Chart)
  const barChartData = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fluxoCaixa = Array(12).fill(0);

    // Lucro por mês = entradas - saídas
    entradas.forEach(item => {
      const mes = new Date(item.data + 'T00:00:00').getMonth();
      fluxoCaixa[mes] += parseFloat(item.valor);
    });
    saidas.forEach(item => {
      const mes = new Date(item.data + 'T00:00:00').getMonth();
      fluxoCaixa[mes] -= parseFloat(item.valor);
    });

    return {
      labels: meses,
      datasets: [
        {
          label: 'Saldo Mensal (R$)',
          data: fluxoCaixa,
          backgroundColor: fluxoCaixa.map(val => val >= 0 ? 'rgba(160, 82, 45, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
          borderRadius: 4
        }
      ]
    };
  }, [entradas, saidas]);

  // 3. Contas Pagas x Pendentes (Doughnut)
  const donutChartData = useMemo(() => {
    const pagas = pagarReceber.filter(i => i.status === 'pago').length;
    const pendentes = pagarReceber.filter(i => i.status === 'pendente').length;

    return {
      labels: ['Pagas', 'Pendentes'],
      datasets: [
        {
          data: [pagas, pendentes],
          backgroundColor: [chartTheme.success, chartTheme.warning],
          borderWidth: 1
        }
      ]
    };
  }, [pagarReceber]);

  // 4. Recebimentos por período (Categoria de Entrada)
  const categoriesChartData = useMemo(() => {
    const categorias = {};
    entradas.forEach(e => {
      categorias[e.categoria] = (categorias[e.categoria] || 0) + parseFloat(e.valor);
    });

    return {
      labels: Object.keys(categorias),
      datasets: [
        {
          label: 'Recebimentos por Categoria (R$)',
          data: Object.values(categorias),
          backgroundColor: [
            '#A0522D', '#E2725B', '#CD7F32', '#D2B48C', '#8B4513'
          ]
        }
      ]
    };
  }, [entradas]);

  const formatBRL = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="dashboard-container animate-fade-in">
      
      {/* Título & Boas vindas */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)' }}>Dashboard Financeiro</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Visão geral do caixa e controle financeiro da Terracota Cerâmica.</p>
      </div>

      {/* Grid de Cards Financeiros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Entradas */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-success)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Entradas</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.totalEntradas)}</h3>
          </div>
          <div style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={22} />
          </div>
        </div>

        {/* Card 2: Saídas */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-danger)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Saídas</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.totalSaidas)}</h3>
          </div>
          <div style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <ArrowDownRight size={22} />
          </div>
        </div>

        {/* Card 3: A Receber */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-info)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>A Receber</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.totalReceber)}</h3>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
        </div>

        {/* Card 4: A Pagar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-warning)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>A Pagar</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.totalPagar)}</h3>
          </div>
          <div style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
        </div>

        {/* Card 5: Saldo Atual */}
        <div className="card" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Saldo Atual</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.saldo)}</h3>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 6: Lucro Mensal */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Lucro Mensal</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '0.25rem' }}>{formatBRL(metrics.lucroMensal)}</h3>
          </div>
          <div style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Seção de Gráficos (Grids de 2 colunas) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }} className="charts-grid">
        
        {/* Gráfico 1: Entradas vs Saídas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Entradas x Saídas (Mensal)</h4>
          <div style={{ height: '260px', position: 'relative' }}>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Gráfico 2: Fluxo de Caixa Mensal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Fluxo de Caixa Mensal (Resultado Líquido)</h4>
          <div style={{ height: '260px', position: 'relative' }}>
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Gráfico 3: Contas Pagas x Pendentes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Status Geral de Contas (Qtd)</h4>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '220px' }}>
              <Doughnut data={donutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Gráfico 4: Recebimentos por período/categoria */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Volume de Recebimento por Categoria</h4>
          <div style={{ height: '260px', position: 'relative' }}>
            <Bar data={categoriesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Seção de Indicadores / Listas Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Contas Atrasadas (Indicadores) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> Contas Atrasadas ({indicators.contasAtrasadas.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {indicators.contasAtrasadas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Nenhuma conta atrasada. Tudo em dia!</p>
            ) : (
              indicators.contasAtrasadas.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-muted)', borderLeft: '3px solid var(--color-danger)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.descricao}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Venceu em: {item.vencimento.split('-').reverse().join('/')}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-danger)' }}>{formatBRL(item.valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos Vencimentos (Pagar) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Próximos Vencimentos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {indicators.proximosVencimentos.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sem contas a pagar nos próximos dias.</p>
            ) : (
              indicators.proximosVencimentos.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', borderLeft: '3px solid var(--color-primary)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.descricao}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vence em: {item.vencimento.split('-').reverse().join('/')}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{formatBRL(item.valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Movimentações (Histórico) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 1' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={18} /> Últimos Lançamentos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {indicators.ultimasMovimentacoes.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Nenhum lançamento efetuado.</p>
            ) : (
              indicators.ultimasMovimentacoes.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.descricao}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.tipoMov === 'entrada' ? `Cliente: ${item.cliente}` : `Fornecedor: ${item.fornecedor}`} • {item.data.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '700', 
                    color: item.tipoMov === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {item.tipoMov === 'entrada' ? '+' : '-'} {formatBRL(item.valor)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
