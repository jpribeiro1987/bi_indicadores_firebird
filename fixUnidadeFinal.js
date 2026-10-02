const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

// 1. Calculate uniqueUnits
if (!code.includes('const uniqueUnits =')) {
  code = code.replace(
    `const [formData, setFormData] = useState(initialForm);`,
    () => `const [formData, setFormData] = useState(initialForm);\n  const uniqueUnits = [...new Set(['%', 'R$', 'Qtd', 'h', 'dias', ...indicadores.map(i => i.unidade_medida).filter(Boolean)])];`
  );
}

// 2. Find the select for unidade_medida
const selectRegex = /<label[^>]*>Unidade de Medida<\/label>\s*<select name="unidade_medida"[\s\S]*?<\/select>/;

const replacement = `<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Unidade de Medida</label>
                  <input list="units-list" name="unidade_medida" value={formData.unidade_medida || ''} onChange={handleChange} placeholder="Selecione ou digite..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <datalist id="units-list">
                    {uniqueUnits.map((u, i) => <option key={i} value={u} />)}
                  </datalist>`;

code = code.replace(selectRegex, () => replacement);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
