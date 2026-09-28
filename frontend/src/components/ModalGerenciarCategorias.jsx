import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ModalGerenciarCategorias({ onClose }) {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaSub, setNovaSub] = useState({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get('/api/categorias');
      setCategorias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategoria = async () => {
    if (!novaCategoria.trim()) return;
    try {
      await axios.post('/api/categorias', { nome: novaCategoria });
      setNovaCategoria('');
      fetchCategorias();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar categoria');
    }
  };

  const handleDeleteCategoria = async (id) => {
    if (!confirm('Tem certeza? Isso apagará todas as subcategorias também.')) return;
    try {
      await axios.delete(`/api/categorias/${id}`);
      fetchCategorias();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir categoria');
    }
  };

  const handleAddSub = async (catId) => {
    const nome = novaSub[catId];
    if (!nome || !nome.trim()) return;
    try {
      await axios.post(`/api/categorias/${catId}/subcategorias`, { nome });
      setNovaSub({ ...novaSub, [catId]: '' });
      fetchCategorias();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar subcategoria');
    }
  };

  const handleDeleteSub = async (catId, subId) => {
    try {
      await axios.delete(`/api/categorias/${catId}/subcategorias/${subId}`);
      fetchCategorias();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir subcategoria');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Gerenciar Categorias</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Nova Categoria..."
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          />
          <button onClick={handleAddCategoria} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Adicionar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categorias.map(cat => (
            <div key={cat.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{cat.nome}</strong>
                <button onClick={() => handleDeleteCategoria(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cat.subcategorias.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text-main)' }}>{sub.nome}</span>
                    <button onClick={() => handleDeleteSub(cat.id, sub.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    value={novaSub[cat.id] || ''}
                    onChange={(e) => setNovaSub({ ...novaSub, [cat.id]: e.target.value })}
                    placeholder="Nova subcategoria..."
                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                  <button onClick={() => handleAddSub(cat.id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
