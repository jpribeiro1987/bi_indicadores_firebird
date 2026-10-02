const fs = require('fs');
let code = fs.readFileSync('backend/src/app.js', 'utf8');

code = code.replace(
  `const categoriasRoutes = require('./routes/categorias');`,
  `const categoriasRoutes = require('./routes/categorias');\nconst unidadesRoutes = require('./routes/unidades');`
);

code = code.replace(
  `app.use('/api/categorias', categoriasRoutes);`,
  `app.use('/api/categorias', categoriasRoutes);\napp.use('/api/unidades', unidadesRoutes);`
);

fs.writeFileSync('backend/src/app.js', code, 'utf8');
