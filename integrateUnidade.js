const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

// 1. Add import
if (!code.includes('ModalUnidadeMedida')) {
  code = code.replace(
    `import ModalGerenciarCategorias from '../components/ModalGerenciarCategorias';`,
    `import ModalGerenciarCategorias from '../components/ModalGerenciarCategorias';\nimport ModalUnidadeMedida from '../components/ModalUnidadeMedida';`
  );
}

// 2. Add state
if (!code.includes('isUnidadeModalOpen')) {
  code = code.replace(
    `const [isCatModalOpen, setIsCatModalOpen] = useState(false);`,
    `const [isCatModalOpen, setIsCatModalOpen] = useState(false);\n  const [isUnidadeModalOpen, setIsUnidadeModalOpen] = useState(false);\n  const [unidadesCadastradas, setUnidadesCadastradas] = useState([]);`
  );
}

// 3. Add fetchUnidades
if (!code.includes('fetchUnidadesList')) {
  code = code.replace(
    `const fetchCategoriasList = async () => {`,
    `const fetchUnidadesList = async () => {\n    try {\n      const res = await axios.get('/api/unidades');\n      setUnidadesCadastradas(res.data);\n    } catch (e) {}\n  };\n\n  const fetchCategoriasList = async () => {`
  );
  code = code.replace(
    `fetchCategoriasList();`,
    `fetchCategoriasList();\n    fetchUnidadesList();`
  );
}

// 4. Update the input
const inputStrRegex = /<label[^>]*>Unidade de Medida<\/label>\s*<input list="units-list"[\s\S]*?<\/datalist>/;
const inputReplacement = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#333', margin: 0 }}>Unidade de Medida</label>
                    <button type="button" onClick={() => setIsUnidadeModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                      + Gerenciar Unidades
                    </button>
                  </div>
                  <select name="unidade_medida" value={formData.unidade_medida || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">Selecione...</option>
                    {unidadesCadastradas.map(u => <option key={u.id} value={u.simbolo}>{u.nome} ({u.simbolo})</option>)}
                  </select>`;
code = code.replace(inputStrRegex, () => inputReplacement);

// 5. Add Modal Component at the bottom
code = code.replace(
  /\{isCatModalOpen && <ModalGerenciarCategorias [^>]*>\}/g,
  (match) => match + `\n      {isUnidadeModalOpen && <ModalUnidadeMedida onClose={() => { setIsUnidadeModalOpen(false); fetchUnidadesList(); }} />}`
);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
