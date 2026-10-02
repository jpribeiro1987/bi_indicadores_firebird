const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

// 1. Calculate uniqueUnits
if (!code.includes('const uniqueUnits =')) {
  code = code.replace(
    `const [formData, setFormData] = useState(initialForm);`,
    `const [formData, setFormData] = useState(initialForm);
  const uniqueUnits = [...new Set(['%', 'R$', 'Qtd', 'h', 'dias', ...indicadores.map(i => i.unidade_medida).filter(Boolean)])];`
  );
}

// 2. Replace the first "Unidade de Medida" selector with the datalist input
const firstSelectStr = `                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Unidade de Medida</label>
                    <select name="unidade_medida" value={formData.unidade_medida} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="">Select...</option>
                      <option value="%">%</option>
                      <option value="Qtd">Quantidade</option>
                      <option value="R$">Financeiro (R$)</option>
                    </select>
                  </div>`;

const datalistInputStr = `                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Unidade de Medida</label>
                    <input list="units-list" name="unidade_medida" value={formData.unidade_medida || ''} onChange={handleChange} placeholder="Selecione ou digite..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <datalist id="units-list">
                      {uniqueUnits.map((u, i) => <option key={i} value={u} />)}
                    </datalist>
                  </div>`;

code = code.replace(firstSelectStr, datalistInputStr);

// 3. Remove the second "Unidade de Medida" (the one I added earlier)
const secondGridStr = `                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                </div>`;

const pesoStr = `                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Peso</label>
                  <input type="number" name="peso" value={formData.peso} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>`;

code = code.replace(secondGridStr, pesoStr);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
