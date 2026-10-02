const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Listar todas as categorias e suas subcategorias
router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoriaIndicador.findMany({
      include: { subcategorias: true },
      orderBy: { nome: 'asc' }
    });
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Criar nova categoria
router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    const categoria = await prisma.categoriaIndicador.create({
      data: { nome }
    });
    res.json(categoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Deletar categoria
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.subcategoriaIndicador.deleteMany({ where: { categoriaId: id }});
    await prisma.categoriaIndicador.delete({ where: { id }});
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// Criar nova subcategoria
router.post('/:id/subcategorias', async (req, res) => {
  try {
    const { nome } = req.body;
    const categoriaId = parseInt(req.params.id);
    const subcategoria = await prisma.subcategoriaIndicador.create({
      data: { nome, categoriaId }
    });
    res.json(subcategoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar subcategoria' });
  }
});

// Deletar subcategoria
router.delete('/:id/subcategorias/:subId', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    await prisma.subcategoriaIndicador.delete({ where: { id: subId }});
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar subcategoria' });
  }
});

module.exports = router;
