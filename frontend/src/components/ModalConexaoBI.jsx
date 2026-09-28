import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Database } from 'lucide-react';

export default function ModalConexaoBI({ onClose }) {
  const [formData, setFormData] = useState({
    nome: 'SPDATA BI',
    host: '127.0.0.1',
    porta: 3050,
    caminho: 'C:\\Bancos\\SPDATA.FDB',
    usuario: 'SYSDBA',
    senha: 'masterkey'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConexao();
  }, []);

  const fetchConexao = async () => {
    try {
      const res = await axios.get('/api/conexoes');
      if (res.data && res.data.id) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

    const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await axios.post('/api/conexoes/teste', formData);
      alert(res.data.message || 'Conexão estabelecida com sucesso!');
    } catch (err) {
      alert('Falha na conexão:\n' + (err.response?.data?.error || err.message));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post('/api/conexoes', formData);
      alert('Conexão salva com sucesso!');
      onClose();
    } catch (err) {
      alert('Erro ao salvar conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem' }}>
            <Database size={24} className="text-primary" /> Conexão do Motor BI (Firebird)
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Nome da Conexão</label>
            <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Host / IP</label>
              <input type="text" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Porta</label>
              <input type="number" value={formData.porta} onChange={(e) => setFormData({...formData, porta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Caminho do Arquivo (.FDB)</label>
            <input type="text" value={formData.caminho} onChange={(e) => setFormData({...formData, caminho: e.target.value})} placeholder="Ex: C:\banco\SGHDADOS.FDB" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Usuário (Read-Only)</label>
              <input type="text" value={formData.usuario} onChange={(e) => setFormData({...formData, usuario: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Senha</label>
              <input type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
          </div>
        </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleTest} disabled={testing} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>{testing ? 'Testando...' : 'Testar Conexão'}</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            <button onClick={handleSave} disabled={loading} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Conexão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
