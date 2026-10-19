const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { syncBiData } = require('../services/alertJob');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      include: {
        indicadores: {
          where: { indicador: { ativo: true } },
          include: { indicador: { include: { metas: true } } }
        },
        layouts: true
      }
    });
    res.json(dashboards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dashboards' });
  }
});

// Forçar sincronização imediata do BI (opcionalmente filtrando pelo setor selecionado)
router.post('/sync', async (req, res) => {
  try {
    const { setorId } = req.body || {};
    // Roda a rotina de sync em background (não aguarda para não dar timeout caso seja longo)
    syncBiData('MANUAL', setorId);
    res.json({ success: true, message: 'Sincronização iniciada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao disparar sincronização' });
  }
});

// Salvar posições do grid
router.put('/:id/layout', async (req, res) => {
  try {
    const { id } = req.params;
    const { layout, setorId } = req.body;

    const parsedSetorId = setorId === 'ALL' || !setorId ? null : parseInt(setorId);

    
    if (parsedSetorId === null) {
      const existing = await prisma.dashboardLayout.findFirst({ where: { dashboardId: parseInt(id), setorId: null } });
      if (existing) {
        await prisma.dashboardLayout.update({ where: { id: existing.id }, data: { layout_json: JSON.stringify(layout) } });
      } else {
        await prisma.dashboardLayout.create({ data: { dashboardId: parseInt(id), setorId: null, layout_json: JSON.stringify(layout) } });
      }
    } else {
      const existing = await prisma.dashboardLayout.findFirst({ where: { dashboardId: parseInt(id), setorId: parsedSetorId } });
      if (existing) {
        await prisma.dashboardLayout.update({ where: { id: existing.id }, data: { layout_json: JSON.stringify(layout) } });
      } else {
        await prisma.dashboardLayout.create({ data: { dashboardId: parseInt(id), setorId: parsedSetorId, layout_json: JSON.stringify(layout) } });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar layout' });
  }
});

module.exports = router;