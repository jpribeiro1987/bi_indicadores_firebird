import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileCheck2, Plus, Search, Trash2, Edit2, Download, CheckCircle2,
  Users, Calendar, Eye, Printer, Award
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function FechamentoCiclo({ userRole, userSectors = [] }) {
  const [fechamentos, setFechamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('ALL');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFechamento, setEditingFechamento] = useState(null);
  const [viewingFechamento, setViewingFechamento] = useState(null);

  const initialForm = {
    competencia: '',
    setorId: '',
    data_reuniao: new Date().toISOString().substring(0, 10),
    participantes: '',
    pontos_fortes: '',
    oportunidades_melhoria: '',
    decisoes_comite: '',
    status: 'FECHADO',
    responsavel_ata: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [fechRes, setRes] = await Promise.all([
        axios.get('/api/ona/fechamentos'),
        axios.get('/api/setores')
      ]);
      setFechamentos(fechRes.data || []);
      setSetores(setRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const abrirNovo = () => {
    setEditingFechamento(null);
    setFormData({ ...initialForm });
    setIsModalOpen(true);
  };

  const abrirEdicao = (f) => {
    setEditingFechamento(f);
    setFormData({
      ...f,
      setorId: f.setorId || '',
      data_reuniao: f.data_reuniao ? f.data_reuniao.substring(0, 10) : new Date().toISOString().substring(0, 10),
      participantes: f.participantes || '',
      pontos_fortes: f.pontos_fortes || '',
      oportunidades_melhoria: f.oportunidades_melhoria || '',
      decisoes_comite: f.decisoes_comite || '',
      responsavel_ata: f.responsavel_ata || ''
    });
    setIsModalOpen(true);
  };

  const salvarFechamento = async () => {
    if (!formData.competencia || !formData.data_reuniao) {
      return alert('Preencha a competência e a data da reunião.');
    }
    try {
      if (editingFechamento) {
        const res = await axios.put(`/api/ona/fechamentos/${editingFechamento.id}`, formData);
        setFechamentos(prev => prev.map(f => f.id === editingFechamento.id ? res.data : f));
      } else {
        const res = await axios.post('/api/ona/fechamentos', formData);
        setFechamentos(prev => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (e) {
      alert('Erro ao salvar fechamento de ciclo: ' + (e.response?.data?.error || e.message));
    }
  };

  const excluirFechamento = async (id) => {
    if (!window.confirm('Deseja realmente excluir este registro de fechamento de ciclo?')) return;
    try {
      await axios.delete(`/api/ona/fechamentos/${id}`);
      setFechamentos(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      alert('Erro ao excluir fechamento.');
    }
  };

  const fechamentosPermitidos = fechamentos.filter(f => {
    return userRole === 'ADMIN' || userRole === 'LEITURA' || !f.setorId || userSectors.includes(f.setorId);
  });

  const fechamentosFiltrados = fechamentosPermitidos.filter(f => {
    if (filtroSetor !== 'ALL' && String(f.setorId) !== String(filtroSetor)) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      const match =
        (f.competencia || '').toLowerCase().includes(termo) ||
        (f.setor?.nome || '').toLowerCase().includes(termo) ||
        (f.decisoes_comite || '').toLowerCase().includes(termo) ||
        (f.participantes || '').toLowerCase().includes(termo);
      if (!match) return false;
    }
    return true;
  });

  const exportarXls = () => {
    if (fechamentosFiltrados.length === 0) return alert('Nenhum fechamento para exportar.');
    const rows = fechamentosFiltrados.map(f => ({
      COMPETENCIA: f.competencia,
      SETOR: f.setor?.nome || 'Institucional Geral',
      DATA_REUNIAO: new Date(f.data_reuniao).toLocaleDateString('pt-BR'),
      PARTICIPANTES: f.participantes || '-',
      PONTOS_FORTES: f.pontos_fortes || '-',
      OPORTUNIDADES_MELHORIA: f.oportunidades_melhoria || '-',
      DECISOES_COMITE: f.decisoes_comite || '-',
      RESPONSAVEL_ATA: f.responsavel_ata || '-',
      STATUS: f.status
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fechamentos_Ciclo_ONA');
    XLSX.writeFile(wb, 'Analises_Criticas_Fechamentos_Ciclo_ONA.xls', { bookType: 'biff8' });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Topo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileCheck2 size={30} color="#059669" />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>
              Análise Crítica & Fechamento de Ciclo (ONA)
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Reuniões periódicas do Comitê de Qualidade, avaliação de metas, atas formais e deliberações
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {userRole !== 'LEITURA' && (
            <button
              onClick={abrirNovo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Plus size={16} /> Nova Análise Crítica / Fechamento
            </button>
          )}
          <button
            onClick={exportarXls}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Download size={16} /> Exportar XLS
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'var(--panel-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por competência, setor, decisões ou participantes..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', width: '100%' }}
          />
        </div>

        <select value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="ALL">Todos os Setores</option>
          {setores.filter(s => userRole === 'ADMIN' || userRole === 'LEITURA' || userSectors.includes(s.id)).map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>

      {/* Tabela de Fechamentos de Ciclo */}
      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Carregando fechamentos de ciclo...</div>
        ) : fechamentosFiltrados.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum fechamento de ciclo registrado.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Competência</th>
                <th style={{ padding: '12px' }}>Setor / Abrangência</th>
                <th style={{ padding: '12px' }}>Data da Reunião</th>
                <th style={{ padding: '12px' }}>Participantes / Comitê</th>
                <th style={{ padding: '12px' }}>Deliberações & Decisões</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fechamentosFiltrados.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {f.competencia}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                    <strong>{f.setor?.nome || 'Institucional / Geral'}</strong>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                    {new Date(f.data_reuniao).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.participantes || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '280px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {f.decisoes_comite || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: f.status === 'APROVADO_DIRETORIA' ? '#dcfce7' : '#e0f2fe',
                      color: f.status === 'APROVADO_DIRETORIA' ? '#15803d' : '#0369a1'
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setViewingFechamento(f)}
                      style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '6px' }}
                      title="Ver Ata Completa"
                    >
                      <Eye size={16} />
                    </button>
                    {userRole !== 'LEITURA' && (
                      <>
                        <button
                          onClick={() => abrirEdicao(f)}
                          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '6px' }}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => excluirFechamento(f.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '740px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', background: '#059669', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={20} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {editingFechamento ? 'Editar Reunião de Análise Crítica' : 'Nova Reunião de Análise Crítica / Fechamento de Ciclo'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Competência / Ciclo *</label>
                  <input
                    placeholder="Ex: 10/2026 ou 3T/2026"
                    value={formData.competencia}
                    onChange={e => setFormData({ ...formData, competencia: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Data da Reunião *</label>
                  <input
                    type="date"
                    value={formData.data_reuniao}
                    onChange={e => setFormData({ ...formData, data_reuniao: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Setor / Abrangência</label>
                  <select
                    value={formData.setorId}
                    onChange={e => setFormData({ ...formData, setorId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Geral / Institucional</option>
                    {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Participantes / Membros Presentes</label>
                <input
                  placeholder="Ex: Dr. Fulano (Diretor), Beltrano (Coord. Qualidade), Ciclano (Enfermeiro Chefe)..."
                  value={formData.participantes}
                  onChange={e => setFormData({ ...formData, participantes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a' }}>Pontos Fortes Identificados no Ciclo</label>
                <textarea
                  rows={2}
                  placeholder="Destaques positivos, processos estabilizados, metas superadas..."
                  value={formData.pontos_fortes}
                  onChange={e => setFormData({ ...formData, pontos_fortes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc2626' }}>Oportunidades de Melhoria (Gaps)</label>
                <textarea
                  rows={2}
                  placeholder="Desvios de metas, barreiras identificadas, riscos potenciais..."
                  value={formData.oportunidades_melhoria}
                  onChange={e => setFormData({ ...formData, oportunidades_melhoria: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0369a1' }}>Decisões e Deliberações do Comitê de Qualidade *</label>
                <textarea
                  rows={3}
                  placeholder="Ações estratégicas acordadas, alocação de recursos, revisão de metas..."
                  value={formData.decisoes_comite}
                  onChange={e => setFormData({ ...formData, decisoes_comite: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Status do Fechamento</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="FECHADO">FECHADO (Consolidado)</option>
                    <option value="APROVADO_DIRETORIA">APROVADO PELA DIRETORIA</option>
                    <option value="ABERTO">EM ANDAMENTO</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Responsável pela Redação da Ata</label>
                  <input
                    value={formData.responsavel_ata}
                    onChange={e => setFormData({ ...formData, responsavel_ata: e.target.value })}
                    placeholder="Nome do redator / coordenador"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarFechamento}
                style={{ padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Salvar Ata do Ciclo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO COMPLETA DA ATA */}
      {viewingFechamento && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                Ata de Análise Crítica — Competência {viewingFechamento.competencia}
              </h3>
              <button onClick={() => setViewingFechamento(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Setor:</strong> {viewingFechamento.setor?.nome || 'Institucional Geral'}
                </div>
                <div style={{ color: '#64748b' }}>
                  Data: {new Date(viewingFechamento.data_reuniao).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {viewingFechamento.participantes && (
                <div>
                  <strong>Participantes:</strong> {viewingFechamento.participantes}
                </div>
              )}

              {viewingFechamento.pontos_fortes && (
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534' }}>
                  <strong>Pontos Fortes do Ciclo:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingFechamento.pontos_fortes}</p>
                </div>
              )}

              {viewingFechamento.oportunidades_melhoria && (
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b' }}>
                  <strong>Oportunidades de Melhoria:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingFechamento.oportunidades_melhoria}</p>
                </div>
              )}

              {viewingFechamento.decisoes_comite && (
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1' }}>
                  <strong>Decisões e Deliberações do Comitê:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingFechamento.decisoes_comite}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                Status: {viewingFechamento.status} • Redator: {viewingFechamento.responsavel_ata || 'Coord. Qualidade'}
              </div>
            </div>

            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button onClick={() => setViewingFechamento(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
