const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

// 1. Add import
if (!code.includes('ModalFrequenciaApuracao')) {
  code = code.replace(
    `import ModalUnidadeMedida from '../components/ModalUnidadeMedida';`,
    `import ModalUnidadeMedida from '../components/ModalUnidadeMedida';\nimport ModalFrequenciaApuracao from '../components/ModalFrequenciaApuracao';`
  );
}

// 2. Add state
if (!code.includes('isFreqModalOpen')) {
  code = code.replace(
    `const [isUnidadeModalOpen, setIsUnidadeModalOpen] = useState(false);`,
    `const [isUnidadeModalOpen, setIsUnidadeModalOpen] = useState(false);\n  const [isFreqModalOpen, setIsFreqModalOpen] = useState(false);\n  const [frequenciasCadastradas, setFrequenciasCadastradas] = useState([]);`
  );
}

// 3. Add fetch
if (!code.includes('fetchFrequenciasList')) {
  code = code.replace(
    `const fetchUnidadesList = async () => {`,
    `const fetchFrequenciasList = async () => {\n    try {\n      const res = await axios.get('/api/frequencias');\n      setFrequenciasCadastradas(res.data);\n    } catch (e) {}\n  };\n\n  const fetchUnidadesList = async () => {`
  );
  code = code.replace(
    `fetchUnidadesList();\n  };`,
    `fetchUnidadesList();\n    fetchFrequenciasList();\n  };`
  );
}

// 4. Update the select block
const freqSelectRegex = /<label[^>]*>Frequência de Apuração<\/label>\s*<select name="frequencia"[\s\S]*?<\/select>/;
const freqReplacement = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#333', margin: 0 }}>Frequência de Apuração</label>
                      <button type="button" onClick={() => setIsFreqModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                        + Gerenciar
                      </button>
                    </div>
                    <select name="frequencia" value={formData.frequencia} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="">Selecione...</option>
                      {frequenciasCadastradas.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                    </select>`;
code = code.replace(freqSelectRegex, () => freqReplacement);

// 5. Add Modal Component
if (!code.includes('<ModalFrequenciaApuracao')) {
  code = code.replace(
    /\{isUnidadeModalOpen && <ModalUnidadeMedida[^\}]+\}\s*\/>\}/g,
    (match) => match + `\n      {isFreqModalOpen && <ModalFrequenciaApuracao onClose={() => { setIsFreqModalOpen(false); fetchFrequenciasList(); }} />}`
  );
}

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
