import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Search, Trash2, Download, AlertTriangle, CheckCircle2, Clock, Mail, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PlanosAcao({ userRole, userSectors = [] }) {
  const [planos, setPlanos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('ALL');
  const [filtroStatus, setFiltroStatus] = useState('ALL');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editingPlano, setEditingPlano] = useState(null);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [planosRes, setoresRes] = await Promise.all([
        axios.get('/api/indicadores/planos-acao/todos'),
        axios.get('/api/setores')
      ]);
      setPlanos(planosRes.data || []);
      setSetores(setoresRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const isPrazoVencido = (prazoStr, status) => {
    if (!prazoStr || status === 'CONCLUIDO') return false;
    const str = prazoStr.trim();
    let parsed = null;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T23:59:59`);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      parsed = new Date(`${str.substring(0, 10)}T23:59:59`);
    }
    if (!parsed || isNaN(parsed.getTime())) return false;
    return parsed < new Date();
  };

  const atualizarStatus = async (id, status) => {
    try {
      await axios.put(`/api/indicadores/planos-acao/${id}`, { status });
      setPlanos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (e) {
      alert('Erro ao atualizar status.');
    }
  };

  const excluirPlano = async (id) => {
    if (!window.confirm('Deseja realmente excluir este Plano de Ação?')) return;
    try {
      await axios.delete(`/api/indicadores/planos-acao/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Erro ao excluir plano.');
    }
  };

  const salvarEdicaoPlano = async () => {
    if (!editingPlano) return;
    try {
      const res = await axios.put(`/api/indicadores/planos-acao/${editingPlano.id}`, {
        competencia: editingPlano.competencia,
        justificativa: editingPlano.justificativa,
        plano_acao: editingPlano.plano_acao,
        responsavel: editingPlano.responsavel,
        prazo: editingPlano.prazo,
        status: editingPlano.status
      });
      setPlanos(prev => prev.map(p => p.id === editingPlano.id ? { ...p, ...res.data } : p));
      setEditingPlano(null);
    } catch (e) {
      alert('Erro ao salvar alterações do Plano de Ação.');
    }
  };

  const enviarCobrancaEmail = async () => {
    if (!window.confirm('Deseja enviar por e-mail a relação de Planos de Ação pendentes/em andamento para os responsáveis e gestores?')) return;
    setSendingEmail(true);
    try {
      const res = await axios.post('/api/indicadores/planos-acao/notificar-email', { setorId: filtroSetor });
      alert(res.data?.message || 'E-mail processado!');
    } catch (e) {
      alert('Erro ao disparar notificação por e-mail.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filtra pelos setores permitidos ao usuário
  const planosPermitidos = planos.filter(p => {
    const sId = p.indicador?.setorId;
    return userRole === 'ADMIN' || userRole === 'LEITURA' || !sId || userSectors.includes(sId);
  });

  const planosFiltrados = planosPermitidos.filter(p => {
    if (filtroSetor !== 'ALL' && String(p.indicador?.setorId) !== String(filtroSetor)) return false;
    if (filtroStatus === 'VENCIDOS') {
      if (!isPrazoVencido(p.prazo, p.status)) return false;
    } else if (filtroStatus !== 'ALL' && p.status !== filtroStatus) {
      return false;
    }
    if (busca) {
      const termo = busca.toLowerCase();
      const match =
        (p.indicador?.nome || '').toLowerCase().includes(termo) ||
        (p.justificativa || '').toLowerCase().includes(termo) ||
        (p.plano_acao || '').toLowerCase().includes(termo) ||
        (p.responsavel || '').toLowerCase().includes(termo) ||
        (p.competencia || '').toLowerCase().includes(termo);
      if (!match) return false;
    }
    return true;
  });

  const totalPendentes = planosPermitidos.filter(p => p.status === 'PENDENTE').length;
  const totalAndamento = planosPermitidos.filter(p => p.status === 'EM_ANDAMENTO').length;
  const totalConcluidos = planosPermitidos.filter(p => p.status === 'CONCLUIDO').length;
  const totalVencidos = planosPermitidos.filter(p => isPrazoVencido(p.prazo, p.status)).length;

  const exportarXls = () => {
    if (planosFiltrados.length === 0) return alert('Nenhum plano para exportar.');
    const rows = planosFiltrados.map(p => ({
      SETOR: p.indicador?.setor?.nome || 'Geral',
      INDICADOR: p.indicador?.nome || '-',
      COMPETENCIA: p.competencia || '-',
      VALOR_OBTIDO: p.valor_obtido ?? '-',
      META_ESPERADA: p.meta_esperada ?? '-',
      JUSTIFICATIVA: p.justificativa,
      PLANO_DE_ACAO: p.plano_acao,
      RESPONSAVEL: p.responsavel || '-',
      PRAZO: p.prazo || '-',
      STATUS: p.status,
      CRIADO_EM: new Date(p.criado_em).toLocaleDateString('pt-BR')
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planos_de_Acao');
    XLSX.writeFile(wb, 'Central_Planos_de_Acao_SGQ.xls', { bookType: 'biff8' });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={28} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Central de Planos de Ação (SGQ)</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Acompanhamento consolidado das análises críticas e ações corretivas dos indicadores fora da meta
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {userRole !== 'LEITURA' && (
            <button onClick={enviarCobrancaEmail} disabled={sendingEmail} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              <Mail size={16} /> {sendingEmail ? 'Enviando...' : 'Cobrar Pendentes por E-mail'}
            </button>
          )}
          <button onClick={exportarXls} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            <Download size={16} /> Exportar XLS
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div onClick={() => setFiltroStatus('ALL')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total de Planos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{planosPermitidos.length}</div>
        </div>
        <div onClick={() => setFiltroStatus('PENDENTE')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #f59e0b50', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Pendentes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>{totalPendentes}</div>
        </div>
        <div onClick={() => setFiltroStatus('EM_ANDAMENTO')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #3b82f650', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#3b82f6' }}>Em Andamento</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalAndamento}</div>
        </div>
        <div onClick={() => setFiltroStatus('CONCLUIDO')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #10b98150', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> Concluídos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{totalConcluidos}</div>
        </div>
        <div onClick={() => setFiltroStatus('VENCIDOS')} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #ef444450', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14}/> Prazo Vencido</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{totalVencidos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'var(--panel-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por indicador, justificativa, plano ou responsável..."
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

        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="ALL">Todos os Status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="CONCLUIDO">Concluídos</option>
          <option value="VENCIDOS">⚠️ Prazo Vencido</option>
        </select>
      </div>

      {/* Tabela de Planos */}
      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Carregando planos de ação...</div>
        ) : planosFiltrados.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum plano de ação encontrado para os filtros selecionados.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Setor / Indicador</th>
                <th style={{ padding: '12px' }}>Competência</th>
                <th style={{ padding: '12px' }}>Resultado vs Meta</th>
                <th style={{ padding: '12px' }}>Análise Crítica / Justificativa</th>
                <th style={{ padding: '12px' }}>Plano de Ação</th>
                <th style={{ padding: '12px' }}>Responsável / Prazo</th>
                <th style={{ padding: '12px' }}>Status</th>
                {userRole !== 'LEITURA' && <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {planosFiltrados.map(p => {
                const vencido = isPrazoVencido(p.prazo, p.status);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: vencido ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{p.indicador?.setor?.nome || 'Geral'}</div>
                      <strong>{p.indicador?.nome || '-'}</strong>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{p.competencia || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{p.valor_obtido ?? '-'}</span>
                      <span style={{ color: 'var(--text-muted)' }}> / Meta: {p.meta_esperada ?? '-'}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '240px' }}>{p.justificativa}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '240px' }}>{p.plano_acao}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                      <div><strong>{p.responsavel || '-'}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: vencido ? '#ef4444' : 'var(--text-muted)', fontWeight: vencido ? 'bold' : 'normal' }}>
                        Prazo: {p.prazo || '-'} {vencido ? ' (VENCIDO)' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={p.status}
                        disabled={userRole === 'LEITURA'}
                        onChange={e => atualizarStatus(p.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          background: p.status === 'CONCLUIDO' ? '#10b98120' : p.status === 'EM_ANDAMENTO' ? '#3b82f620' : '#f59e0b20',
                          color: p.status === 'CONCLUIDO' ? '#10b981' : p.status === 'EM_ANDAMENTO' ? '#3b82f6' : '#d97706'
                        }}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                        <option value="CONCLUIDO">CONCLUÍDO</option>
                      </select>
                    </td>
                    {userRole !== 'LEITURA' && (
                      <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setEditingPlano({ ...p })} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '8px' }} title="Editar Plano de Ação">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => excluirPlano(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Edição Completa do Plano de Ação */}
      {editingPlano && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.72)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '580px', width: '100%', padding: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Editar Plano de Ação — {editingPlano.indicador?.nome}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Competência</label>
                  <input value={editingPlano.competencia || ''} onChange={e => setEditingPlano({ ...editingPlano, competencia: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Status</label>
                  <select value={editingPlano.status} onChange={e => setEditingPlano({ ...editingPlano, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="CONCLUIDO">CONCLUÍDO</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Análise Crítica / Justificativa</label>
                <textarea rows={3} value={editingPlano.justificativa || ''} onChange={e => setEditingPlano({ ...editingPlano, justificativa: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Plano de Ação Corretiva</label>
                <textarea rows={3} value={editingPlano.plano_acao || ''} onChange={e => setEditingPlano({ ...editingPlano, plano_acao: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Responsável</label>
                  <input value={editingPlano.responsavel || ''} onChange={e => setEditingPlano({ ...editingPlano, responsavel: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Prazo</label>
                  <input type="date" value={editingPlano.prazo || ''} onChange={e => setEditingPlano({ ...editingPlano, prazo: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => setEditingPlano(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button onClick={salvarEdicaoPlano} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
