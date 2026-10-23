const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { syncBiData, getSyncProgress, sendUnmetTargetsSummaryEmail } = require('../services/alertJob');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      include: {
        indicadores: {
          where: { indicador: { ativo: true } },
          include: {
            indicador: {
              include: {
                setor: true,
                metas: true,
                planosAcao: { orderBy: { criado_em: 'desc' } },
                cache: { select: { atualizado_em: true, duracao_ms: true } }
              }
            }
          }
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

// Consultar progresso em tempo real da sincronização
router.get('/sync-status', (req, res) => {
  res.json(getSyncProgress());
});

// Forçar sincronização imediata do BI (opcionalmente filtrando pelo setor selecionado)
router.post('/sync', async (req, res) => {
  try {
    const { setorId } = req.body || {};
    syncBiData('MANUAL', setorId);
    res.json({ success: true, message: 'Sincronização iniciada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao disparar sincronização' });
  }
});

// Disparar resumo por e-mail dos indicadores fora da meta
router.post('/enviar-resumo-email', async (req, res) => {
  try {
    const { setorId } = req.body || {};
    const result = await sendUnmetTargetsSummaryEmail(setorId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar resumo por e-mail: ' + error.message });
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
