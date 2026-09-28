import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Activity size={28} color="var(--primary)" />
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Logs de Sincronização (BI)</h1>
      </div>

      <div style={{ background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px' }}>
        {loading ? (
          <div>Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div>Nenhum log registrado ainda.</div>
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
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>
                    {new Date(log.data).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ background: log.tipo === 'AUTOMATICO' ? '#3b82f620' : '#8b5cf620', color: log.tipo === 'AUTOMATICO' ? '#3b82f6' : '#8b5cf6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
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
