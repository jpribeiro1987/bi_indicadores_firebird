const fs = require('fs');
let code = fs.readFileSync('backend/src/services/alertJob.js', 'utf8');

const originalCode = `const times = scheduleString.split(',').map(t => t.trim()).filter(t => t);`;
const newCode = `const times = scheduleString.split(/[,;]/).map(t => t.trim()).filter(t => t);`;

code = code.replace(originalCode, newCode);

fs.writeFileSync('backend/src/services/alertJob.js', code, 'utf8');
