const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { executeWithCache } = require('../services/redisService');
const { prepareQuery } = require('../services/firebirdService');
const router = express.Router();
const prisma = new PrismaClient();

// Listar todos os indicadores
router.get('/', async (req, res) => {
  try {
    const indicadores = await prisma.indicador.findMany({
      include: { metas: true },
      orderBy: { id: 'desc' }
    });
    res.json(indicadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar indicadores' });
  }
});

// Deletar indicador
router.delete('/:id', async (req, res) => {
  try {
    // Delete from dashboard layout first
    await prisma.dashboardIndicador.deleteMany({ where: { indicadorId: parseInt(req.params.id) } });
    await prisma.indicador.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar indicador' });
  }
});

// Criar indicador
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Tratamento das metas
    const metasData = Array.isArray(data.metas) ? data.metas.map(m => ({
      descricao: m.descricao,
      valor_alvo: parseFloat(m.valor_alvo) || 0,
      data_limite: m.data_limite ? new Date(m.data_limite) : null
    })) : [];

    const indicador = await prisma.indicador.create({
      data: {
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao,
        desc_formula: data.desc_formula,
        fonte_referencia: data.fonte_referencia,
        categoria: data.categoria,
        subcategoria: data.subcategoria,
        unidade_medida: data.unidade_medida,
        orientacao: data.orientacao,
        frequencia: data.frequencia,
        setorId: data.setorId ? parseInt(data.setorId) : null,
        peso: data.peso ? parseFloat(data.peso) : null,
        ativo: data.ativo !== undefined ? data.ativo : true,
        tipo_consulta: data.tipo_consulta || 'SQL',
        conexaoId: data.conexaoId ? parseInt(data.conexaoId) : null,
        
        query_sql: data.query_sql || '',
        tipo_grafico: data.tipo_grafico || 'BAR',
        coluna_x: data.coluna_x,
        coluna_y: data.coluna_y,
        dias_alerta: data.dias_alerta ? parseInt(data.dias_alerta) : null,
        
        metas: {
          create: metasData
        }
      },
      include: { metas: true }
    });

    // Auto add to "Painel Geral"
    let defaultDash = await prisma.dashboard.findFirst({ where: { nome: 'Painel Geral' } });
    if (!defaultDash) {
      defaultDash = await prisma.dashboard.create({ data: { nome: 'Painel Geral' } });
    }
    
    // Find highest pos_y
    const lastItem = await prisma.dashboardIndicador.findFirst({
      where: { dashboardId: defaultDash.id },
      orderBy: { pos_y: 'desc' }
    });
    const newY = lastItem ? lastItem.pos_y + lastItem.altura : 0;

    await prisma.dashboardIndicador.create({
      data: {
        dashboardId: defaultDash.id,
        indicadorId: indicador.id,
        pos_x: 0,
        pos_y: newY,
        largura: 6,
          altura: 12
      }
    });

    res.json(indicador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar indicador' });
  }
});

// Atualizar indicador
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const id = parseInt(req.params.id);
    
    // Tratamento das metas
    const metasData = Array.isArray(data.metas) ? data.metas.map(m => ({
      descricao: m.descricao,
      valor_alvo: parseFloat(m.valor_alvo) || 0,
      data_limite: m.data_limite ? new Date(m.data_limite) : null
    })) : [];

    // Delete existing metas to replace them
    await prisma.metaIndicador.deleteMany({ where: { indicadorId: id } });

    const indicador = await prisma.indicador.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao,
        desc_formula: data.desc_formula,
        fonte_referencia: data.fonte_referencia,
        categoria: data.categoria,
        subcategoria: data.subcategoria,
        unidade_medida: data.unidade_medida,
        orientacao: data.orientacao,
        frequencia: data.frequencia,
        setorId: data.setorId ? parseInt(data.setorId) : null,
        peso: data.peso ? parseFloat(data.peso) : null,
        ativo: data.ativo !== undefined ? data.ativo : true,
        tipo_consulta: data.tipo_consulta || 'SQL',
        conexaoId: data.conexaoId ? parseInt(data.conexaoId) : null,
        query_sql: data.query_sql || '',
        tipo_grafico: data.tipo_grafico || 'BAR',
        coluna_x: data.coluna_x,
        coluna_y: data.coluna_y,
        dias_alerta: data.dias_alerta ? parseInt(data.dias_alerta) : null,
        metas: {
          create: metasData
        }
      }
    });
    res.json(indicador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar indicador' });
  }
});

// Testar query (retorna dados em JSON)
router.post('/testar', async (req, res) => {
  try {
    const { query_sql, conexaoId } = req.body;
    
    // Testa apenas se a sintaxe passa no filtro anti-injeção antes de rodar
    const safeSql = prepareQuery(query_sql);
    
    let conexao;
    if (conexaoId) {
      conexao = await prisma.conexaoBanco.findUnique({ where: { id: parseInt(conexaoId) } });
    } else {
      conexao = await prisma.conexaoBanco.findFirst();
    }
    
    if (!conexao) return res.status(404).json({ error: 'Nenhuma conexão com banco SPDATA cadastrada.' });

    // Testa no firebird via cache para evitar sobrecarga em testes duplos
    const result = await executeWithCache(conexao, safeSql, 60); // cache curto de 1 minuto pra testes
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erro ao executar SQL no Firebird.' });
  }
});

// Executar indicador já salvo (usado pelo Grid Layout)
router.get('/:id/executar', async (req, res) => {
  try {
    const indicador = await prisma.indicador.findUnique({ 
      where: { id: parseInt(req.params.id) },
      include: { cache: true }
    });
    if (!indicador) return res.status(404).json({ error: 'Indicador não encontrado' });

    let result;
    if (indicador.cache && indicador.cache.dados_json) {
      result = JSON.parse(indicador.cache.dados_json);
    } else {
      const conexao = await prisma.conexaoBanco.findFirst();
      if (!conexao) return res.status(404).json({ error: 'Sem conexões cadastradas' });
      result = await executeWithCache(conexao, indicador.query_sql, 1); // direct query
      // Save to cache on demand if empty
      await prisma.cacheIndicador.upsert({
        where: { indicadorId: indicador.id },
        update: { dados_json: JSON.stringify(result), atualizado_em: new Date() },
        create: { indicadorId: indicador.id, dados_json: JSON.stringify(result) }
      });
    }

    res.json({
      config: {
        tipo_grafico: indicador.tipo_grafico,
        coluna_x: indicador.coluna_x,
        coluna_y: indicador.coluna_y
      },
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
