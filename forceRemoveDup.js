const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' \}\}>\s*<div>\s*<label[^>]*>Unidade de Medida<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<div>\s*<label[^>]*>Peso<\/label>\s*<input[^>]*name="peso"[^>]*\/>\s*<\/div>\s*<\/div>/g;

const replacement = `<div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Peso</label>
                  <input type="number" name="peso" value={formData.peso} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
