const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const { scheduleBiSyncJob } = require('../services/alertJob');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get SMTP config
router.get('/smtp', async (req, res) => {
  try {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] } }
    });
    const smtp = {};
    configs.forEach(c => { smtp[c.chave] = c.valor; });

    res.json({
      SMTP_HOST: smtp.SMTP_HOST || '',
      SMTP_PORT: smtp.SMTP_PORT || '587',
      SMTP_USER: smtp.SMTP_USER || '',
      SMTP_PASS: smtp.SMTP_PASS || '',
      SMTP_FROM: smtp.SMTP_FROM || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações SMTP do banco' });
  }
});

// Save SMTP config
router.post('/smtp', async (req, res) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = req.body;

  try {
    const data = { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM };
    for (const key of Object.keys(data)) {
      if (data[key] !== undefined) {
        await prisma.configuracao.upsert({
          where: { chave: key },
          update: { valor: String(data[key]) },
          create: { chave: key, valor: String(data[key]) }
        });
      }
    }
    res.json({ success: true, message: 'Configurações SMTP salvas com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar configurações SMTP no banco' });
  }
});

// Test SMTP config
router.post('/smtp/test', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail de destino não fornecido' });
  }

  try {
    const result = await sendEmail(
      email,
      'Teste de Configuração SMTP - Sistema de Indicadores Hospitalar',
      '<h2>Sucesso!</h2><p>Sua configuração de SMTP está funcionando corretamente para o disparo de resumos e cobranças de pendências (SGQ).</p>'
    );

    if (result && result.success) {
      res.json({ success: true, message: 'E-mail de teste enviado com sucesso!' });
    } else {
      res.status(400).json({ error: (result && result.error) || 'Falha ao enviar e-mail. Verifique os dados de SMTP.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro de conexão SMTP: ' + error.message });
  }
});

// Get general configurations
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.configuracao.findMany();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.chave] = c.valor;
    });
    res.json(configMap);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Update general configurations
router.put('/', async (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);

    for (const key of keys) {
      await prisma.configuracao.upsert({
        where: { chave: key },
        update: { valor: String(data[key]) },
        create: { chave: key, valor: String(data[key]) }
      });
    }

    if (data.BI_SYNC_SCHEDULES !== undefined) {
      await scheduleBiSyncJob(String(data.BI_SYNC_SCHEDULES));
    }

    res.json({ message: 'Configurações atualizadas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

router.post('/', async (req, res) => {
  try {
    for (const key of Object.keys(req.body)) {
      await prisma.configuracao.upsert({
        where: { chave: key },
        update: { valor: String(req.body[key]) },
        create: { chave: key, valor: String(req.body[key]) }
      });
    }
    if (req.body.BI_SYNC_SCHEDULES !== undefined) {
      await scheduleBiSyncJob(String(req.body.BI_SYNC_SCHEDULES));
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.logSincronizacao.findMany({
      orderBy: { data: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

module.exports = router;
