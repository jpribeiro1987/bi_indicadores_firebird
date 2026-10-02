const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

const regex1 = /\{isCatModalOpen && <ModalGerenciarCategorias onClose=\{\(\) => \{ setIsCatModalOpen\(false\); fetchCategoriasList\(\); \}\n      \{isUnidadeModalOpen && <ModalUnidadeMedida onClose=\{\(\) => \{ setIsUnidadeModalOpen\(false\); fetchUnidadesList\(\); \}\} \/>\}\} \/>\}/g;

const replacer = `{isCatModalOpen && <ModalGerenciarCategorias onClose={() => { setIsCatModalOpen(false); fetchCategoriasList(); }} />}\n      {isUnidadeModalOpen && <ModalUnidadeMedida onClose={() => { setIsUnidadeModalOpen(false); fetchUnidadesList(); }} />}`;

code = code.replace(regex1, replacer);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
