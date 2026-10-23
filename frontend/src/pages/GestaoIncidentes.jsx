import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert, Plus, Search, Trash2, Edit2, Download, AlertTriangle,
  CheckCircle2, Clock, Filter, Eye, ShieldCheck, HeartHandshake, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GestaoIncidentes({ userRole, userSectors = [] }) {
  const [incidentes, setIncidentes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('ALL');
  const [filtroTipo, setFiltroTipo] = useState('ALL');
  const [filtroStatus, setFiltroStatus] = useState('ALL');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncidente, setEditingIncidente] = useState(null);
  const [viewingIncidente, setViewingIncidente] = useState(null);

  const initialForm = {
    data_incidente: new Date().toISOString().substring(0, 10),
    tipo_evento: 'NEAR_MISS',
    setorId: '',
    indicadorId: '',
    protocolo_seguranca: 'OUTRO',
    descricao_evento: '',
    fatores_contribuintes: '',
    acoes_imediatas: '',
    notificador_nome: 'Anônimo / Sigiloso',
    status: 'REGISTRADO',
    parecer_conclusivo: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [incRes, setRes, indRes] = await Promise.all([
        axios.get('/api/ona/incidentes'),
        axios.get('/api/setores'),
        axios.get('/api/indicadores')
      ]);
      setIncidentes(incRes.data || []);
      setSetores(setRes.data || []);
      setIndicadores(indRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const getTipoEventoBadge = (tipo) => {
    switch (tipo) {
      case 'SENTINELA':
        return { label: 'Evento Sentinela', bg: '#fee2e2', color: '#991b1b', border: '#f87171' };
      case 'COM_DANO_GRAVE':
        return { label: 'Dano Grave', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'COM_DANO_MODERADO':
        return { label: 'Dano Moderado', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
      case 'COM_DANO_LEVE':
        return { label: 'Dano Leve', bg: '#fef9c3', color: '#a16207', border: '#fde047' };
      case 'SEM_DANO':
        return { label: 'Incidente Sem Dano', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
      case 'NEAR_MISS':
      default:
        return { label: 'Near Miss (Quase Falha)', bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' };
    }
  };

  const getProtocoloLabel = (prot) => {
    switch (prot) {
      case 'HIGIENE_MAOS': return 'Higiene das Mãos (IRAS)';
      case 'IDENTIFICACAO': return 'Identificação do Paciente';
      case 'MEDICACAO': return 'Medicação & Farmácia';
      case 'CIRURGIA_SEGURA': return 'Cirurgia Segura';
      case 'QUEDAS': return 'Prevenção de Quedas';
      case 'LESAO_PRESSAO': return 'Lesão por Pressão (LPP)';
      case 'OUTRO': default: return 'Geral / Outros';
    }
  };

  const abrirNovo = () => {
    setEditingIncidente(null);
    setFormData({ ...initialForm });
    setIsModalOpen(true);
  };

  const abrirEdicao = (inc) => {
    setEditingIncidente(inc);
    setFormData({
      ...inc,
      data_incidente: inc.data_incidente ? inc.data_incidente.substring(0, 10) : new Date().toISOString().substring(0, 10),
      setorId: inc.setorId || '',
      indicadorId: inc.indicadorId || '',
      fatores_contribuintes: inc.fatores_contribuintes || '',
      acoes_imediatas: inc.acoes_imediatas || '',
      parecer_conclusivo: inc.parecer_conclusivo || ''
    });
    setIsModalOpen(true);
  };

  const salvarIncidente = async () => {
    if (!formData.descricao_evento || !formData.tipo_evento) {
      return alert('Preencha a descrição do evento e o tipo.');
    }
    try {
      if (editingIncidente) {
        const res = await axios.put(`/api/ona/incidentes/${editingIncidente.id}`, formData);
        setIncidentes(prev => prev.map(i => i.id === editingIncidente.id ? res.data : i));
      } else {
        const res = await axios.post('/api/ona/incidentes', formData);
        setIncidentes(prev => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (e) {
      alert('Erro ao salvar notificação: ' + (e.response?.data?.error || e.message));
    }
  };

  const excluirIncidente = async (id) => {
    if (!window.confirm('Deseja realmente excluir este registro de incidente?')) return;
    try {
      await axios.delete(`/api/ona/incidentes/${id}`);
      setIncidentes(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert('Erro ao excluir incidente.');
    }
  };

  const incidentesPermitidos = incidentes.filter(i => {
    return userRole === 'ADMIN' || userRole === 'LEITURA' || !i.setorId || userSectors.includes(i.setorId);
  });

  const incidentesFiltrados = incidentesPermitidos.filter(i => {
    if (filtroSetor !== 'ALL' && String(i.setorId) !== String(filtroSetor)) return false;
    if (filtroTipo !== 'ALL' && i.tipo_evento !== filtroTipo) return false;
    if (filtroStatus !== 'ALL' && i.status !== filtroStatus) return false;

    if (busca) {
      const termo = busca.toLowerCase();
      const match =
        (i.numero_protocolo || '').toLowerCase().includes(termo) ||
        (i.descricao_evento || '').toLowerCase().includes(termo) ||
        (i.setor?.nome || '').toLowerCase().includes(termo) ||
        (i.acoes_imediatas || '').toLowerCase().includes(termo);
      if (!match) return false;
    }
    return true;
  });

  const totalNearMiss = incidentesPermitidos.filter(i => i.tipo_evento === 'NEAR_MISS').length;
  const totalSemDano = incidentesPermitidos.filter(i => i.tipo_evento === 'SEM_DANO').length;
  const totalComDano = incidentesPermitidos.filter(i => ['COM_DANO_LEVE', 'COM_DANO_MODERADO', 'COM_DANO_GRAVE'].includes(i.tipo_evento)).length;
  const totalSentinela = incidentesPermitidos.filter(i => i.tipo_evento === 'SENTINELA').length;

  const exportarXls = () => {
    if (incidentesFiltrados.length === 0) return alert('Nenhum incidente para exportar.');
    const rows = incidentesFiltrados.map(i => ({
      PROTOCOLO: i.numero_protocolo,
      DATA: new Date(i.data_incidente).toLocaleDateString('pt-BR'),
      TIPO_EVENTO: getTipoEventoBadge(i.tipo_evento).label,
      SETOR: i.setor?.nome || 'Não Informado',
      PROTOCOLO_SEGURANCA: getProtocoloLabel(i.protocolo_seguranca),
      DESCRICAO: i.descricao_evento,
      ACOES_IMEDIATAS: i.acoes_imediatas || '-',
      FATORES_CONTRIBUINTES: i.fatores_contribuintes || '-',
      STATUS: i.status,
      PARECER_CONCLUSIVO: i.parecer_conclusivo || '-',
      NOTIFICADOR: i.notificador_nome || 'Anônimo'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes_ONA');
    XLSX.writeFile(wb, 'Notificacoes_Incidentes_Seguranca_ONA.xls', { bookType: 'biff8' });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Topo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={30} color="#e11d48" />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>
              Gestão de Incidentes & Eventos Adversos (ONA)
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Núcleo de Segurança do Paciente (NSP) — Notificação, Near Miss, Investigação e Prevenção de Danos
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
                background: '#e11d48',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Plus size={16} /> Notificar Incidente / Near Miss
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

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div onClick={() => { setFiltroTipo('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Notificado</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{incidentesPermitidos.length}</div>
        </div>
        <div onClick={() => setFiltroTipo('NEAR_MISS')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #c084fc50', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#9333ea', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartHandshake size={14} /> Near Miss (Quase Falha)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#9333ea' }}>{totalNearMiss}</div>
        </div>
        <div onClick={() => setFiltroTipo('SEM_DANO')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #38bdf850', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Sem Dano
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0284c7' }}>{totalSemDano}</div>
        </div>
        <div onClick={() => setFiltroTipo('COM_DANO_LEVE')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #fbbf2450', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> Com Dano (Assistencial)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>{totalComDano}</div>
        </div>
        <div onClick={() => setFiltroTipo('SENTINELA')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #f8717150', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> Eventos Sentinela
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>{totalSentinela}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'var(--panel-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por protocolo, setor, descrição ou ações..."
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

        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="ALL">Todos os Tipos</option>
          <option value="NEAR_MISS">Near Miss (Quase Falha)</option>
          <option value="SEM_DANO">Incidente Sem Dano</option>
          <option value="COM_DANO_LEVE">Dano Leve</option>
          <option value="COM_DANO_MODERADO">Dano Moderado</option>
          <option value="COM_DANO_GRAVE">Dano Grave</option>
          <option value="SENTINELA">Evento Sentinela</option>
        </select>

        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="ALL">Todos os Status</option>
          <option value="REGISTRADO">Registrado</option>
          <option value="EM_INVESTIGACAO">Em Investigação</option>
          <option value="PLANO_IMPLANTADO">Plano Implantado</option>
          <option value="CONCLUIDO">Concluído</option>
        </select>
      </div>

      {/* Tabela de Incidentes */}
      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Carregando incidentes de segurança...</div>
        ) : incidentesFiltrados.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma notificação encontrada para os filtros selecionados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Protocolo / Data</th>
                <th style={{ padding: '12px' }}>Classificação de Risco</th>
                <th style={{ padding: '12px' }}>Setor Envolvido</th>
                <th style={{ padding: '12px' }}>Meta de Segurança</th>
                <th style={{ padding: '12px' }}>Descrição do Incidente</th>
                <th style={{ padding: '12px' }}>Ações Imediatas</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {incidentesFiltrados.map(inc => {
                const badge = getTipoEventoBadge(inc.tipo_evento);
                return (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{inc.numero_protocolo}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {new Date(inc.data_incidente).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        display: 'inline-block'
                      }}>
                        {badge.label}
                      </span>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                      <strong>{inc.setor?.nome || 'Geral'}</strong>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {getProtocoloLabel(inc.protocolo_seguranca)}
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '280px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {inc.descricao_evento}
                      </div>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {inc.acoes_imediatas || '-'}
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: inc.status === 'CONCLUIDO' ? '#dcfce7' : inc.status === 'EM_INVESTIGACAO' ? '#fef3c7' : '#f1f5f9',
                        color: inc.status === 'CONCLUIDO' ? '#15803d' : inc.status === 'EM_INVESTIGACAO' ? '#b45309' : '#475569'
                      }}>
                        {inc.status}
                      </span>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setViewingIncidente(inc)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '6px' }}
                        title="Ver Detalhes do Incidente"
                      >
                        <Eye size={16} />
                      </button>
                      {userRole !== 'LEITURA' && (
                        <>
                          <button
                            onClick={() => abrirEdicao(inc)}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '6px' }}
                            title="Editar Notificação"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => excluirIncidente(inc.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE NOTIFICAÇÃO / EDIÇÃO */}
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
            <div style={{ padding: '16px 24px', background: '#e11d48', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {editingIncidente ? `Editar Notificação — ${editingIncidente.numero_protocolo}` : 'Notificação de Incidente / Quase Falha (ONA)'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Data do Incidente *</label>
                  <input
                    type="date"
                    value={formData.data_incidente}
                    onChange={e => setFormData({ ...formData, data_incidente: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Classificação de Gravidade (ONA) *</label>
                  <select
                    value={formData.tipo_evento}
                    onChange={e => setFormData({ ...formData, tipo_evento: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="NEAR_MISS">Near Miss (Quase Falha — não atingiu o paciente)</option>
                    <option value="SEM_DANO">Incidente Sem Dano (atingiu mas não provocou lesão)</option>
                    <option value="COM_DANO_LEVE">Evento Adverso com Dano Leve</option>
                    <option value="COM_DANO_MODERADO">Evento Adverso com Dano Moderado</option>
                    <option value="COM_DANO_GRAVE">Evento Adverso com Dano Grave</option>
                    <option value="SENTINELA">Evento Sentinela (Crítico / Óbito ou Dano Irreversível)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Setor Onde Ocorreu *</label>
                  <select
                    value={formData.setorId}
                    onChange={e => setFormData({ ...formData, setorId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Selecione o Setor...</option>
                    {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Meta de Segurança do Paciente (MS/ONA)</label>
                  <select
                    value={formData.protocolo_seguranca}
                    onChange={e => setFormData({ ...formData, protocolo_seguranca: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="OUTRO">Geral / Outros Processos</option>
                    <option value="IDENTIFICACAO">Meta 1: Identificação do Paciente</option>
                    <option value="MEDICACAO">Meta 3: Segurança na Administração de Medicamentos</option>
                    <option value="CIRURGIA_SEGURA">Meta 4: Cirurgia Segura</option>
                    <option value="HIGIENE_MAOS">Meta 5: Higiene das Mãos / IRAS</option>
                    <option value="QUEDAS">Meta 6A: Prevenção de Quedas</option>
                    <option value="LESAO_PRESSAO">Meta 6B: Prevenção de Lesões por Pressão (LPP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Indicador Correlacionado (Opcional)</label>
                <select
                  value={formData.indicadorId}
                  onChange={e => setFormData({ ...formData, indicadorId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Nenhum / Não vinculado diretamente</option>
                  {indicadores.map(ind => (
                    <option key={ind.id} value={ind.id}>
                      {ind.setor?.nome ? `[${ind.setor.nome}] ` : ''}{ind.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Descrição Detalhada do Ocorrido *</label>
                <textarea
                  rows={3}
                  value={formData.descricao_evento}
                  onChange={e => setFormData({ ...formData, descricao_evento: e.target.value })}
                  placeholder="Relate o que ocorreu de forma objetiva e factual..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Ações Imediatas Tomadas</label>
                  <textarea
                    rows={2}
                    value={formData.acoes_imediatas}
                    onChange={e => setFormData({ ...formData, acoes_imediatas: e.target.value })}
                    placeholder="Primeiros socorros, troca de medicação, comunicação médica..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Fatores Contribuintes Preliminares</label>
                  <textarea
                    rows={2}
                    value={formData.fatores_contribuintes}
                    onChange={e => setFormData({ ...formData, fatores_contribuintes: e.target.value })}
                    placeholder="Sobrecarga, falta de insumo, ruído, falha de comunicação..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Status da Notificação</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="REGISTRADO">REGISTRADO</option>
                    <option value="EM_INVESTIGACAO">EM INVESTIGAÇÃO (NSP)</option>
                    <option value="PLANO_IMPLANTADO">PLANO DE AÇÃO IMPLANTADO</option>
                    <option value="CONCLUIDO">CONCLUÍDO</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Notificador / Responsável</label>
                  <input
                    value={formData.notificador_nome}
                    onChange={e => setFormData({ ...formData, notificador_nome: e.target.value })}
                    placeholder="Anônimo / Sigiloso"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  Parecer Conclusivo do Núcleo de Segurança do Paciente (NSP / ONA)
                </label>
                <textarea
                  rows={2}
                  value={formData.parecer_conclusivo}
                  onChange={e => setFormData({ ...formData, parecer_conclusivo: e.target.value })}
                  placeholder="Conclusão da investigação de barreira e desfecho da segurança..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
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
                onClick={salvarIncidente}
                style={{ padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#e11d48', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Salvar Notificação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO COMPLETA */}
      {viewingIncidente && (
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
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Protocolo: {viewingIncidente.numero_protocolo}</h3>
              <button onClick={() => setViewingIncidente(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  ...getTipoEventoBadge(viewingIncidente.tipo_evento)
                }}>
                  {getTipoEventoBadge(viewingIncidente.tipo_evento).label}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Data: {new Date(viewingIncidente.data_incidente).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div>
                <strong>Setor:</strong> {viewingIncidente.setor?.nome || 'Geral'} • <strong>Protocolo:</strong> {getProtocoloLabel(viewingIncidente.protocolo_seguranca)}
              </div>

              {viewingIncidente.indicador && (
                <div style={{ color: '#0284c7', fontWeight: 600 }}>
                  Indicador Vinculado: {viewingIncidente.indicador.nome}
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Descrição do Fato:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#334155' }}>{viewingIncidente.descricao_evento}</p>
              </div>

              {viewingIncidente.acoes_imediatas && (
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534' }}>
                  <strong>Ações Imediatas Adotadas:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingIncidente.acoes_imediatas}</p>
                </div>
              )}

              {viewingIncidente.fatores_contribuintes && (
                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fef3c7', color: '#92400e' }}>
                  <strong>Fatores Contribuintes Identificados:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingIncidente.fatores_contribuintes}</p>
                </div>
              )}

              {viewingIncidente.parecer_conclusivo && (
                <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '8px', border: '1px solid #ddd6fe', color: '#5b21b6' }}>
                  <strong>Parecer Conclusivo (NSP):</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{viewingIncidente.parecer_conclusivo}</p>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                Notificador: {viewingIncidente.notificador_nome || 'Anônimo'} • Status: {viewingIncidente.status}
              </div>
            </div>

            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button onClick={() => setViewingIncidente(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
