const fs = require('fs');
let code = fs.readFileSync('backend/src/app.js', 'utf8');

code = code.replace(
  `const unidadesRoutes = require('./routes/unidades');`,
  `const unidadesRoutes = require('./routes/unidades');\nconst frequenciasRoutes = require('./routes/frequencias');`
);

code = code.replace(
  `app.use('/api/unidades', unidadesRoutes);`,
  `app.use('/api/unidades', unidadesRoutes);\napp.use('/api/frequencias', frequenciasRoutes);`
);

fs.writeFileSync('backend/src/app.js', code, 'utf8');
