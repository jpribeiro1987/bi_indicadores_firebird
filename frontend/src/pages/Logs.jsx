import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const fetchLogs = async () => {
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
    if (filtroTipo === 'TODOS') return true;
    if (filtroTipo === 'AUDITORIA') return l.tipo === 'AUDITORIA';
    return l.tipo !== 'AUDITORIA';
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="var(--primary)" />
          <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Logs de Sincronização e Auditoria (BI)</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'SYNC', label: 'Sincronizações' },
            { id: 'AUDITORIA', label: 'Auditoria' }
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
