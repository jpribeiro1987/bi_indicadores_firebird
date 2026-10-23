const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { executeWithCache } = require('../services/redisService');
const { prepareQuery } = require('../services/firebirdService');
const { sendPendingActionPlansEmail } = require('../services/alertJob');
const router = express.Router();
const prisma = new PrismaClient();

async function registrarAuditoria(detalhes) {
  try {
    await prisma.logSincronizacao.create({
      data: {
        tipo: 'AUDITORIA',
        sucesso: true,
        detalhes: detalhes.substring(0, 2000)
      }
    });
  } catch (e) {}
}

// Listar todos os planos de ação (Central SGQ)
router.get('/planos-acao/todos', async (req, res) => {
  try {
    const planos = await prisma.planoAcaoIndicador.findMany({
      include: {
        indicador: {
          include: { setor: true }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
    res.json(planos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar central de planos de ação' });
  }
});

// Exportar backup de todos os indicadores em JSON
router.get('/exportar-json', async (req, res) => {
  try {
    const indicadores = await prisma.indicador.findMany({
      include: { metas: true, setor: true },
      orderBy: { id: 'asc' }
    });
    res.json(indicadores);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar indicadores' });
  }
});

// Importar backup de indicadores via JSON
router.post('/importar-json', async (req, res) => {
  try {
    const { indicadores } = req.body;
    if (!Array.isArray(indicadores)) {
      return res.status(400).json({ error: 'Formato de arquivo inválido.' });
    }

    let defaultDash = await prisma.dashboard.findFirst({ where: { nome: 'Painel Geral' } });
    if (!defaultDash) {
      defaultDash = await prisma.dashboard.create({ data: { nome: 'Painel Geral' } });
    }

    let importados = 0;
    for (const item of indicadores) {
      if (!item.nome || !item.query_sql) continue;
      const metasData = Array.isArray(item.metas) ? item.metas.map(m => ({
        descricao: m.descricao || '',
        valor_alvo: parseFloat(String(m.valor_alvo).replace(',', '.')) || 0,
        competencia: m.competencia || null,
        data_limite: m.data_limite ? new Date(m.data_limite) : null
      })) : [];

      const novo = await prisma.indicador.create({
        data: {
          codigo: item.codigo || '',
          nome: item.nome,
          descricao: item.descricao || '',
          desc_formula: item.desc_formula || '',
          fonte_referencia: item.fonte_referencia || '',
          categoria: item.categoria || '',
          subcategoria: item.subcategoria || '',
          unidade_medida: item.unidade_medida || '',
          orientacao: item.orientacao || '',
          frequencia: item.frequencia || '',
          setorId: item.setorId ? parseInt(item.setorId) : null,
          peso: item.peso ? parseFloat(item.peso) : null,
          ativo: item.ativo !== undefined ? item.ativo : true,
          tipo_consulta: item.tipo_consulta || 'SQL',
          conexaoId: item.conexaoId ? parseInt(item.conexaoId) : null,
          query_sql: item.query_sql,
          tipo_grafico: item.tipo_grafico || 'BAR',
          coluna_x: item.coluna_x || '',
          coluna_y: item.coluna_y || '',
          dias_alerta: item.dias_alerta ? parseInt(item.dias_alerta) : null,
          metas: { create: metasData }
        }
      });

      const lastItem = await prisma.dashboardIndicador.findFirst({
        where: { dashboardId: defaultDash.id },
        orderBy: { pos_y: 'desc' }
      });
      const newY = lastItem ? lastItem.pos_y + lastItem.altura : 0;

      await prisma.dashboardIndicador.create({
        data: {
          dashboardId: defaultDash.id,
          indicadorId: novo.id,
          pos_x: 0,
          pos_y: newY,
          largura: 6,
          altura: 12
        }
      });
      importados++;
    }

    await registrarAuditoria(`[Backup JSON] ${importados} indicador(es) importado(s) com sucesso.`);
    res.json({ success: true, importados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao importar indicadores: ' + error.message });
  }
});

// Notificar por e-mail sobre planos de ação pendentes ou vencidos (SGQ)
router.post('/planos-acao/notificar-email', async (req, res) => {
  try {
    const { setorId } = req.body || {};
    const result = await sendPendingActionPlansEmail(setorId);
    await registrarAuditoria(`[SGQ] E-mail de cobrança de Planos de Ação disparado (${result.count || 0} plano(s)).`);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar notificação: ' + error.message });
  }
});

// Listar todos os indicadores
router.get('/', async (req, res) => {
  try {
    const indicadores = await prisma.indicador.findMany({
      include: {
        metas: true,
        planosAcao: { orderBy: { criado_em: 'desc' } },
        cache: { select: { atualizado_em: true, duracao_ms: true } }
      },
      orderBy: [{ ordem: 'asc' }, { id: 'desc' }]
    });
    res.json(indicadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar indicadores' });
  }
});

// Alterar rapidamente a ordem de exibição de um indicador
router.patch('/:id/ordem', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { ordem } = req.body;
    const atualizado = await prisma.indicador.update({
      where: { id },
      data: { ordem: parseInt(ordem) || 0 }
    });
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar ordem do indicador' });
  }
});

// Deletar indicador
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ind = await prisma.indicador.findUnique({ where: { id } });
    await prisma.dashboardIndicador.deleteMany({ where: { indicadorId: id } });
    await prisma.indicador.delete({ where: { id } });
    await registrarAuditoria(`[Auditoria] Indicador excluído: "${ind ? ind.nome : id}"`);
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
    
    const metasData = Array.isArray(data.metas) ? data.metas.map(m => ({
      descricao: m.descricao || '',
      valor_alvo: parseFloat(String(m.valor_alvo).replace(',', '.')) || 0,
      competencia: m.competencia || null,
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
        ordem: data.ordem !== undefined && data.ordem !== '' ? parseInt(data.ordem) : 0,
        tolerancia: data.tolerancia !== undefined && data.tolerancia !== '' ? parseFloat(String(data.tolerancia).replace(',', '.')) : 5,
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

    await registrarAuditoria(`[Auditoria] Novo indicador criado: "${indicador.nome}" (Código: ${indicador.codigo || '-'})`);
    res.json(indicador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar indicador' });
  }
});

// Duplicar / Clonar indicador
router.post('/:id/duplicar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const original = await prisma.indicador.findUnique({
      where: { id },
      include: { metas: true }
    });
    if (!original) return res.status(404).json({ error: 'Indicador original não encontrado' });

    const clone = await prisma.indicador.create({
      data: {
        codigo: original.codigo ? `${original.codigo}_COPIA` : '',
        nome: `${original.nome} (Cópia)`,
        descricao: original.descricao,
        desc_formula: original.desc_formula,
        fonte_referencia: original.fonte_referencia,
        categoria: original.categoria,
        subcategoria: original.subcategoria,
        unidade_medida: original.unidade_medida,
        orientacao: original.orientacao,
        frequencia: original.frequencia,
        setorId: original.setorId,
        peso: original.peso,
        ativo: original.ativo,
        tipo_consulta: original.tipo_consulta,
        conexaoId: original.conexaoId,
        query_sql: original.query_sql,
        tipo_grafico: original.tipo_grafico,
        coluna_x: original.coluna_x,
        coluna_y: original.coluna_y,
        dias_alerta: original.dias_alerta,
        metas: {
          create: (original.metas || []).map(m => ({
            descricao: m.descricao,
            valor_alvo: m.valor_alvo,
            competencia: m.competencia,
            data_limite: m.data_limite
          }))
        }
      },
      include: { metas: true }
    });

    let defaultDash = await prisma.dashboard.findFirst({ where: { nome: 'Painel Geral' } });
    if (!defaultDash) {
      defaultDash = await prisma.dashboard.create({ data: { nome: 'Painel Geral' } });
    }
    const lastItem = await prisma.dashboardIndicador.findFirst({
      where: { dashboardId: defaultDash.id },
      orderBy: { pos_y: 'desc' }
    });
    const newY = lastItem ? lastItem.pos_y + lastItem.altura : 0;

    await prisma.dashboardIndicador.create({
      data: {
        dashboardId: defaultDash.id,
        indicadorId: clone.id,
        pos_x: 0,
        pos_y: newY,
        largura: 6,
        altura: 12
      }
    });

    await registrarAuditoria(`[Auditoria] Indicador duplicado: "${original.nome}" -> "${clone.nome}"`);
    res.json(clone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao duplicar indicador' });
  }
});

// Atualizar indicador
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.indicador.findUnique({ where: { id } });
    let historicoList = [];
    if (existing && existing.historico_sql) {
      try { historicoList = JSON.parse(existing.historico_sql); } catch (e) {}
    }
    if (existing && existing.query_sql && data.query_sql && existing.query_sql.trim() !== data.query_sql.trim()) {
      historicoList.unshift({
        data: new Date().toISOString(),
        sql: existing.query_sql
      });
      historicoList = historicoList.slice(0, 10);
    }
    
    const metasData = Array.isArray(data.metas) ? data.metas.map(m => ({
      descricao: m.descricao || '',
      valor_alvo: parseFloat(String(m.valor_alvo).replace(',', '.')) || 0,
      competencia: m.competencia || null,
      data_limite: m.data_limite ? new Date(m.data_limite) : null
    })) : [];

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
        ordem: data.ordem !== undefined && data.ordem !== '' ? parseInt(data.ordem) : 0,
        tolerancia: data.tolerancia !== undefined && data.tolerancia !== '' ? parseFloat(String(data.tolerancia).replace(',', '.')) : 5,
        historico_sql: JSON.stringify(historicoList),
        metas: {
          create: metasData
        }
      },
      include: { metas: true }
    });
    await registrarAuditoria(`[Auditoria] Indicador editado: "${indicador.nome}" (ID: ${indicador.id})`);
    res.json(indicador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar indicador' });
  }
});

// Testar query (retorna dados em JSON + tempo de execução no header)
router.post('/testar', async (req, res) => {
  try {
    const startMs = Date.now();
    const { query_sql, conexaoId, startDate, endDate } = req.body;
    const safeSql = prepareQuery(query_sql, { startDate, endDate });
    
    let conexao;
    if (conexaoId) {
      conexao = await prisma.conexaoBanco.findUnique({ where: { id: parseInt(conexaoId) } });
    } else {
      conexao = await prisma.conexaoBanco.findFirst();
    }
    
    if (!conexao) return res.status(404).json({ error: 'Nenhuma conexão com banco SPDATA cadastrada.' });

    const result = await executeWithCache(conexao, safeSql, 60, { startDate, endDate });
    const durationMs = Date.now() - startMs;
    res.set('x-query-duration-ms', String(durationMs));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erro ao executar SQL no Firebird.' });
  }
});

// Executar indicador já salvo (usado pelo Grid Layout e atualização individual)
router.get('/:id/executar', async (req, res) => {
  try {
    const { force, startDate, endDate } = req.query;
    const indicador = await prisma.indicador.findUnique({ 
      where: { id: parseInt(req.params.id) },
      include: { cache: true }
    });
    if (!indicador) return res.status(404).json({ error: 'Indicador não encontrado' });

    const usesDynamicDates = /:(DATA_INICIO|DATA_FIM)\b/i.test(indicador.query_sql || '');
    const forceRefresh = force === 'true' || (usesDynamicDates && (startDate || endDate));

    let result;
    if (!forceRefresh && indicador.cache && indicador.cache.dados_json) {
      result = JSON.parse(indicador.cache.dados_json);
    } else {
      const conexao = indicador.conexaoId
        ? await prisma.conexaoBanco.findUnique({ where: { id: indicador.conexaoId } })
        : await prisma.conexaoBanco.findFirst();
      if (!conexao) return res.status(404).json({ error: 'Sem conexões cadastradas' });

      const execStartMs = Date.now();
      result = await executeWithCache(conexao, indicador.query_sql, 1, { startDate, endDate });
      const execDurationMs = Date.now() - execStartMs;
      await prisma.cacheIndicador.upsert({
        where: { indicadorId: indicador.id },
        update: { dados_json: JSON.stringify(result), duracao_ms: execDurationMs, atualizado_em: new Date() },
        create: { indicadorId: indicador.id, dados_json: JSON.stringify(result), duracao_ms: execDurationMs }
      });
    }

    res.json({
      config: {
        tipo_grafico: indicador.tipo_grafico,
        coluna_x: indicador.coluna_x,
        coluna_y: indicador.coluna_y,
        unidade_medida: indicador.unidade_medida
      },
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

// --- PLANOS DE AÇÃO / JUSTIFICATIVAS ---
router.get('/:id/planos-acao', async (req, res) => {
  try {
    const planos = await prisma.planoAcaoIndicador.findMany({
      where: { indicadorId: parseInt(req.params.id) },
      orderBy: { criado_em: 'desc' }
    });
    res.json(planos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar planos de ação' });
  }
});

router.post('/:id/planos-acao', async (req, res) => {
  try {
    const indicadorId = parseInt(req.params.id);
    const { competencia, valor_obtido, meta_esperada, justificativa, plano_acao, responsavel, prazo, status } = req.body;
    const novo = await prisma.planoAcaoIndicador.create({
      data: {
        indicadorId,
        competencia: competencia || null,
        valor_obtido: valor_obtido !== undefined && valor_obtido !== '' ? parseFloat(String(valor_obtido).replace(',', '.')) : null,
        meta_esperada: meta_esperada !== undefined && meta_esperada !== '' ? parseFloat(String(meta_esperada).replace(',', '.')) : null,
        justificativa: justificativa || '',
        plano_acao: plano_acao || '',
        responsavel: responsavel || '',
        prazo: prazo || '',
        status: status || 'PENDENTE'
      }
    });
    await registrarAuditoria(`[SGQ] Plano de Ação registrado para o indicador ID ${indicadorId} (Competência: ${competencia || '-'})`);
    res.json(novo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar plano de ação' });
  }
});

router.put('/planos-acao/:planoId', async (req, res) => {
  try {
    const id = parseInt(req.params.planoId);
    const { competencia, status, justificativa, plano_acao, responsavel, prazo } = req.body;
    const atualizado = await prisma.planoAcaoIndicador.update({
      where: { id },
      data: {
        ...(competencia !== undefined ? { competencia } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(justificativa !== undefined ? { justificativa } : {}),
        ...(plano_acao !== undefined ? { plano_acao } : {}),
        ...(responsavel !== undefined ? { responsavel } : {}),
        ...(prazo !== undefined ? { prazo } : {})
      }
    });
    await registrarAuditoria(`[SGQ] Plano de Ação ID ${id} atualizado (Status: ${atualizado.status})`);
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar plano de ação' });
  }
});

router.delete('/planos-acao/:planoId', async (req, res) => {
  try {
    await prisma.planoAcaoIndicador.delete({ where: { id: parseInt(req.params.planoId) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover plano de ação' });
  }
});

module.exports = router;
