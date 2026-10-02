import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ModalFrequenciaApuracao({ onClose }) {
  const [frequencias, setFrequencias] = useState([]);
  const [formData, setFormData] = useState({ id: null, nome: '' });

  useEffect(() => {
    fetchFrequencias();
  }, []);

  const fetchFrequencias = async () => {
    try {
      const res = await axios.get('/api/frequencias');
      setFrequencias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.nome) {
      alert("Preencha o nome");
      return;
    }
    try {
      if (formData.id) {
        await axios.put(`/api/frequencias/${formData.id}`, formData);
      } else {
        await axios.post('/api/frequencias', formData);
      }
      setFormData({ id: null, nome: '' });
      fetchFrequencias();
    } catch (err) {
      alert('Erro ao salvar frequência. Verifique se o nome já existe.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta frequência?')) return;
    try {
      await axios.delete(`/api/frequencias/${id}`);
      fetchFrequencias();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', width: '400px', borderRadius: '8px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Frequências de Apuração</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X /></button>
        </div>
        
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Nome</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Semanal" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <button onClick={handleSave} style={{ padding: '9px 16px', background: '#00cbb4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {formData.id ? 'Salvar' : 'Adicionar'}
            </button>
            {formData.id && (
              <button onClick={() => setFormData({ id: null, nome: '' })} style={{ padding: '9px 16px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', color: '#666' }}>Nome</th>
                <th style={{ padding: '8px 4px', width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {frequencias.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px', color: '#333' }}>{f.nome}</td>
                  <td style={{ padding: '8px 4px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setFormData(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {frequencias.length === 0 && (
                <tr><td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Nenhuma frequência cadastrada.</td></tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
