const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      include: {
        indicadores: {
          include: { indicador: true }
        }
      }
    });

    res.json(dashboards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dashboards' });
  }
});

// Salvar posições do grid
router.put('/:id/layout', async (req, res) => {
  try {
    const { id } = req.params;
    const { layout } = req.body; // array of { indicadorId, pos_x, pos_y, largura, altura }

    for (const item of layout) {
      await prisma.dashboardIndicador.update({
        where: {
          dashboardId_indicadorId: {
            dashboardId: parseInt(id),
            indicadorId: parseInt(item.indicadorId)
          }
        },
        data: {
          pos_x: item.pos_x,
          pos_y: item.pos_y,
          largura: item.largura,
          altura: item.altura
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar layout' });
  }
});

module.exports = router;
