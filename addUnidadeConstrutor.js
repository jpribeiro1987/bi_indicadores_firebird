const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

const targetStr = `              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Peso</label>
                <input type="number" name="peso" value={formData.peso} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>`;

const replacementStr = `              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            </div>`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
