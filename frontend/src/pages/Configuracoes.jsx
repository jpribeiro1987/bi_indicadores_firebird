import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Clock, Download, Upload, Database } from 'lucide-react';

const Configuracoes = () => {
  const [config, setConfig] = useState({
    BI_SYNC_SCHEDULES: '06:00'
  });
    
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/config');
      setConfig({
        BI_SYNC_SCHEDULES: res.data.BI_SYNC_SCHEDULES || '06:00'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/config', config);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      window.location.href = 'http://localhost:3000/api/backup/download';
    } catch (err) {
      alert('Erro ao gerar backup');
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('ATENÇÃO: Restaurar o backup irá apagar todos os dados atuais e substituí-los pelo conteúdo do arquivo. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('backup', file);

    setRestoring(true);
    try {
      await axios.post('/api/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Sistema restaurado com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar backup. Verifique o console.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Configurações Gerais
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Gerencie configurações do BI e faça o backup do sistema.
        </p>
      </header>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--primary)" /> Automação de Cache do BI
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>
                Insira os horários em que o sistema deve consultar o banco de dados Firebird e salvar os resultados localmente no cache do BI.
                Isso acelera o carregamento dos Dashboards e reduz a carga sobre o banco principal.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Horários de Consulta (separados por vírgula)</label>
              <input 
                type="text" 
                name="BI_SYNC_SCHEDULES" 
                value={config.BI_SYNC_SCHEDULES || ''} 
                onChange={handleChange} 
                placeholder="Ex: 06:00, 12:00, 18:00"
                style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', 
                  color: 'var(--text-main)', padding: '12px', borderRadius: '6px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                background: 'var(--primary)', color: '#fff', border: 'none', 
                padding: '12px 24px', borderRadius: '8px', fontWeight: 600, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {loading ? 'Salvando...' : <><Save size={20}/> Salvar Configurações</>}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} color="var(--primary)" /> Backup do Sistema
        </h2>
        
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>
            Gere um arquivo compacto (<code>.zip</code>) com todos os dados do sistema local (BI).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            type="button"
            onClick={handleBackup}
            style={{ 
              background: 'var(--primary)', color: 'white', padding: '12px 24px', 
              border: 'none', borderRadius: '6px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={20}/> Baixar Backup Completo
          </button>
          
          <button 
            type="button"
            onClick={handleRestoreClick}
            disabled={restoring}
            style={{ 
              background: '#ef4444', color: 'white', padding: '12px 24px', 
              border: 'none', borderRadius: '6px', fontWeight: 600,
              cursor: restoring ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              opacity: restoring ? 0.7 : 1
            }}
          >
            <Upload size={20}/> {restoring ? 'Restaurando...' : 'Restaurar Backup'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".zip" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
