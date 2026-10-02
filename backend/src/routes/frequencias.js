const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Listar todas as frequências
router.get('/', async (req, res) => {
  try {
    const frequencias = await prisma.frequenciaApuracao.findMany({ orderBy: { nome: 'asc' } });
    res.json(frequencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova frequência
router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    const frequencia = await prisma.frequenciaApuracao.create({
      data: { nome }
    });
    res.json(frequencia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar frequência
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    const frequencia = await prisma.frequenciaApuracao.update({
      where: { id: parseInt(id) },
      data: { nome }
    });
    res.json(frequencia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir frequência
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.frequenciaApuracao.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Frequência excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
