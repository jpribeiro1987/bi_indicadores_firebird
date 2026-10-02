const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

const regex = /\{isUnidadeModalOpen && <ModalUnidadeMedida onClose=\{\(\) => \{ setIsUnidadeModalOpen\(false\); fetchUnidadesList\(\); \}\} \/>\}/g;
const replacement = `{isUnidadeModalOpen && <ModalUnidadeMedida onClose={() => { setIsUnidadeModalOpen(false); fetchUnidadesList(); }} />}\n      {isFreqModalOpen && <ModalFrequenciaApuracao onClose={() => { setIsFreqModalOpen(false); fetchFrequenciasList(); }} />}`;

code = code.replace(regex, replacement);
fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
