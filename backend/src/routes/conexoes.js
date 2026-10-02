const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const conexao = await prisma.conexaoBanco.findFirst();
    res.json(conexao || {});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conexão' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    let conexao = await prisma.conexaoBanco.findFirst();
    
    if (conexao) {
      conexao = await prisma.conexaoBanco.update({
        where: { id: conexao.id },
        data: {
          nome: data.nome,
          host: data.host,
          porta: parseInt(data.porta) || 3050,
          caminho: data.caminho,
          usuario: data.usuario,
          senha: data.senha
        }
      });
    } else {
      conexao = await prisma.conexaoBanco.create({
        data: {
          nome: data.nome,
          host: data.host,
          porta: parseInt(data.porta) || 3050,
          caminho: data.caminho,
          usuario: data.usuario,
          senha: data.senha
        }
      });
    }
    res.json(conexao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar conexão' });
  }
});

const { testConnection } = require('../services/firebirdService');

router.post('/teste', async (req, res) => {
  try {
    await testConnection(req.body);
    res.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao conectar ao banco' });
  }
});

module.exports = router;
