import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ModalUnidadeMedida({ onClose }) {
  const [unidades, setUnidades] = useState([]);
  const [formData, setFormData] = useState({ id: null, nome: '', simbolo: '' });

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      const res = await axios.get('/api/unidades');
      setUnidades(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.simbolo) {
      alert("Preencha o nome e o símbolo");
      return;
    }
    try {
      if (formData.id) {
        await axios.put(`/api/unidades/${formData.id}`, formData);
      } else {
        await axios.post('/api/unidades', formData);
      }
      setFormData({ id: null, nome: '', simbolo: '' });
      fetchUnidades();
    } catch (err) {
      alert('Erro ao salvar unidade. Verifique se o símbolo já existe.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta unidade?')) return;
    try {
      await axios.delete(`/api/unidades/${id}`);
      fetchUnidades();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', width: '500px', borderRadius: '8px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Unidades de Medida</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X /></button>
        </div>
        
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Nome</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Percentual" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Símbolo</label>
              <input value={formData.simbolo} onChange={e => setFormData({...formData, simbolo: e.target.value})} placeholder="Ex: %" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <button onClick={handleSave} style={{ padding: '9px 16px', background: '#00cbb4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {formData.id ? 'Salvar' : 'Adicionar'}
            </button>
            {formData.id && (
              <button onClick={() => setFormData({ id: null, nome: '', simbolo: '' })} style={{ padding: '9px 16px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', color: '#666' }}>Nome</th>
                <th style={{ padding: '8px 4px', color: '#666' }}>Símbolo</th>
                <th style={{ padding: '8px 4px', width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px', color: '#333' }}>{u.nome}</td>
                  <td style={{ padding: '8px 4px', color: '#333' }}><strong>{u.simbolo}</strong></td>
                  <td style={{ padding: '8px 4px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setFormData(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr><td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Nenhuma unidade cadastrada.</td></tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
