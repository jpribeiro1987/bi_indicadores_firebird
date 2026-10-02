const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

if (!code.includes('searchTerm')) {
  // Add searchTerm state
  code = code.replace(
    /const \[indicadores, setIndicadores\] = useState\(\[\]\);/,
    `const [indicadores, setIndicadores] = useState([]);\n  const [searchTerm, setSearchTerm] = useState('');`
  );

  // Add filtered list calculation
  code = code.replace(
    /return \(\s*<>/,
    `const filteredIndicadores = indicadores.filter(ind => 
      ind.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (ind.codigo && ind.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ind.categoria && ind.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );\n\n  return (\n    <>`
  );

  // Add search input before the table container
  code = code.replace(
    /<div style=\{\{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba\(0,0,0,0\.05\)', overflow: 'hidden' \}\}>/g,
    `<div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Pesquisar por nome, código ou categoria..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: '10px 16px', border: '1px solid #ccc', borderRadius: '4px', width: '300px' }}
            />
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>`
  );

  // Use filtered list
  code = code.replace(
    /\{indicadores\.map\(ind => \(/g,
    `{filteredIndicadores.map(ind => (`
  );
  
  code = code.replace(
    /\{indicadores\.length === 0 && \(/g,
    `{filteredIndicadores.length === 0 && (`
  );
}

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
