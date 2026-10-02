const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

const targetDup = `                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

const replaceDup = `                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Peso</label>
                  <input type="number" name="peso" value={formData.peso} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>`;

code = code.replace(targetDup, replaceDup);

// Fix the Modal component rendering logic
if (!code.includes('<ModalUnidadeMedida')) {
  // Replace the FIRST occurence of the modal tag
  code = code.replace(
    /\{isCatModalOpen && <ModalGerenciarCategorias[^\}]+\}/,
    (match) => match + `\n      {isUnidadeModalOpen && <ModalUnidadeMedida onClose={() => { setIsUnidadeModalOpen(false); fetchUnidadesList(); }} />}`
  );
  
  // Replace the SECOND occurence (if there is one outside)
  code = code.replace(
    /\{isCatModalOpen && <ModalGerenciarCategorias[^\}]+\}(?!\n      \{isUnidadeModalOpen)/g,
    (match) => match + `\n      {isUnidadeModalOpen && <ModalUnidadeMedida onClose={() => { setIsUnidadeModalOpen(false); fetchUnidadesList(); }} />}`
  );
}

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
