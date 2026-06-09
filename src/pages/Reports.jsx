import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileDown,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoBase64 from '../assets/logo_base64';

export default function Reports({ 
  clientes = [], 
  movimentacoes = [], 
  entradas = [],
  saidas = [],
  user,
  addToast
}) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Inicia no primeiro dia do mês corrente
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Obter período formatado por extenso
  const periodText = useMemo(() => {
    if (!startDate && !endDate) return 'Todo o período';
    const formatDate = (ds) => {
      if (!ds) return '';
      const [y, m, d] = ds.split('-');
      return `${d}/${m}/${y}`;
    };
    return `${formatDate(startDate)} a ${formatDate(endDate)}`;
  }, [startDate, endDate]);

  // Calcular créditos e débitos de cada cliente no período selecionado
  const spreadsheetData = useMemo(() => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    const rows = clientes.map(c => {
      // Filtrar movimentações financeiras deste cliente no período
      const clientMovs = movimentacoes.filter(m => {
        if (m.cliente_id !== c.id) return false;
        const mDate = new Date(m.data_movimentacao);
        if (start && mDate < start) return false;
        if (end && mDate > end) return false;
        return true;
      });

      const totalCredito = clientMovs
        .filter(m => m.tipo === 'credito')
        .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);

      const totalDebito = clientMovs
        .filter(m => m.tipo === 'debito')
        .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);

      const saldo = totalCredito - totalDebito;

      return {
        id: c.id,
        nome: c.nome,
        cpf_cnpj: c.cpf_cnpj,
        credito: totalCredito,
        debito: totalDebito,
        saldo
      };
    });

    // Totais Gerais
    const totalCreditoGeral = rows.reduce((sum, r) => sum + r.credito, 0);
    const totalDebitoGeral = rows.reduce((sum, r) => sum + r.debito, 0);
    const saldoGeral = totalCreditoGeral - totalDebitoGeral;

    return {
      rows,
      totalCreditoGeral,
      totalDebitoGeral,
      saldoGeral
    };
  }, [clientes, movimentacoes, startDate, endDate]);

  // Formata moeda brasileira
  const formatBRL = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper para desenhar as assinaturas no PDF
  const addSignatureBlock = (doc) => {
    let finalY = 120;
    if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') {
      finalY = doc.lastAutoTable.finalY;
    }
    if (finalY + 45 > 280) {
      doc.addPage();
      finalY = 20;
    }
    
    const sigY = finalY + 25;
    doc.setDrawColor(156, 163, 175);
    doc.line(20, sigY, 90, sigY);
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(user?.nome || user?.usuario || 'Responsável', 55, sigY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Perfil: ${user?.perfil || 'Financeiro'}`, 55, sigY + 9, { align: 'center' });

    doc.line(120, sigY, 190, sigY);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('Diretoria Executiva', 155, sigY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Terracota Cerâmica LTDA', 155, sigY + 9, { align: 'center' });
  };

  // Helper para numerar as páginas no PDF
  const addPageNumbers = (doc) => {
    try {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Terracota Cerâmica LTDA - Painel Financeiro | Página ${i} de ${pageCount}`, 15, 287);
      }
    } catch (e) {
      console.error("Erro ao adicionar numeração de páginas:", e);
    }
  };

  // 1. Exportar Relatório de Clientes
  const exportClientesPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Cabeçalho Premium
      doc.setFillColor(160, 82, 45); // Terracota (#A0522D)
      doc.rect(0, 0, 210, 40, 'F');
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 45, 24);
        } catch(e) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('TERRACOTA CERÂMICA', 15, 25);
        }
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('DEMONSTRATIVO COMERCIAL DE CLIENTES', 70, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`PERÍODO: ${periodText.toUpperCase()}`, 70, 27);

      // Metadata
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terracota Cerâmica LTDA', 15, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('CNPJ: 12.345.678/0001-90', 15, 55);
      doc.text('Demonstrativo de créditos, débitos e saldo comercial por cliente.', 15, 60);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 50);
      doc.text(`Responsável: ${user?.nome || user?.usuario || 'N/A'} (${user?.perfil || 'Financeiro'})`, 140, 55);

      // KPI Summary Cards
      // Card 1: Créditos
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(15, 68, 55, 18, 2, 2, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(15, 68, 55, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('TOTAL CRÉDITOS (+)', 20, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(formatBRL(spreadsheetData.totalCreditoGeral), 20, 81);

      // Card 2: Débitos
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(77, 68, 55, 18, 2, 2, 'F');
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(77, 68, 55, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('TOTAL DÉBITOS (-)', 82, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text(formatBRL(spreadsheetData.totalDebitoGeral), 82, 81);

      // Card 3: Saldo Geral
      const isPositive = spreadsheetData.saldoGeral >= 0;
      doc.setFillColor(isPositive ? 236 : 254, isPositive ? 253 : 242, isPositive ? 245 : 242);
      doc.roundedRect(140, 68, 55, 18, 2, 2, 'F');
      doc.setDrawColor(isPositive ? 16 : 239, isPositive ? 185 : 68, isPositive ? 129 : 68);
      doc.roundedRect(140, 68, 55, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('SALDO COMERCIAL GERAL', 145, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(isPositive ? 16 : 239, isPositive ? 185 : 68, isPositive ? 129 : 68);
      doc.text(formatBRL(spreadsheetData.saldoGeral), 145, 81);

      // Tabela de Dados
      const tableHeaders = [
        ['Cliente', 'CPF/CNPJ', 'Créditos (+)', 'Débitos (-)', 'Saldo Comercial']
      ];

      const tableRows = spreadsheetData.rows.map(r => [
        r.nome,
        r.cpf_cnpj,
        formatBRL(r.credito),
        formatBRL(r.debito),
        formatBRL(r.saldo)
      ]);

      // Linha de totalizadores
      tableRows.push([
        'TOTAIS GERAIS DO PERÍODO',
        '',
        formatBRL(spreadsheetData.totalCreditoGeral),
        formatBRL(spreadsheetData.totalDebitoGeral),
        formatBRL(spreadsheetData.saldoGeral)
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 93,
        theme: 'striped',
        headStyles: { fillColor: [160, 82, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [251, 246, 243] },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 230, 224];
            if (data.column.index === 0) data.cell.styles.textColor = [160, 82, 45];
            if (data.column.index === 2) data.cell.styles.textColor = [16, 185, 129];
            if (data.column.index === 3) data.cell.styles.textColor = [239, 68, 68];
            if (data.column.index === 4) {
              const isPos = spreadsheetData.saldoGeral >= 0;
              data.cell.styles.textColor = isPos ? [16, 185, 129] : [239, 68, 68];
            }
          }
        }
      });

      addSignatureBlock(doc);
      addPageNumbers(doc);

      doc.save(`relatorio_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Relatório de Clientes gerado e baixado!', 'success');
    } catch (error) {
      console.error(error);
      addToast(`Erro ao exportar PDF de clientes: ${error.message || error}`, 'error');
    }
  };

  // 2. Exportar Relatório de Entradas
  const exportEntradasPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Filtrar entradas por período
      const filteredEntradas = (entradas || []).filter(item => {
        if (!item.data) return false;
        let dateStr = '';
        if (typeof item.data === 'string') {
          dateStr = item.data;
        } else {
          try {
            dateStr = new Date(item.data).toISOString();
          } catch (e) {
            return false;
          }
        }
        const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      const totalValue = filteredEntradas.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);

      // Cabeçalho Premium
      doc.setFillColor(160, 82, 45); // Terracota
      doc.rect(0, 0, 210, 40, 'F');
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 45, 24);
        } catch(e) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('TERRACOTA CERÂMICA', 15, 25);
        }
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DETALHADO DE ENTRADAS', 70, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`PERÍODO: ${periodText.toUpperCase()}`, 70, 27);

      // Metadata
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terracota Cerâmica LTDA', 15, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('CNPJ: 12.345.678/0001-90', 15, 55);
      doc.text('Detalhamento de faturamento e entradas no caixa.', 15, 60);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 50);
      doc.text(`Responsável: ${user?.nome || user?.usuario || 'N/A'} (${user?.perfil || 'Financeiro'})`, 140, 55);

      // KPI Cards
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, 68, 85, 18, 2, 2, 'F');
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(15, 68, 85, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('LANÇAMENTOS NO PERÍODO', 20, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`${filteredEntradas.length} registros`, 20, 81);

      doc.setFillColor(236, 253, 245);
      doc.roundedRect(110, 68, 85, 18, 2, 2, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(110, 68, 85, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('TOTAL FATURADO', 115, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(formatBRL(totalValue), 115, 81);

      // Tabela de Lançamentos
      const tableHeaders = [
        ['Data', 'Descrição', 'Cliente', 'Categoria', 'Forma Pag.', 'Valor']
      ];

      const getSafeDateStr = (dateVal) => {
        if (!dateVal) return 'N/A';
        const cleanDate = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
        if (!cleanDate.includes('-')) return cleanDate;
        return cleanDate.split('-').reverse().join('/');
      };

      const tableRows = filteredEntradas.map(item => [
        getSafeDateStr(item.data),
        item.descricao || 'Sem descrição',
        item.cliente || 'Sem cliente',
        item.categoria || 'Outros',
        item.forma_pagamento || 'Pix',
        formatBRL(parseFloat(item.valor || 0))
      ]);

      tableRows.push([
        'TOTAL GERAL DE ENTRADAS',
        '',
        '',
        '',
        '',
        formatBRL(totalValue)
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 93,
        theme: 'striped',
        headStyles: { fillColor: [160, 82, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3.5 },
        columnStyles: {
          5: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [251, 246, 243] },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 230, 224];
            if (data.column.index === 0) data.cell.styles.textColor = [160, 82, 45];
            if (data.column.index === 5) data.cell.styles.textColor = [16, 185, 129];
          }
        }
      });

      addSignatureBlock(doc);
      addPageNumbers(doc);

      doc.save(`relatorio_entradas_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Relatório de Entradas exportado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      addToast(`Erro ao exportar PDF de entradas: ${error.message || error}`, 'error');
    }
  };

  // 3. Exportar Relatório de Saídas
  const exportSaidasPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Filtrar saídas por período
      const filteredSaidas = (saidas || []).filter(item => {
        if (!item.data) return false;
        let dateStr = '';
        if (typeof item.data === 'string') {
          dateStr = item.data;
        } else {
          try {
            dateStr = new Date(item.data).toISOString();
          } catch (e) {
            return false;
          }
        }
        const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      const totalValue = filteredSaidas.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);

      // Cabeçalho Premium
      doc.setFillColor(160, 82, 45); // Terracota
      doc.rect(0, 0, 210, 40, 'F');
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 15, 8, 45, 24);
        } catch(e) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('TERRACOTA CERÂMICA', 15, 25);
        }
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DETALHADO DE SAÍDAS', 70, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`PERÍODO: ${periodText.toUpperCase()}`, 70, 27);

      // Metadata
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terracota Cerâmica LTDA', 15, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('CNPJ: 12.345.678/0001-90', 15, 55);
      doc.text('Detalhamento de custos, insumos e despesas.', 15, 60);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 50);
      doc.text(`Responsável: ${user?.nome || user?.usuario || 'N/A'} (${user?.perfil || 'Financeiro'})`, 140, 55);

      // KPI Cards
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, 68, 85, 18, 2, 2, 'F');
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(15, 68, 85, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('LANÇAMENTOS NO PERÍODO', 20, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`${filteredSaidas.length} registros`, 20, 81);

      doc.setFillColor(254, 242, 242);
      doc.roundedRect(110, 68, 85, 18, 2, 2, 'F');
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(110, 68, 85, 18, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('TOTAL DESPENDIDO', 115, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text(formatBRL(totalValue), 115, 81);

      // Tabela de Saídas
      const tableHeaders = [
        ['Data', 'Descrição', 'Fornecedor', 'Categoria', 'Forma Pag.', 'Valor']
      ];

      const getSafeDateStr = (dateVal) => {
        if (!dateVal) return 'N/A';
        const cleanDate = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
        if (!cleanDate.includes('-')) return cleanDate;
        return cleanDate.split('-').reverse().join('/');
      };

      const tableRows = filteredSaidas.map(item => [
        getSafeDateStr(item.data),
        item.descricao || 'Sem descrição',
        item.fornecedor || 'Sem fornecedor',
        item.categoria || 'Outros',
        item.forma_pagamento || 'Pix',
        formatBRL(parseFloat(item.valor || 0))
      ]);

      tableRows.push([
        'TOTAL GERAL DE SAÍDAS',
        '',
        '',
        '',
        '',
        formatBRL(totalValue)
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 93,
        theme: 'striped',
        headStyles: { fillColor: [160, 82, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3.5 },
        columnStyles: {
          5: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [251, 246, 243] },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 230, 224];
            if (data.column.index === 0) data.cell.styles.textColor = [160, 82, 45];
            if (data.column.index === 5) data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });

      addSignatureBlock(doc);
      addPageNumbers(doc);

      doc.save(`relatorio_saidas_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Relatório de Saídas exportado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      addToast(`Erro ao exportar PDF de saídas: ${error.message || error}`, 'error');
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '260px', transition: 'var(--transition-smooth)' }} className="reports-container animate-fade-in">
      
      {/* Título da Central de Relatórios */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet /> Central de Relatórios
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Consulte demonstrativos financeiros em tempo real e exporte relatórios estilizados em formato PDF.
        </p>
      </div>

      {/* 1. Painel de Filtro de Período (Aplica-se a todos os relatórios) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Calendar size={18} /> Filtrar Período de Exportação
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Selecione o intervalo de datas para delimitar as informações financeiras que serão incluídas nos PDFs.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-main)' }}>Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.85rem', minWidth: '160px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-main)' }}>Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.85rem', minWidth: '160px' }}
            />
          </div>

          <div style={{ alignSelf: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-primary-light)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-muted)' }}>
            Período atual selecionado: <strong>{periodText}</strong>
          </div>
        </div>
      </div>

      {/* 2. Grid de Cards para Exportações de PDFs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-main)', margin: '0.5rem 0 0 0' }}>
          Exportações de Relatórios PDF
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          
          {/* Card 1: Relatório de Clientes */}
          <div className="card shadow-sm hover-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--color-primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Relatório de Clientes</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Demonstrativo contendo créditos, débitos e o saldo comercial líquido final de cada cliente ativo no sistema.
                </p>
              </div>
            </div>
            <button onClick={exportClientesPDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
              <FileDown size={16} /> Exportar Clientes PDF
            </button>
          </div>

          {/* Card 2: Relatório de Entradas */}
          <div className="card shadow-sm hover-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: '4px solid var(--color-success)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: '#ECFDF5', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                <ArrowUpRight size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Relatório de Entradas</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Listagem completa de receitas, vendas e faturamento detalhados por categoria, data e forma de pagamento.
                </p>
              </div>
            </div>
            <button onClick={exportEntradasPDF} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', color: 'white' }}>
              <FileDown size={16} /> Exportar Entradas PDF
            </button>
          </div>

          {/* Card 3: Relatório de Saídas */}
          <div className="card shadow-sm hover-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: '4px solid var(--color-danger)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: '#FEF2F2', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
                <ArrowDownRight size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Relatório de Saídas</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Histórico de despesas, insumos, compras de matérias-primas, impostos e custos operacionais pagos.
                </p>
              </div>
            </div>
            <button onClick={exportSaidasPDF} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', color: 'white' }}>
              <FileDown size={16} /> Exportar Saídas PDF
            </button>
          </div>

        </div>
      </div>

      {/* 3. Tabela de Clientes - Pré-visualização na tela */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileSpreadsheet size={20} /> Planilha Comercial de Clientes
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            Visualização dinâmica de créditos, débitos e saldo final com base no período de <strong>{periodText}</strong>.
          </p>
        </div>

        {/* Pré-visualização da Planilha na Tela */}
        <div className="table-container">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CPF/CNPJ</th>
                <th style={{ textAlign: 'right' }}>Créditos (+)</th>
                <th style={{ textAlign: 'right' }}>Débitos (-)</th>
                <th style={{ textAlign: 'right' }}>Saldo Comercial</th>
              </tr>
            </thead>
            <tbody>
              {spreadsheetData.rows.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                    Nenhum cliente cadastrado no sistema.
                  </td>
                </tr>
              ) : (
                spreadsheetData.rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600' }}>{r.nome}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{r.cpf_cnpj}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: '500' }}>
                      {formatBRL(r.credito)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: '500' }}>
                      {formatBRL(r.debito)}
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: '700', 
                      color: r.saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {formatBRL(r.saldo)}
                    </td>
                  </tr>
                ))
              )}
              <tr style={{ background: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                <td colSpan="2" style={{ color: 'var(--color-primary)' }}>TOTAIS GERAIS DO PERÍODO</td>
                <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                  {formatBRL(spreadsheetData.totalCreditoGeral)}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                  {formatBRL(spreadsheetData.totalDebitoGeral)}
                </td>
                <td style={{ 
                  textAlign: 'right', 
                  color: spreadsheetData.saldoGeral >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {formatBRL(spreadsheetData.saldoGeral)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .hover-up {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-up:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .reports-container {
            margin-left: 0 !important;
            padding: 1.5rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
