import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, X, Shield, CheckCircle2, AlertTriangle, FileText, TrendingUp, Award, Clock } from 'lucide-react';

export default function ModalDossieOna({ indicador, onClose }) {
  const [loading, setLoading] = useState(true);
  const [dossie, setDossie] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!indicador?.id) return;
    const fetchDossie = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/ona/dossie/${indicador.id}`);
        setDossie(res.data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o dossiê consolidado do indicador.');
      } finally {
        setLoading(false);
      }
    };
    fetchDossie();
  }, [indicador?.id]);

  const imprimirDossie = () => {
    window.print();
  };

  const ind = dossie?.indicador || indicador;
  const metas = ind?.metas || [];
  const planos = ind?.planosAcao || [];
  const dados = dossie?.dadosHistoricos || [];
  const incidentes = ind?.incidentes || [];
  const stats = dossie?.estatisticas || {};

  const getTipoOnaLabel = (tipo) => {
    switch (tipo) {
      case 'ESTRUTURA': return 'Estrutura (Instalações, Insumos, Recursos)';
      case 'PROCESSO': return 'Processo (Atividades Assistenciais e Adesão)';
      case 'RESULTADO': return 'Resultado (Desfechos Clínicos e Eficácia)';
      default: return tipo || 'Processo';
    }
  };

  const getDimensaoLabel = (dim) => {
    switch (dim) {
      case 'SEGURANCA': return 'Segurança do Paciente';
      case 'EFETIVIDADE': return 'Efetividade Clínica';
      case 'EFICIENCIA': return 'Eficiência & Otimização de Recursos';
      case 'CENTRADO_NO_PACIENTE': return 'Centrado no Paciente / Humanização';
      case 'OPORTUNIDADE': return 'Oportunidade (Redução de Atrasos)';
      case 'EQUIDADE': return 'Equidade no Atendimento';
      default: return dim || 'Geral';
    }
  };

  const getProtocoloLabel = (prot) => {
    switch (prot) {
      case 'HIGIENE_MAOS': return 'Meta 5: Higiene das Mãos (Prevenção de IRAS)';
      case 'IDENTIFICACAO': return 'Meta 1: Identificação Correta do Paciente';
      case 'MEDICACAO': return 'Meta 3: Segurança na Prescrição e Administração de Medicamentos';
      case 'CIRURGIA_SEGURA': return 'Meta 4: Cirurgia Segura (Time-Out)';
      case 'QUEDAS': return 'Meta 6A: Prevenção de Quedas';
      case 'LESAO_PRESSAO': return 'Meta 6B: Prevenção de Lesões por Pressão (LPP)';
      case 'OUTRO': return 'Outro Protocolo Institucional';
      default: return 'Não Aplicável / Indicador de Gestão Geral';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ona-print-container, .ona-print-container * {
            visibility: visible !important;
          }
          .ona-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }
          .ona-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="ona-print-container" style={{
        background: '#ffffff',
        color: '#1e293b',
        width: '100%',
        maxWidth: '1020px',
        maxHeight: '92vh',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Barra Superior / Ações */}
        <div className="ona-no-print" style={{
          padding: '14px 24px',
          background: '#0f172a',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="#38bdf8" />
            <span style={{ fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>
              DOSSIÊ DO INDICADOR — ACREDITAÇÃO ONA
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={imprimirDossie}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem'
              }}
            >
              <Printer size={16} /> Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Dossiê */}
        <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1, fontSize: '0.88rem', lineHeight: '1.45' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              Carregando dados completos do Dossiê ONA...
            </div>
          ) : error ? (
            <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
              {error}
            </div>
          ) : (
            <div>
              {/* Cabeçalho Institucional Oficial */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #0f172a',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src="/logo.png"
                    alt="Logo Hospital"
                    style={{ maxHeight: '55px', width: 'auto', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>
                      SISTEMA DE GESTÃO DA QUALIDADE (SGQ)
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                      Dossiê Técnico de Indicador para Auditoria de Conformidade ONA
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                  <div><strong>Versão Ficha:</strong> Rev. {ind.versao_ficha || 1}</div>
                  <div><strong>Data Revisão:</strong> {ind.revisao_data ? new Date(ind.revisao_data).toLocaleDateString('pt-BR') : '-'}</div>
                  <div><strong>Emitido em:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {/* Título do Indicador e Setor */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                      {ind.setor?.nome || 'Setor Geral / Institucional'}
                    </span>
                    <h1 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', color: '#0f172a' }}>
                      {ind.codigo ? `[${ind.codigo}] ` : ''}{ind.nome}
                    </h1>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: ind.tipo_ona === 'RESULTADO' ? '#dbeafe' : ind.tipo_ona === 'ESTRUTURA' ? '#fef3c7' : '#e0e7ff',
                      color: ind.tipo_ona === 'RESULTADO' ? '#1e40af' : ind.tipo_ona === 'ESTRUTURA' ? '#92400e' : '#3730a3'
                    }}>
                      ONA: {ind.tipo_ona || 'PROCESSO'}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1'
                    }}>
                      {getDimensaoLabel(ind.dimensao_qualidade)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumo Estatístico Executivo */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Medições Coletadas</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalMedicoes || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Planos Registrados</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalPlanos || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Planos Concluídos</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{stats.planosConcluidos || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Eficácia PDCA</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{stats.taxaEficaciaPDCA || '100%'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Média Matriz GUT</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>{stats.mediaGutPrioridade || '-'}</div>
                </div>
              </div>

              {/* SEÇÃO 1: Ficha Técnica Detalhada */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                  marginBottom: '10px'
                }}>
                  1. Ficha Técnica do Indicador (Requisitos ONA)
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', width: '25%', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Classificação ONA:</td>
                      <td style={{ padding: '8px 10px', width: '75%' }}>{getTipoOnaLabel(ind.tipo_ona)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Dimensão da Qualidade:</td>
                      <td style={{ padding: '8px 10px' }}>{getDimensaoLabel(ind.dimensao_qualidade)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Protocolo de Segurança:</td>
                      <td style={{ padding: '8px 10px' }}>{getProtocoloLabel(ind.protocolo_seguranca)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Objetivo / Descrição:</td>
                      <td style={{ padding: '8px 10px' }}>{ind.descricao || 'Sem descrição cadastrada'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Fórmula de Cálculo:</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#0369a1' }}>{ind.desc_formula || '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Fonte dos Dados:</td>
                      <td style={{ padding: '8px 10px' }}>{ind.fonte_referencia || 'Sistema Hospitalar SPDATA'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Unidade de Medida / Polaridade:</td>
                      <td style={{ padding: '8px 10px' }}>
                        {ind.unidade_medida || 'Unidade'} • Orientação: <strong>{ind.orientacao || 'Maior Melhor'}</strong> • Frequência: {ind.frequencia || 'Mensal'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', background: '#f8fafc', color: '#334155' }}>Margem de Tolerância Amarela:</td>
                      <td style={{ padding: '8px 10px' }}>± {ind.tolerancia ?? 5}% em relação à meta alvo</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SEÇÃO 2: Metas e Benchmarking Externo */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                  marginBottom: '10px'
                }}>
                  2. Metas Definidas & Referencial de Mercado (Benchmarking ONA Nível 3)
                </h3>
                {metas.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>Nenhuma meta formal cadastrada.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '8px 10px' }}>Descrição da Meta</th>
                        <th style={{ padding: '8px 10px' }}>Competência</th>
                        <th style={{ padding: '8px 10px', color: '#dc2626' }}>Meta Alvo</th>
                        <th style={{ padding: '8px 10px', color: '#7c3aed' }}>Benchmarking (Mercado)</th>
                        <th style={{ padding: '8px 10px' }}>Fonte do Benchmark</th>
                        <th style={{ padding: '8px 10px' }}>Data Limite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metas.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 10px' }}><strong>{m.descricao}</strong></td>
                          <td style={{ padding: '8px 10px' }}>{m.competencia || 'Geral'}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#dc2626' }}>
                            {m.valor_alvo} {ind.unidade_medida || ''}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#7c3aed' }}>
                            {m.benchmarking !== null && m.benchmarking !== undefined ? `${m.benchmarking} ${ind.unidade_medida || ''}` : '-'}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.benchmarking_fonte || '-'}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {m.data_limite ? new Date(m.data_limite).toLocaleDateString('pt-BR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SEÇÃO 3: Histórico de Dados de Medição */}
              {dados && dados.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '6px',
                    marginBottom: '10px'
                  }}>
                    3. Últimas Medições Coletadas
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '6px 10px' }}>Período / Referência</th>
                          <th style={{ padding: '6px 10px' }}>Resultado Obtido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.slice(-8).map((row, idx) => {
                          const xVal = row[ind.coluna_x] || Object.values(row)[0];
                          const yVal = row[ind.coluna_y] || Object.values(row)[1];
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 10px' }}>{String(xVal)}</td>
                              <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#0369a1' }}>
                                {String(yVal)} {ind.unidade_medida || ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SEÇÃO 4: Planos de Ação 5W2H, Análise Causa Raiz e Matriz GUT */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                  marginBottom: '10px'
                }}>
                  4. Análise de Causa Raiz, Matriz GUT e Planos de Ação 5W2H (SGQ / ONA)
                </h3>

                {planos.length === 0 ? (
                  <div style={{ color: '#16a34a', padding: '10px 0', fontWeight: 600 }}>
                    ✅ Nenhuma não-conformidade ou plano de ação pendente registrado para este indicador.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {planos.map((p, idx) => {
                      let ishikawa6m = null;
                      try { if (p.ishikawa_6m) ishikawa6m = JSON.parse(p.ishikawa_6m); } catch (e) {}
                      let porques = null;
                      try { if (p.cinco_porques) porques = JSON.parse(p.cinco_porques); } catch (e) {}

                      return (
                        <div key={idx} style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '14px',
                          background: '#fff'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <strong>Competência: {p.competencia || 'Geral'}</strong>
                              {p.valor_obtido !== null && (
                                <span style={{ marginLeft: '10px', color: '#dc2626', fontWeight: 'bold' }}>
                                  Resultado: {p.valor_obtido} (Meta: {p.meta_esperada ?? '-'})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #c4b5fd'
                              }}>
                                GUT: {p.score_gut || 27} (G:{p.nota_g || 3} • U:{p.nota_u || 3} • T:{p.nota_t || 3})
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: p.status === 'CONCLUIDO' ? '#dcfce7' : '#fef3c7',
                                color: p.status === 'CONCLUIDO' ? '#15803d' : '#b45309'
                              }}>
                                {p.status}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: p.eficacia === 'EFICAZ' ? '#dcfce7' : p.eficacia === 'INEFICAZ' ? '#fee2e2' : '#f1f5f9',
                                color: p.eficacia === 'EFICAZ' ? '#15803d' : p.eficacia === 'INEFICAZ' ? '#b91c1c' : '#64748b'
                              }}>
                                Eficácia: {p.eficacia || 'PENDENTE'}
                              </span>
                            </div>
                          </div>

                          <div style={{ marginBottom: '8px', color: '#334155' }}>
                            <strong>Análise Crítica / Causa Raiz:</strong> {p.justificativa}
                          </div>

                          {/* Se houver Ishikawa 6M preenchido */}
                          {ishikawa6m && Object.values(ishikawa6m).some(v => v) && (
                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '0.78rem' }}>
                              <strong style={{ color: '#0369a1' }}>Espinha de Peixe (Ishikawa 6M):</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                {ishikawa6m.metodo && <div>• <strong>Método:</strong> {ishikawa6m.metodo}</div>}
                                {ishikawa6m.mao_de_obra && <div>• <strong>Mão de Obra:</strong> {ishikawa6m.mao_de_obra}</div>}
                                {ishikawa6m.material && <div>• <strong>Material:</strong> {ishikawa6m.material}</div>}
                                {ishikawa6m.maquina && <div>• <strong>Máquina:</strong> {ishikawa6m.maquina}</div>}
                                {ishikawa6m.meio_ambiente && <div>• <strong>Meio Ambiente:</strong> {ishikawa6m.meio_ambiente}</div>}
                                {ishikawa6m.medida && <div>• <strong>Medida:</strong> {ishikawa6m.medida}</div>}
                              </div>
                            </div>
                          )}

                          {/* Se houver 5 Porquês preenchido */}
                          {porques && Array.isArray(porques) && porques.some(v => v) && (
                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '0.78rem' }}>
                              <strong style={{ color: '#0369a1' }}>Análise dos 5 Porquês:</strong>
                              <div style={{ marginTop: '4px' }}>
                                {porques.map((pq, i) => pq ? <div key={i}>• Por quê {i+1}: {pq}</div> : null)}
                              </div>
                            </div>
                          )}

                          {/* Padrão 5W2H */}
                          <div style={{
                            background: '#f1f5f9',
                            padding: '10px',
                            borderRadius: '6px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '8px',
                            fontSize: '0.78rem'
                          }}>
                            <div><strong>What (O quê):</strong> {p.what_acao || p.plano_acao}</div>
                            <div><strong>Why (Por quê):</strong> {p.why_motivo || p.justificativa}</div>
                            <div><strong>Where (Onde):</strong> {p.where_local || ind.setor?.nome || 'Geral'}</div>
                            <div><strong>Who (Quem):</strong> {p.who_responsavel || p.responsavel || '-'}</div>
                            <div><strong>When (Quando):</strong> {p.when_prazo || p.prazo || '-'}</div>
                            <div><strong>How (Como):</strong> {p.how_metodo || 'Procedimento Operacional Padrão'}</div>
                            <div><strong>How Much (Quanto):</strong> {p.how_much_custo || 'Recursos Internos'}</div>
                          </div>

                          {p.evidencia_eficacia && (
                            <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#15803d' }}>
                              <strong>Evidência de Eficácia do PDCA:</strong> {p.evidencia_eficacia}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEÇÃO 5: Parecer Conclusivo & Assinaturas Formais */}
              <div style={{
                marginTop: '36px',
                borderTop: '2px solid #0f172a',
                paddingTop: '20px',
                pageBreakInside: 'avoid'
              }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '30px', color: '#475569' }}>
                  <strong>PARECER CONFERIDO PELA COMISSÃO DA QUALIDADE:</strong> As medições, limites de tolerância,
                  análises críticas de não conformidades e planos de ação 5W2H foram devidamente avaliados e cumprem
                  as diretrizes do Manual de Acreditação ONA e das Metas de Segurança do Paciente.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid #334155', height: '35px' }}></div>
                    <div style={{ fontWeight: 'bold', marginTop: '6px', fontSize: '0.85rem' }}>
                      Responsável / Gestor do Setor
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ind.setor?.nome || 'Setor'}</div>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #334155', height: '35px' }}></div>
                    <div style={{ fontWeight: 'bold', marginTop: '6px', fontSize: '0.85rem' }}>
                      Núcleo de Segurança do Paciente / Gestão da Qualidade
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Comitê da Qualidade Hospitalar (ONA)</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
