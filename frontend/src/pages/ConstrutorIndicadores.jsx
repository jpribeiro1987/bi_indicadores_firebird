import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Play, AlertCircle, CheckCircle2, ChevronLeft, Plus, Trash2, Edit2, Settings, Database } from 'lucide-react';
import ModalGerenciarCategorias from '../components/ModalGerenciarCategorias';
import ModalConexaoBI from '../components/ModalConexaoBI';

export default function ConstrutorIndicadores({ userRole, userSectors = [] }) {
  const [indicadores, setIndicadores] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [showBIModal, setShowBIModal] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [conexoes, setConexoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [categoriasList, setCategoriasList] = useState([]);
  
  const initialForm = {
    codigo: '', nome: '', descricao: '', desc_formula: '', fonte_referencia: '',
    categoria: '', subcategoria: '', unidade_medida: '', orientacao: '',
    frequencia: '', setorId: '', peso: '', ativo: true,
    tipo_consulta: 'SQL', conexaoId: '', query_sql: '', tipo_grafico: 'BAR',
    coluna_x: '', coluna_y: '', dias_alerta: '', metas: []
  };

  const [formData, setFormData] = useState(initialForm);
  const uniqueUnits = [...new Set(['%', 'R$', 'Qtd', 'h', 'dias', ...indicadores.map(i => i.unidade_medida).filter(Boolean)])];
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIndicadores();
    fetchConexoes();
    fetchSetores();
    fetchCategoriasList();
  }, [userRole, userSectors]);

  const fetchCategoriasList = async () => {
    try {
      const res = await axios.get('/api/categorias');
      setCategoriasList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSetores = async () => {
    try {
      const res = await axios.get('/api/setores');
      setSetores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIndicadores = async () => {
    try {
      const res = await axios.get('/api/indicadores');
      const inds = res.data.filter(ind => 
        userRole === 'ADMIN' || !ind.setorId || userSectors.includes(ind.setorId)
      );
      setIndicadores(inds);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConexoes = async () => {
    try {
      const res = await axios.get('/api/conexoes');
      if (res.data && res.data.id) {
        setConexoes([res.data]);
        setFormData(f => ({...f, conexaoId: res.data.id}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const addMeta = () => {
    setFormData({ ...formData, metas: [...formData.metas, { descricao: '', valor_alvo: '', data_limite: '' }] });
  };

  const updateMeta = (index, field, value) => {
    const newMetas = [...formData.metas];
    newMetas[index][field] = value;
    setFormData({ ...formData, metas: newMetas });
  };

  const removeMeta = (index) => {
    setFormData({ ...formData, metas: formData.metas.filter((_, i) => i !== index) });
  };

  const testarQuery = async () => {
    setLoading(true); setError(null); setTestResult(null);
    try {
      const res = await axios.post('/api/indicadores/testar', { query_sql: formData.query_sql, conexaoId: formData.conexaoId });
      setTestResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarIndicador = async () => {
    if (!formData.nome) return alert('Nome do Indicador é obrigatório!');
    setLoading(true);
    try {
      if (formData.id) {
        await axios.put('/api/indicadores/' + formData.id, formData);
        alert('Indicador atualizado com sucesso!');
      } else {
        await axios.post('/api/indicadores', formData);
        alert('Indicador salvo com sucesso!');
      }
      setIsFormOpen(false);
      setFormData(initialForm);
      fetchIndicadores();
    } catch (err) {
      alert('Erro ao salvar indicador');
    } finally {
      setLoading(false);
    }
  };

  const deletarIndicador = async (id) => {
    if(!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await axios.delete('/api/indicadores/' + id);
      fetchIndicadores();
    } catch(err) {
      alert('Erro ao deletar');
    }
  };

  const editarIndicador = (ind) => {
    const formattedMetas = (ind.metas || []).map(m => ({
      ...m,
      data_limite: m.data_limite ? m.data_limite.substring(0, 10) : ''
    }));
    
    setFormData({
      ...initialForm,
      ...ind,
      metas: formattedMetas
    });
    setIsFormOpen(true);
  };

  if (!isFormOpen) {
    return (<><div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Construtor de BI</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Crie e gerencie indicadores personalizados</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowBIModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: 'pointer' }}>
              <Database size={16} /> Conexão BI
            </button>
            <button onClick={() => setIsCatModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: 'pointer' }}>
              <Settings size={16} /> Categorias
            </button>
            <button onClick={() => { setFormData(initialForm); setIsFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              <Plus size={16} /> Novo Indicador
            </button>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', color: '#475569' }}>Código</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#475569' }}>Nome</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#475569' }}>Categoria</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#475569' }}>Ativo</th>
                <th style={{ padding: '16px', textAlign: 'right', color: '#475569' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map(ind => (
                <tr key={ind.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', color: '#334155' }}>{ind.codigo || '-'}</td>
                  <td style={{ padding: '16px', color: '#334155', fontWeight: 'bold' }}>{ind.nome}</td>
                  <td style={{ padding: '16px', color: '#334155' }}>{ind.categoria || '-'}</td>
                  <td style={{ padding: '16px', color: '#334155' }}>{ind.ativo ? 'Sim' : 'Não'}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => editarIndicador(ind)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '8px' }} title="Editar"><Edit2 size={18}/></button>
                    <button onClick={() => deletarIndicador(ind.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Excluir"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
              {indicadores.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Nenhum indicador cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isCatModalOpen && <ModalGerenciarCategorias onClose={() => { setIsCatModalOpen(false); fetchCategoriasList(); }} />}
      {showBIModal && <ModalConexaoBI onClose={() => setShowBIModal(false)} />}
    </>
    );
  }

  return (
    <>
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => setIsFormOpen(false)} style={{ padding: '8px', marginRight: '16px', background: '#00cbb4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><ChevronLeft size={20}/></button>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>NOVO REGISTRO</h2>
      </div>
      <div style={{ background: '#fff', padding: '0', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 24px', gap: '24px' }}>
          {['performance', 'extracao', 'metas', 'status'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '16px 0', cursor: 'pointer', color: activeTab === tab ? '#333' : '#777', fontWeight: activeTab === tab ? '600' : '400', borderBottom: activeTab === tab ? '2px solid #5a67d8' : '2px solid transparent', textTransform: 'capitalize' }}>
              {tab === 'performance' ? 'Indicadores de Performance' : tab === 'extracao' ? 'Extração Automatizada' : tab}
            </div>
          ))}
        </div>
        <div style={{ padding: '24px' }}>
          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Código do Indicador</label>
                  <input name="codigo" value={formData.codigo} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Nome do Indicador</label>
                  <input name="nome" value={formData.nome} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Descrição</label>
                <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Descrição da Fórmula de Medida</label>
                <textarea name="desc_formula" value={formData.desc_formula} onChange={handleChange} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Fonte de Referência do Resultado do Indicador</label>
                <input name="fonte_referencia" value={formData.fonte_referencia} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#333', margin: 0 }}>Categoria</label>
                  <button type="button" onClick={() => setIsCatModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                    + Gerenciar Categorias
                  </button>
                </div>
                <select name="categoria" value={formData.categoria} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Selecione...</option>
                    {categoriasList.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Subcategoria</label>
                  <select name="subcategoria" value={formData.subcategoria} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Selecione...</option>
                    {categoriasList.find(c => c.nome === formData.categoria)?.subcategorias.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Unidade de Medida</label>
                  <input list="units-list" name="unidade_medida" value={formData.unidade_medida || ''} onChange={handleChange} placeholder="Selecione ou digite..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <datalist id="units-list">
                    {uniqueUnits.map((u, i) => <option key={i} value={u} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Orientação</label>
                  <select name="orientacao" value={formData.orientacao} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Select...</option>
                    <option value="Maior Melhor">Maior Melhor</option>
                    <option value="Menor Melhor">Menor Melhor</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Frequência de Apuração</label>
                  <select name="frequencia" value={formData.frequencia} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Select...</option>
                    <option value="Diário">Diário</option>
                    <option value="Mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Setor Responsável</label>
                <select name="setorId" value={formData.setorId} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">Selecione um Setor...</option>
                  {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Unidade de Medida</label>
                  <select name="unidade_medida" value={formData.unidade_medida || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Nenhuma</option>
                    <option value="%">% (Percentual)</option>
                    <option value="R$">R$ (Moeda)</option>
                    <option value="Qtd">Qtd (Quantidade)</option>
                    <option value="h">Horas</option>
                    <option value="dias">Dias</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Peso</label>
                  <input type="number" name="peso" value={formData.peso} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extracao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 8px 0', color: '#333' }}>Configuração para Query</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Tipo de Consulta</label>
                  <select name="tipo_consulta" value={formData.tipo_consulta} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="SQL">Banco de Dados (SQL)</option>
                    <option value="API">Web Service (API)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Conexão</label>
                  <select name="conexaoId" value={formData.conexaoId} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Select...</option>
                    {conexoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Consulta</label>
                <textarea name="query_sql" value={formData.query_sql} onChange={handleChange} rows={6} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Gráfico (BI Frontend)</label>
                  <select name="tipo_grafico" value={formData.tipo_grafico} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="BAR">Barras</option>
                    <option value="LINE">Linhas</option>
                    <option value="AREA">Área</option>
                    <option value="PIE">Pizza</option>
                    <option value="DONUT">Rosca (Donut)</option>
                    <option value="SCATTER">Dispersão</option>
                    <option value="TABLE">Tabela de Dados</option>
                    <option value="CARD">Card Numérico</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Coluna X</label>
                  <input name="coluna_x" value={formData.coluna_x} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Coluna Y (Valor)</label>
                  <input name="coluna_y" value={formData.coluna_y} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Limiar Crítico (Dias de Alerta)</label>
                <input type="number" name="dias_alerta" value={formData.dias_alerta} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={testarQuery} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#fff', border: '1px solid #00cbb4', color: '#00cbb4', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Play size={18} /> {loading ? 'Testando...' : 'Testar Query'}
                </button>
              </div>

              {/* Test Result View */}
              {error && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'red', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <strong>Erro:</strong> <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{error}</pre>
                </div>
              )}
              {testResult && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckCircle2 size={18} /> Executado com sucesso ({testResult.length} registros)
                  </div>
                  <pre style={{ margin: 0, overflow: 'auto', maxHeight: '200px', fontSize: '0.85rem', color: '#333' }}>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}

            </div>
          )}

          {activeTab === 'metas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 8px 0', color: '#333' }}>Metas</h3>
              
              <button onClick={addMeta} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#fff', border: '1px solid #ccc', borderRadius: '16px', cursor: 'pointer', fontSize: '0.85rem', color: '#333' }}>
                Adicionar
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {formData.metas.map((meta, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f9f9f9', padding: '12px', borderRadius: '4px', border: '1px solid #eee' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem', color: '#666' }}>Descrição</label>
                      <input value={meta.descricao} onChange={(e) => updateMeta(index, 'descricao', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: '#666' }}>Valor Alvo</label>
                      <input type="number" value={meta.valor_alvo} onChange={(e) => updateMeta(index, 'valor_alvo', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: '#666' }}>Data Limite</label>
                      <input type="date" value={meta.data_limite} onChange={(e) => updateMeta(index, 'data_limite', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <button onClick={() => removeMeta(index)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', marginTop: '16px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {formData.metas.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhuma meta adicionada.</p>}
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div>
               <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Ativo</label>
               <select name="ativo" value={formData.ativo} onChange={(e) => setFormData({...formData, ativo: e.target.value === 'true'})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                 <option value="true">Sim</option>
                 <option value="false">Não</option>
               </select>
            </div>
          )}
        </div>
        <div style={{ padding: '24px', borderTop: '1px solid #eee' }}>
          <button onClick={salvarIndicador} disabled={loading} style={{ width: '100%', padding: '14px', background: '#00cbb4', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
    {isCatModalOpen && <ModalGerenciarCategorias onClose={() => { setIsCatModalOpen(false); fetchCategoriasList(); }} />}
    {showBIModal && <ModalConexaoBI onClose={() => setShowBIModal(false)} />}
  </>);
}