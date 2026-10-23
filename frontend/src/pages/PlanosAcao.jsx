import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardList, Search, Trash2, Download, AlertTriangle, CheckCircle2,
  Clock, Mail, Edit2, Plus, Target, CheckSquare, Layers, Eye, Award
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PlanosAcao({ userRole, userSectors = [] }) {
  const [planos, setPlanos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('ALL');
  const [filtroStatus, setFiltroStatus] = useState('ALL');
  const [filtroPrioridade, setFiltroPrioridade] = useState('ALL');
  const [ordenacao, setOrdenacao] = useState('GUT_DESC');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Modais
  const [modalMode, setModalMode] = useState(null); // 'NOVO' | 'EDITAR' | null
  const [modalTab, setModalTab] = useState('5w2h'); // 'causa_raiz' | '5w2h' | 'gut' | 'eficacia'
  const [currentPlano, setCurrentPlano] = useState(null);
  const [viewingPlano, setViewingPlano] = useState(null);

  const initialPlanoForm = {
    indicadorId: '',
    competencia: '',
    valor_obtido: '',
    meta_esperada: '',
    justificativa: '',
    plano_acao: '',
    responsavel: '',
    prazo: '',
    status: 'PENDENTE',
    eficacia: 'PENDENTE',
    evidencia_eficacia: '',
    causa_raiz_metodo: '5PORQUES',
    ishikawa_6m: { metodo: '', mao_de_obra: '', material: '', maquina: '', meio_ambiente: '', medida: '' },
    cinco_porques: ['', '', '', '', ''],
    what_acao: '',
    why_motivo: '',
    where_local: '',
    who_responsavel: '',
    when_prazo: '',
    how_metodo: '',
    how_much_custo: '',
    nota_g: 3,
    nota_u: 3,
    nota_t: 3
  };

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [planosRes, setoresRes, indRes] = await Promise.all([
        axios.get('/api/indicadores/planos-acao/todos'),
        axios.get('/api/setores'),
        axios.get('/api/indicadores')
      ]);
      setPlanos(planosRes.data || []);
      setSetores(setoresRes.data || []);
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

  const getGutClassificacao = (score) => {
    const s = Number(score) || 27;
    if (s >= 64) return { label: 'Crítico', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
    if (s >= 36) return { label: 'Alto', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
    if (s >= 16) return { label: 'Médio', bg: '#fef9c3', color: '#a16207', border: '#fde047' };
    return { label: 'Baixo', bg: '#dcfce7', color: '#15803d', border: '#86efac' };
  };

  const atualizarStatus = async (id, status) => {
    try {
      await axios.put(`/api/indicadores/planos-acao/${id}`, { status });
      setPlanos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (e) {
      alert('Erro ao atualizar status.');
    }
  };

  const atualizarEficacia = async (id, eficacia) => {
    try {
      await axios.put(`/api/indicadores/planos-acao/${id}`, { eficacia });
      setPlanos(prev => prev.map(p => p.id === id ? { ...p, eficacia } : p));
    } catch (e) {
      alert('Erro ao atualizar avaliação de eficácia.');
    }
  };

  const abrirCriacao = () => {
    setCurrentPlano({ ...initialPlanoForm });
    setModalTab('causa_raiz');
    setModalMode('NOVO');
  };

  const abrirEdicao = (plano) => {
    let ish = { metodo: '', mao_de_obra: '', material: '', maquina: '', meio_ambiente: '', medida: '' };
    if (plano.ishikawa_6m) {
      try {
        ish = typeof plano.ishikawa_6m === 'object' ? plano.ishikawa_6m : JSON.parse(plano.ishikawa_6m);
      } catch (e) {}
    }

    let porq = ['', '', '', '', ''];
    if (plano.cinco_porques) {
      try {
        const parsed = typeof plano.cinco_porques === 'object' ? plano.cinco_porques : JSON.parse(plano.cinco_porques);
        if (Array.isArray(parsed)) porq = [...parsed, '', '', '', ''].slice(0, 5);
      } catch (e) {}
    }

    setCurrentPlano({
      ...plano,
      indicadorId: plano.indicadorId || '',
      causa_raiz_metodo: plano.causa_raiz_metodo || '5PORQUES',
      ishikawa_6m: ish,
      cinco_porques: porq,
      what_acao: plano.what_acao || plano.plano_acao || '',
      why_motivo: plano.why_motivo || plano.justificativa || '',
      where_local: plano.where_local || plano.indicador?.setor?.nome || '',
      who_responsavel: plano.who_responsavel || plano.responsavel || '',
      when_prazo: plano.when_prazo || plano.prazo || '',
      how_metodo: plano.how_metodo || '',
      how_much_custo: plano.how_much_custo || '',
      nota_g: plano.nota_g || 3,
      nota_u: plano.nota_u || 3,
      nota_t: plano.nota_t || 3
    });
    setModalTab('5w2h');
    setModalMode('EDITAR');
  };

  const salvarPlanoModal = async () => {
    if (!currentPlano?.indicadorId) {
      return alert('Selecione o Indicador.');
    }
    const finalJustificativa = currentPlano.justificativa || currentPlano.why_motivo || 'Análise crítica';
    const finalPlanoAcao = currentPlano.plano_acao || currentPlano.what_acao || 'Ação corretiva';

    if (!finalJustificativa || !finalPlanoAcao) {
      return alert('Preencha a Justificativa / Causa Raiz e o Plano de Ação 5W2H.');
    }

    const payload = {
      ...currentPlano,
      justificativa: finalJustificativa,
      plano_acao: finalPlanoAcao,
      responsavel: currentPlano.who_responsavel || currentPlano.responsavel,
      prazo: currentPlano.when_prazo || currentPlano.prazo
    };

    try {
      if (modalMode === 'NOVO') {
        const res = await axios.post(`/api/indicadores/${currentPlano.indicadorId}/planos-acao`, payload);
        setPlanos(prev => [res.data, ...prev]);
      } else {
        const res = await axios.put(`/api/indicadores/planos-acao/${currentPlano.id}`, payload);
        setPlanos(prev => prev.map(p => p.id === currentPlano.id ? { ...p, ...res.data } : p));
      }
      setModalMode(null);
      setCurrentPlano(null);
    } catch (e) {
      alert('Erro ao salvar Plano de Ação: ' + (e.response?.data?.error || e.message));
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

  const enviarCobrancaEmail = async () => {
    if (!window.confirm('Deseja enviar por e-mail a relação de Planos de Ação pendentes/em andamento para os gestores e responsáveis?')) return;
    setSendingEmail(true);
    try {
      const res = await axios.post('/api/indicadores/planos-acao/notificar-email', { setorId: filtroSetor });
      alert(res.data?.message || 'E-mails enviados com sucesso!');
    } catch (e) {
      alert('Erro ao disparar cobrança por e-mail.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filtragem
  const planosPermitidos = planos.filter(p => {
    const sId = p.indicador?.setorId;
    return userRole === 'ADMIN' || userRole === 'LEITURA' || !sId || userSectors.includes(sId);
  });

  const planosFiltrados = planosPermitidos.filter(p => {
    if (filtroSetor !== 'ALL' && String(p.indicador?.setorId) !== String(filtroSetor)) return false;

    if (filtroStatus === 'VENCIDOS') {
      if (!isPrazoVencido(p.prazo || p.when_prazo, p.status)) return false;
    } else if (filtroStatus !== 'ALL' && p.status !== filtroStatus) {
      return false;
    }

    if (filtroPrioridade !== 'ALL') {
      const gutClass = getGutClassificacao(p.score_gut).label;
      if (gutClass.toUpperCase() !== filtroPrioridade) return false;
    }

    if (busca) {
      const termo = busca.toLowerCase();
      const match =
        (p.indicador?.nome || '').toLowerCase().includes(termo) ||
        (p.justificativa || '').toLowerCase().includes(termo) ||
        (p.plano_acao || '').toLowerCase().includes(termo) ||
        (p.what_acao || '').toLowerCase().includes(termo) ||
        (p.responsavel || '').toLowerCase().includes(termo) ||
        (p.competencia || '').toLowerCase().includes(termo);
      if (!match) return false;
    }
    return true;
  });

  // Ordenação
  planosFiltrados.sort((a, b) => {
    if (ordenacao === 'GUT_DESC') return (b.score_gut || 27) - (a.score_gut || 27);
    if (ordenacao === 'GUT_ASC') return (a.score_gut || 27) - (b.score_gut || 27);
    if (ordenacao === 'DATA_DESC') return new Date(b.criado_em) - new Date(a.criado_em);
    return new Date(a.criado_em) - new Date(b.criado_em);
  });

  const totalPendentes = planosPermitidos.filter(p => p.status === 'PENDENTE').length;
  const totalAndamento = planosPermitidos.filter(p => p.status === 'EM_ANDAMENTO').length;
  const totalConcluidos = planosPermitidos.filter(p => p.status === 'CONCLUIDO').length;
  const totalVencidos = planosPermitidos.filter(p => isPrazoVencido(p.prazo || p.when_prazo, p.status)).length;
  const totalCriticos = planosPermitidos.filter(p => (p.score_gut || 27) >= 64).length;

  const exportarXls = () => {
    if (planosFiltrados.length === 0) return alert('Nenhum plano para exportar.');
    const rows = planosFiltrados.map(p => ({
      SETOR: p.indicador?.setor?.nome || 'Geral',
      INDICADOR: p.indicador?.nome || '-',
      COMPETENCIA: p.competencia || '-',
      VALOR_OBTIDO: p.valor_obtido ?? '-',
      META_ESPERADA: p.meta_esperada ?? '-',
      MATRIZ_GUT_SCORE: p.score_gut || 27,
      PRIORIDADE_GUT: getGutClassificacao(p.score_gut).label,
      NOTA_G: p.nota_g || 3,
      NOTA_U: p.nota_u || 3,
      NOTA_T: p.nota_t || 3,
      CAUSA_RAIZ_ANALISE: p.justificativa,
      PLANO_WHAT: p.what_acao || p.plano_acao,
      PLANO_WHY: p.why_motivo || '-',
      PLANO_WHERE: p.where_local || '-',
      PLANO_WHO: p.who_responsavel || p.responsavel || '-',
      PLANO_WHEN: p.when_prazo || p.prazo || '-',
      PLANO_HOW: p.how_metodo || '-',
      PLANO_HOW_MUCH: p.how_much_custo || '-',
      STATUS: p.status,
      EFICACIA_PDCA: p.eficacia || 'PENDENTE',
      EVIDENCIA_EFICACIA: p.evidencia_eficacia || '-',
      CRIADO_EM: new Date(p.criado_em).toLocaleDateString('pt-BR')
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planos_5W2H_GUT_ONA');
    XLSX.writeFile(wb, 'Central_Planos_Acao_5W2H_ONA.xls', { bookType: 'biff8' });
  };

  const calculatedGut = (currentPlano?.nota_g || 3) * (currentPlano?.nota_u || 3) * (currentPlano?.nota_t || 3);
  const currentGutBadge = getGutClassificacao(calculatedGut);

  return (
    <div style={{ padding: '24px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={30} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>
              Central de Planos de Ação (SGQ & ONA)
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Metodologias 5W2H, Ishikawa 6M, 5 Porquês, Matriz GUT e Verificação de Eficácia (PDCA)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {userRole !== 'LEITURA' && (
            <>
              <button
                onClick={abrirCriacao}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Plus size={16} /> Novo Plano (5W2H)
              </button>
              <button
                onClick={enviarCobrancaEmail}
                disabled={sendingEmail}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Mail size={16} /> {sendingEmail ? 'Enviando...' : 'Cobrar por E-mail'}
              </button>
            </>
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
            <Download size={16} /> Exportar XLS Completo
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div onClick={() => { setFiltroStatus('ALL'); setFiltroPrioridade('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total de Planos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{planosPermitidos.length}</div>
        </div>
        <div onClick={() => { setFiltroPrioridade('CRÍTICO'); setFiltroStatus('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #dc262650', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> GUT Crítico (&gt;64)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>{totalCriticos}</div>
        </div>
        <div onClick={() => { setFiltroStatus('PENDENTE'); setFiltroPrioridade('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #f59e0b50', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> Pendentes
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>{totalPendentes}</div>
        </div>
        <div onClick={() => { setFiltroStatus('EM_ANDAMENTO'); setFiltroPrioridade('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #3b82f650', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#3b82f6' }}>Em Andamento</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalAndamento}</div>
        </div>
        <div onClick={() => { setFiltroStatus('CONCLUIDO'); setFiltroPrioridade('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #10b98150', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> Concluídos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{totalConcluidos}</div>
        </div>
        <div onClick={() => { setFiltroStatus('VENCIDOS'); setFiltroPrioridade('ALL'); }} style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid #ef444450', cursor: 'pointer' }}>
          <div style={{ fontSize: '0.82rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> Prazo Vencido
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{totalVencidos}</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'var(--panel-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por indicador, 5W2H, justificativa ou responsável..."
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

        <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="ALL">Todas as Prioridades (GUT)</option>
          <option value="CRÍTICO">🔴 Crítico (GUT &gt; 64)</option>
          <option value="ALTO">🟠 Alto (GUT 36-64)</option>
          <option value="MÉDIO">🟡 Médio (GUT 16-35)</option>
          <option value="BAIXO">🟢 Baixo (GUT &lt; 16)</option>
        </select>

        <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <option value="GUT_DESC">Prioridade GUT (Maior Primeiro)</option>
          <option value="GUT_ASC">Prioridade GUT (Menor Primeiro)</option>
          <option value="DATA_DESC">Mais Recentes</option>
          <option value="DATA_ASC">Mais Antigos</option>
        </select>
      </div>

      {/* Tabela de Planos de Ação */}
      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Carregando planos de ação SGQ / ONA...</div>
        ) : planosFiltrados.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum plano de ação encontrado para os critérios selecionados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Prioridade GUT</th>
                <th style={{ padding: '12px' }}>Setor / Indicador</th>
                <th style={{ padding: '12px' }}>Competência</th>
                <th style={{ padding: '12px' }}>Resultado / Meta</th>
                <th style={{ padding: '12px' }}>Causa Raiz & Plano 5W2H</th>
                <th style={{ padding: '12px' }}>Responsável / Prazo</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Eficácia PDCA</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {planosFiltrados.map(p => {
                const vencido = isPrazoVencido(p.prazo || p.when_prazo, p.status);
                const gut = getGutClassificacao(p.score_gut);
                const efic = p.eficacia || 'PENDENTE';
                const what = p.what_acao || p.plano_acao;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: vencido ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: gut.bg,
                        color: gut.color,
                        border: `1px solid ${gut.border}`,
                        display: 'inline-block'
                      }}>
                        {gut.label}: {p.score_gut || 27}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        G:{p.nota_g || 3} U:{p.nota_u || 3} T:{p.nota_t || 3}
                      </div>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {p.indicador?.setor?.nome || 'Geral'}
                      </div>
                      <strong>{p.indicador?.nome || '-'}</strong>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                      {p.competencia || '-'}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{p.valor_obtido ?? '-'}</span>
                      <span style={{ color: 'var(--text-muted)' }}> / {p.meta_esperada ?? '-'}</span>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                        {what}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong>Causa:</strong> {p.justificativa}
                      </div>
                      {p.evidencia_eficacia && (
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '3px' }}>
                          <strong>Evidência:</strong> {p.evidencia_eficacia}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                      <div><strong>{p.who_responsavel || p.responsavel || '-'}</strong></div>
                      <div style={{ fontSize: '0.76rem', color: vencido ? '#ef4444' : 'var(--text-muted)', fontWeight: vencido ? 'bold' : 'normal' }}>
                        Prazo: {p.when_prazo || p.prazo || '-'} {vencido ? ' (VENCIDO)' : ''}
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
                          fontSize: '0.76rem',
                          background: p.status === 'CONCLUIDO' ? '#10b98120' : p.status === 'EM_ANDAMENTO' ? '#3b82f620' : '#f59e0b20',
                          color: p.status === 'CONCLUIDO' ? '#10b981' : p.status === 'EM_ANDAMENTO' ? '#3b82f6' : '#d97706'
                        }}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                        <option value="CONCLUIDO">CONCLUÍDO</option>
                      </select>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <select
                        value={efic}
                        disabled={userRole === 'LEITURA'}
                        onChange={e => atualizarEficacia(p.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          fontWeight: 'bold',
                          fontSize: '0.74rem',
                          background: efic === 'EFICAZ' ? '#10b98120' : efic === 'INEFICAZ' ? '#ef444420' : 'var(--bg-main)',
                          color: efic === 'EFICAZ' ? '#10b981' : efic === 'INEFICAZ' ? '#ef4444' : 'var(--text-muted)'
                        }}
                      >
                        <option value="PENDENTE">⏳ A Avaliar</option>
                        <option value="EFICAZ">✅ Eficaz</option>
                        <option value="INEFICAZ">❌ Ineficaz</option>
                      </select>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setViewingPlano(p)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '6px' }}
                        title="Ver Ficha Completa 5W2H / Causa Raiz"
                      >
                        <Eye size={16} />
                      </button>
                      {userRole !== 'LEITURA' && (
                        <>
                          <button
                            onClick={() => abrirEdicao(p)}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '6px' }}
                            title="Editar Plano 5W2H"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => excluirPlano(p.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Excluir Plano"
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO COMPLETA 5W2H & ONA */}
      {modalMode && currentPlano && (
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
            maxWidth: '820px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Topo do Modal */}
            <div style={{
              padding: '16px 24px',
              background: '#0f172a',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {modalMode === 'NOVO' ? 'Novo Plano de Ação ONA (5W2H)' : `Editar Plano de Ação — ${currentPlano.indicador?.nome || ''}`}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Metodologias recomendadas pelo Manual Brasileiro de Acreditação Hospitalar
                </div>
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '16px',
                background: currentGutBadge.bg,
                color: currentGutBadge.color,
                fontWeight: 'bold',
                fontSize: '0.82rem',
                border: `1px solid ${currentGutBadge.border}`
              }}>
                GUT: {calculatedGut} ({currentGutBadge.label})
              </div>
            </div>

            {/* Abas Internas */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
              {[
                { id: 'causa_raiz', label: '1. Causa Raiz (Ishikawa / 5 Porquês)' },
                { id: '5w2h', label: '2. Plano 5W2H' },
                { id: 'gut', label: '3. Matriz GUT' },
                { id: 'eficacia', label: '4. Eficácia (PDCA)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id)}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: modalTab === tab.id ? 700 : 500,
                    color: modalTab === tab.id ? '#0284c7' : '#64748b',
                    borderBottom: modalTab === tab.id ? '3px solid #0284c7' : '3px solid transparent',
                    fontSize: '0.85rem'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Corpo do Formulário */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Informações Básicas Fixas */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Indicador *</label>
                  <select
                    disabled={modalMode === 'EDITAR'}
                    value={currentPlano.indicadorId}
                    onChange={e => setCurrentPlano({ ...currentPlano, indicadorId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Selecione o Indicador...</option>
                    {indicadores
                      .filter(ind => userRole === 'ADMIN' || !ind.setorId || userSectors.includes(ind.setorId))
                      .map(ind => (
                        <option key={ind.id} value={ind.id}>
                          {ind.setor?.nome ? `[${ind.setor.nome}] ` : ''}{ind.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Competência</label>
                  <input
                    placeholder="Ex: 10/2026"
                    value={currentPlano.competencia || ''}
                    onChange={e => setCurrentPlano({ ...currentPlano, competencia: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc2626' }}>Valor Obtido</label>
                  <input
                    type="number"
                    value={currentPlano.valor_obtido ?? ''}
                    onChange={e => setCurrentPlano({ ...currentPlano, valor_obtido: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Meta Esperada</label>
                  <input
                    type="number"
                    value={currentPlano.meta_esperada ?? ''}
                    onChange={e => setCurrentPlano({ ...currentPlano, meta_esperada: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* ABA 1: Causa Raiz (Ishikawa ou 5 Porquês) */}
              {modalTab === 'causa_raiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      Ferramenta de Análise de Causa Raiz:
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="ferramenta"
                        checked={currentPlano.causa_raiz_metodo === '5PORQUES'}
                        onChange={() => setCurrentPlano({ ...currentPlano, causa_raiz_metodo: '5PORQUES' })}
                      />
                      Método dos 5 Porquês
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="ferramenta"
                        checked={currentPlano.causa_raiz_metodo === 'ISHIKAWA'}
                        onChange={() => setCurrentPlano({ ...currentPlano, causa_raiz_metodo: 'ISHIKAWA' })}
                      />
                      Diagrama de Ishikawa (6M)
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      Análise Crítica Consolidada (Causa Raiz Primária) *
                    </label>
                    <textarea
                      rows={2}
                      value={currentPlano.justificativa || ''}
                      onChange={e => setCurrentPlano({ ...currentPlano, justificativa: e.target.value })}
                      placeholder="Descreva a causa básica identificada que gerou a não-conformidade com a meta..."
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {currentPlano.causa_raiz_metodo === '5PORQUES' && (
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', marginBottom: '8px' }}>
                        Perguntas Sucessivas de Causa Raiz (5 Porquês):
                      </div>
                      {[0, 1, 2, 3, 4].map(idx => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                            Por quê {idx + 1} {idx === 4 ? '(Causa Raiz Fundamental)' : ''}:
                          </label>
                          <input
                            value={currentPlano.cinco_porques[idx] || ''}
                            onChange={e => {
                              const arr = [...currentPlano.cinco_porques];
                              arr[idx] = e.target.value;
                              setCurrentPlano({ ...currentPlano, cinco_porques: arr });
                            }}
                            placeholder={`Ex: Por que ocorreu a falha no nível ${idx + 1}?`}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {currentPlano.causa_raiz_metodo === 'ISHIKAWA' && (
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', marginBottom: '8px' }}>
                        Categorias do Ishikawa (Espinha de Peixe - 6M):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>1. Método (Processos, protocolos, POPs):</label>
                          <input
                            value={currentPlano.ishikawa_6m.metodo || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, metodo: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>2. Mão de Obra (Treinamento, adesão):</label>
                          <input
                            value={currentPlano.ishikawa_6m.mao_de_obra || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, mao_de_obra: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>3. Material (Insumos, formulários, farmácia):</label>
                          <input
                            value={currentPlano.ishikawa_6m.material || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, material: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>4. Máquina (Equipamentos, sistemas, TI):</label>
                          <input
                            value={currentPlano.ishikawa_6m.maquina || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, maquina: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>5. Meio Ambiente (Estrutura física, ruído):</label>
                          <input
                            value={currentPlano.ishikawa_6m.meio_ambiente || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, meio_ambiente: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>6. Medida (Aferição, calibração, amostragem):</label>
                          <input
                            value={currentPlano.ishikawa_6m.medida || ''}
                            onChange={e => setCurrentPlano({ ...currentPlano, ishikawa_6m: { ...currentPlano.ishikawa_6m, medida: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: Plano 5W2H */}
              {modalTab === '5w2h' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', color: '#166534' }}>
                    O padrão 5W2H elimina ambiguidades e assegura a execução precisa exigida em auditorias ONA.
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>WHAT (O que será feito?) *</label>
                    <input
                      placeholder="Ação corretiva específica a ser implementada..."
                      value={currentPlano.what_acao || ''}
                      onChange={e => setCurrentPlano({ ...currentPlano, what_acao: e.target.value, plano_acao: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>WHY (Por que será feito? Justificativa)</label>
                      <input
                        placeholder="Objetivo direto a alcançar..."
                        value={currentPlano.why_motivo || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, why_motivo: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>WHERE (Onde será executado?)</label>
                      <input
                        placeholder="Setor, enfermaria, posto..."
                        value={currentPlano.where_local || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, where_local: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>WHO (Quem é o responsável?)</label>
                      <input
                        placeholder="Nome / cargo do responsável..."
                        value={currentPlano.who_responsavel || currentPlano.responsavel || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, who_responsavel: e.target.value, responsavel: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>WHEN (Quando? Prazo limite)</label>
                      <input
                        type="date"
                        value={currentPlano.when_prazo || currentPlano.prazo || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, when_prazo: e.target.value, prazo: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>HOW (Como será feito? Procedimento)</label>
                      <input
                        placeholder="Método / etapas operacionais..."
                        value={currentPlano.how_metodo || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, how_metodo: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>HOW MUCH (Quanto custará? / Recursos)</label>
                      <input
                        placeholder="Ex: Recursos internos / R$ 500"
                        value={currentPlano.how_much_custo || ''}
                        onChange={e => setCurrentPlano({ ...currentPlano, how_much_custo: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: Matriz GUT */}
              {modalTab === 'gut' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', padding: '12px', fontSize: '0.82rem', color: '#5b21b6' }}>
                    A <strong>Matriz GUT</strong> quantifica a prioridade da ação multiplicando <strong>Gravidade × Urgência × Tendência</strong> (Score de 1 a 125).
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Gravidade (G):</label>
                      <select
                        value={currentPlano.nota_g || 3}
                        onChange={e => setCurrentPlano({ ...currentPlano, nota_g: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                      >
                        <option value={1}>1 - Sem gravidade (impacto irrelevante)</option>
                        <option value={2}>2 - Pouco grave (impacto leve)</option>
                        <option value={3}>3 - Grave (impacto regular/moderado)</option>
                        <option value={4}>4 - Muito grave (prejuízo alto)</option>
                        <option value={5}>5 - Extremamente grave (risco de dano/óbito)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Urgência (U):</label>
                      <select
                        value={currentPlano.nota_u || 3}
                        onChange={e => setCurrentPlano({ ...currentPlano, nota_u: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                      >
                        <option value={1}>1 - Pode esperar sem prejuízo</option>
                        <option value={2}>2 - Pouco urgente (prazo flexível)</option>
                        <option value={3}>3 - Urgente (necessário em curto prazo)</option>
                        <option value={4}>4 - Muito urgente (ação rápida requerida)</option>
                        <option value={5}>5 - Ação imediata requerida</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Tendência (T):</label>
                      <select
                        value={currentPlano.nota_t || 3}
                        onChange={e => setCurrentPlano({ ...currentPlano, nota_t: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                      >
                        <option value={1}>1 - Não vai mudar ou pode melhorar</option>
                        <option value={2}>2 - Vai piorar a longo prazo</option>
                        <option value={3}>3 - Vai piorar a médio prazo</option>
                        <option value={4}>4 - Vai piorar em curto prazo</option>
                        <option value={5}>5 - Vai piorar rapidamente/imediatamente</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    background: currentGutBadge.bg,
                    border: `1px solid ${currentGutBadge.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: currentGutBadge.color, fontWeight: 600 }}>Índice GUT Calculado:</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: currentGutBadge.color }}>
                        {currentPlano.nota_g || 3} × {currentPlano.nota_u || 3} × {currentPlano.nota_t || 3} = {calculatedGut}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: currentGutBadge.color }}>Classificação ONA:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: currentGutBadge.color }}>
                        Prioridade {currentGutBadge.label}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: Eficácia PDCA */}
              {modalTab === 'eficacia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Status de Implementação</label>
                      <select
                        value={currentPlano.status || 'PENDENTE'}
                        onChange={e => setCurrentPlano({ ...currentPlano, status: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                        <option value="CONCLUIDO">CONCLUÍDO</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Avaliação de Eficácia (PDCA - Check)</label>
                      <select
                        value={currentPlano.eficacia || 'PENDENTE'}
                        onChange={e => setCurrentPlano({ ...currentPlano, eficacia: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="PENDENTE">⏳ A Avaliar</option>
                        <option value="EFICAZ">✅ Eficaz (Meta atingida no ciclo seguinte)</option>
                        <option value="INEFICAZ">❌ Ineficaz (Requer novo plano de ação)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      Evidência Objetiva de Eficácia (Auditoria ONA)
                    </label>
                    <textarea
                      rows={3}
                      value={currentPlano.evidencia_eficacia || ''}
                      onChange={e => setCurrentPlano({ ...currentPlano, evidencia_eficacia: e.target.value })}
                      placeholder="Ex: Resultado do indicador retornou à meta em 11/2026. Adesão da equipe ao checklist atingiu 98% comprovada em auditoria interna."
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com Botões */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setModalMode(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarPlanoModal}
                style={{ padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Salvar Plano (5W2H)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO COMPLETA (FICHA 5W2H) */}
      {viewingPlano && (
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ficha 5W2H & Análise ONA</h3>
              <button onClick={() => setViewingPlano(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>{viewingPlano.indicador?.setor?.nome || 'Geral'}</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#0f172a' }}>{viewingPlano.indicador?.nome}</h2>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 700, background: getGutClassificacao(viewingPlano.score_gut).bg, color: getGutClassificacao(viewingPlano.score_gut).color }}>
                  Prioridade GUT: {viewingPlano.score_gut || 27} ({getGutClassificacao(viewingPlano.score_gut).label})
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 700, background: '#f1f5f9', color: '#334155' }}>
                  Status: {viewingPlano.status}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 700, background: viewingPlano.eficacia === 'EFICAZ' ? '#dcfce7' : '#f1f5f9', color: viewingPlano.eficacia === 'EFICAZ' ? '#15803d' : '#64748b' }}>
                  Eficácia: {viewingPlano.eficacia || 'PENDENTE'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Análise Crítica / Causa Raiz:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#334155' }}>{viewingPlano.justificativa}</p>
              </div>

              <div style={{
                background: '#f1f5f9',
                padding: '12px',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}>
                <div><strong>What (O que):</strong> {viewingPlano.what_acao || viewingPlano.plano_acao}</div>
                <div><strong>Why (Por quê):</strong> {viewingPlano.why_motivo || viewingPlano.justificativa}</div>
                <div><strong>Where (Onde):</strong> {viewingPlano.where_local || viewingPlano.indicador?.setor?.nome || 'Geral'}</div>
                <div><strong>Who (Quem):</strong> {viewingPlano.who_responsavel || viewingPlano.responsavel || '-'}</div>
                <div><strong>When (Quando):</strong> {viewingPlano.when_prazo || viewingPlano.prazo || '-'}</div>
                <div><strong>How (Como):</strong> {viewingPlano.how_metodo || 'Procedimento Operacional'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>How Much (Quanto):</strong> {viewingPlano.how_much_custo || 'Recursos Internos'}</div>
              </div>

              {viewingPlano.evidencia_eficacia && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', color: '#166534' }}>
                  <strong>Evidência Comprovada de Eficácia:</strong> {viewingPlano.evidencia_eficacia}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button onClick={() => setViewingPlano(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
