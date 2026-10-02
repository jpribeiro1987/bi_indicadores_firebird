const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Listar todas as unidades
router.get('/', async (req, res) => {
  try {
    const unidades = await prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova unidade
router.post('/', async (req, res) => {
  try {
    const { nome, simbolo } = req.body;
    const unidade = await prisma.unidadeMedida.create({
      data: { nome, simbolo }
    });
    res.json(unidade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar unidade
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, simbolo } = req.body;
    const unidade = await prisma.unidadeMedida.update({
      where: { id: parseInt(id) },
      data: { nome, simbolo }
    });
    res.json(unidade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir unidade
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.unidadeMedida.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Unidade excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
