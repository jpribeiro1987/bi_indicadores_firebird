import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Search, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busca, setBusca] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/config/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (filtroTipo === 'AUDITORIA' && l.tipo !== 'AUDITORIA') return false;
    if (filtroTipo === 'SYNC' && l.tipo === 'AUDITORIA') return false;
    if (filtroTipo === 'FALHAS' && l.sucesso !== false) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const match = (l.detalhes || '').toLowerCase().includes(q) || (l.tipo || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const exportarXls = () => {
    if (filteredLogs.length === 0) return alert('Nenhum log para exportar.');
    const rows = filteredLogs.map(l => ({
      DATA_HORA: new Date(l.data).toLocaleString('pt-BR'),
      GATILHO: l.tipo,
      STATUS: l.sucesso ? 'SUCESSO' : 'FALHA',
      DETALHES: l.detalhes || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs_Auditoria');
    XLSX.writeFile(wb, `Logs_Auditoria_${new Date().toISOString().split('T')[0]}.xls`, { bookType: 'biff8' });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="var(--primary)" />
          <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Logs de Sincronização e Auditoria (BI)</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button onClick={exportarXls} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
            <Download size={14} /> Exportar XLS
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', background: 'var(--panel-bg)', padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar nos detalhes ou gatilho..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'SYNC', label: 'Sincronizações' },
            { id: 'AUDITORIA', label: 'Auditoria' },
            { id: 'FALHAS', label: '⚠️ Apenas Falhas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: filtroTipo === tab.id ? 'var(--primary)' : 'var(--panel-bg)',
                color: filtroTipo === tab.id ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px' }}>
        {loading ? (
          <div>Carregando logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div>Nenhum log registrado para este filtro.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px' }}>Data / Hora</th>
                <th style={{ padding: '12px 8px' }}>Gatilho</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>
                    {new Date(log.data).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      background: log.tipo === 'AUTOMATICO' ? '#3b82f620' : log.tipo === 'AUDITORIA' ? '#f59e0b20' : '#8b5cf620',
                      color: log.tipo === 'AUTOMATICO' ? '#3b82f6' : log.tipo === 'AUDITORIA' ? '#f59e0b' : '#8b5cf6',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {log.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {log.sucesso ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>Sucesso</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Falha</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {log.detalhes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
