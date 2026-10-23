const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const contractsRoutes = require('./routes/contracts');
const sectorsRoutes = require('./routes/sectors');
const configRoutes = require('./routes/config');
const documentosRoutes = require('./routes/documentos');
const backupRoutes = require('./routes/backup');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const alertasRoutes = require('./routes/alertas');
const ittsRouter = require('./routes/itts');
const indicadoresRoutes = require('./routes/indicadores');
const dashboardsRoutes = require('./routes/dashboards');
const conexoesRoutes = require('./routes/conexoes');
const categoriasRoutes = require('./routes/categorias');
const unidadesRoutes = require('./routes/unidades');
const frequenciasRoutes = require('./routes/frequencias');
const onaRoutes = require('./routes/ona');

app.use('/api/auth', authRoutes);
app.use('/api/setores', sectorsRoutes);
app.use('/api/contratos', contractsRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/config', configRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/itts', ittsRouter);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/conexoes', conexoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/frequencias', frequenciasRoutes);
app.use('/api/ona', onaRoutes);

// Simple healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Start background jobs
const { initJobs } = require('./services/alertJob');
initJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
