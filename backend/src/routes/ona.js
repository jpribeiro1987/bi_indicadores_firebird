const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

async function registrarAuditoria(detalhes) {
  try {
    await prisma.logSincronizacao.create({
      data: {
        tipo: 'AUDITORIA_ONA',
        sucesso: true,
        detalhes: detalhes.substring(0, 2000)
      }
    });
  } catch (e) {}
}

// ==========================================
// 1. GESTÃO DE INCIDENTES / EVENTOS ADVERSOS (ONA)
// ==========================================

// Listar incidentes com filtros
router.get('/incidentes', async (req, res) => {
  try {
    const { setorId, tipo_evento, status, protocolo_seguranca, search } = req.query;

    const where = {};
    if (setorId && setorId !== 'ALL') {
      where.setorId = parseInt(setorId);
    }
    if (tipo_evento && tipo_evento !== 'ALL') {
      where.tipo_evento = tipo_evento;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (protocolo_seguranca && protocolo_seguranca !== 'ALL') {
      where.protocolo_seguranca = protocolo_seguranca;
    }

    let incidentes = await prisma.incidenteOna.findMany({
      where,
      include: {
        setor: true,
        indicador: true
      },
      orderBy: { data_incidente: 'desc' }
    });

    if (search) {
      const s = search.toLowerCase();
      incidentes = incidentes.filter(inc => 
        (inc.numero_protocolo || '').toLowerCase().includes(s) ||
        (inc.descricao_evento || '').toLowerCase().includes(s) ||
        (inc.acoes_imediatas || '').toLowerCase().includes(s) ||
        (inc.notificador_nome || '').toLowerCase().includes(s) ||
        (inc.setor?.nome || '').toLowerCase().includes(s) ||
        (inc.indicador?.nome || '').toLowerCase().includes(s)
      );
    }

    res.json(incidentes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar incidentes ONA' });
  }
});

// Cadastrar incidente / evento adverso / quase falha
router.post('/incidentes', async (req, res) => {
  try {
    const {
      data_incidente, tipo_evento, setorId, indicadorId,
      protocolo_seguranca, descricao_evento, fatores_contribuintes,
      acoes_imediatas, notificador_nome, status, parecer_conclusivo
    } = req.body;

    if (!descricao_evento || !tipo_evento) {
      return res.status(400).json({ error: 'Tipo do evento e descrição são obrigatórios.' });
    }

    const agora = new Date();
    const anoMes = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const totalMes = await prisma.incidenteOna.count();
    const numero_protocolo = `INC-${anoMes}-${String(totalMes + 1).padStart(4, '0')}`;

    const novo = await prisma.incidenteOna.create({
      data: {
        numero_protocolo,
        data_incidente: data_incidente ? new Date(data_incidente) : new Date(),
        tipo_evento: tipo_evento || 'NEAR_MISS',
        setorId: setorId ? parseInt(setorId) : null,
        indicadorId: indicadorId ? parseInt(indicadorId) : null,
        protocolo_seguranca: protocolo_seguranca || 'OUTRO',
        descricao_evento,
        fatores_contribuintes: fatores_contribuintes || null,
        acoes_imediatas: acoes_imediatas || null,
        notificador_nome: notificador_nome || 'Anônimo / Sigiloso',
        status: status || 'REGISTRADO',
        parecer_conclusivo: parecer_conclusivo || null
      },
      include: {
        setor: true,
        indicador: true
      }
    });

    await registrarAuditoria(`[ONA] Incidente registrado: Protocolo ${novo.numero_protocolo} (${novo.tipo_evento})`);
    res.json(novo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar incidente ONA: ' + error.message });
  }
});

// Atualizar incidente (investigação / parecer conclusivo / status)
router.put('/incidentes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      data_incidente, tipo_evento, setorId, indicadorId,
      protocolo_seguranca, descricao_evento, fatores_contribuintes,
      acoes_imediatas, notificador_nome, status, parecer_conclusivo
    } = req.body;

    const atualizado = await prisma.incidenteOna.update({
      where: { id },
      data: {
        ...(data_incidente !== undefined ? { data_incidente: new Date(data_incidente) } : {}),
        ...(tipo_evento !== undefined ? { tipo_evento } : {}),
        ...(setorId !== undefined ? { setorId: setorId ? parseInt(setorId) : null } : {}),
        ...(indicadorId !== undefined ? { indicadorId: indicadorId ? parseInt(indicadorId) : null } : {}),
        ...(protocolo_seguranca !== undefined ? { protocolo_seguranca } : {}),
        ...(descricao_evento !== undefined ? { descricao_evento } : {}),
        ...(fatores_contribuintes !== undefined ? { fatores_contribuintes } : {}),
        ...(acoes_imediatas !== undefined ? { acoes_imediatas } : {}),
        ...(notificador_nome !== undefined ? { notificador_nome } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(parecer_conclusivo !== undefined ? { parecer_conclusivo } : {})
      },
      include: {
        setor: true,
        indicador: true
      }
    });

    await registrarAuditoria(`[ONA] Incidente atualizado: ${atualizado.numero_protocolo} - Status: ${atualizado.status}`);
    res.json(atualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar incidente ONA' });
  }
});

// Excluir incidente
router.delete('/incidentes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inc = await prisma.incidenteOna.delete({ where: { id } });
    await registrarAuditoria(`[ONA] Incidente excluído: ${inc.numero_protocolo}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir incidente ONA' });
  }
});


// ==========================================
// 2. FECHAMENTO DE CICLO / ANÁLISE CRÍTICA ONA
// ==========================================

// Listar fechamentos de ciclo
router.get('/fechamentos', async (req, res) => {
  try {
    const { setorId, competencia } = req.query;
    const where = {};
    if (setorId && setorId !== 'ALL') {
      where.setorId = parseInt(setorId);
    }
    if (competencia) {
      where.competencia = competencia;
    }

    const fechamentos = await prisma.fechamentoCicloOna.findMany({
      where,
      include: { setor: true },
      orderBy: { data_reuniao: 'desc' }
    });
    res.json(fechamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar fechamentos de ciclo ONA' });
  }
});

// Cadastrar fechamento de ciclo
router.post('/fechamentos', async (req, res) => {
  try {
    const {
      setorId, competencia, data_reuniao, participantes,
      pontos_fortes, oportunidades_melhoria, decisoes_comite,
      status, responsavel_ata
    } = req.body;

    if (!competencia || !data_reuniao) {
      return res.status(400).json({ error: 'Competência e Data da Reunião são obrigatórias.' });
    }

    const novo = await prisma.fechamentoCicloOna.create({
      data: {
        setorId: setorId ? parseInt(setorId) : null,
        competencia,
        data_reuniao: new Date(data_reuniao),
        participantes: participantes || null,
        pontos_fortes: pontos_fortes || null,
        oportunidades_melhoria: oportunidades_melhoria || null,
        decisoes_comite: decisoes_comite || null,
        status: status || 'FECHADO',
        responsavel_ata: responsavel_ata || null
      },
      include: { setor: true }
    });

    await registrarAuditoria(`[ONA] Análise Crítica / Fechamento de ciclo registrado: ${competencia} - Setor: ${novo.setor?.nome || 'Geral'}`);
    res.json(novo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar fechamento de ciclo ONA: ' + error.message });
  }
});

// Atualizar fechamento de ciclo
router.put('/fechamentos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      setorId, competencia, data_reuniao, participantes,
      pontos_fortes, oportunidades_melhoria, decisoes_comite,
      status, responsavel_ata
    } = req.body;

    const atualizado = await prisma.fechamentoCicloOna.update({
      where: { id },
      data: {
        ...(setorId !== undefined ? { setorId: setorId ? parseInt(setorId) : null } : {}),
        ...(competencia !== undefined ? { competencia } : {}),
        ...(data_reuniao !== undefined ? { data_reuniao: new Date(data_reuniao) } : {}),
        ...(participantes !== undefined ? { participantes } : {}),
        ...(pontos_fortes !== undefined ? { pontos_fortes } : {}),
        ...(oportunidades_melhoria !== undefined ? { oportunidades_melhoria } : {}),
        ...(decisoes_comite !== undefined ? { decisoes_comite } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(responsavel_ata !== undefined ? { responsavel_ata } : {})
      },
      include: { setor: true }
    });

    await registrarAuditoria(`[ONA] Fechamento de ciclo ID ${id} atualizado`);
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar fechamento de ciclo ONA' });
  }
});

// Excluir fechamento de ciclo
router.delete('/fechamentos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.fechamentoCicloOna.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir fechamento de ciclo ONA' });
  }
});


// ==========================================
// 3. DOSSIÊ COMPLETO DO INDICADOR (AUDITORIA ONA)
// ==========================================

router.get('/dossie/:indicadorId', async (req, res) => {
  try {
    const indicadorId = parseInt(req.params.indicadorId);

    const indicador = await prisma.indicador.findUnique({
      where: { id: indicadorId },
      include: {
        setor: true,
        metas: { orderBy: { id: 'desc' } },
        planosAcao: { orderBy: { criado_em: 'desc' } },
        cache: true,
        incidentes: {
          orderBy: { data_incidente: 'desc' },
          take: 10
        }
      }
    });

    if (!indicador) {
      return res.status(404).json({ error: 'Indicador não encontrado' });
    }

    // Buscar fechamentos de ciclo do setor correspondente
    let fechamentosSetor = [];
    if (indicador.setorId) {
      fechamentosSetor = await prisma.fechamentoCicloOna.findMany({
        where: { setorId: indicador.setorId },
        orderBy: { data_reuniao: 'desc' },
        take: 5
      });
    }

    // Extrair histórico de dados da medição do cache
    let dadosHistoricos = [];
    if (indicador.cache && indicador.cache.dados_json) {
      try {
        const parsed = JSON.parse(indicador.cache.dados_json);
        if (Array.isArray(parsed)) {
          dadosHistoricos = parsed;
        }
      } catch (e) {}
    }

    // Estatísticas de Desempenho e Eficácia (PDCA)
    const planos = indicador.planosAcao || [];
    const totalPlanos = planos.length;
    const planosConcluidos = planos.filter(p => p.status === 'CONCLUIDO').length;
    const planosEficazes = planos.filter(p => p.eficacia === 'EFICAZ').length;
    const taxaEficacia = totalPlanos > 0 ? ((planosEficazes / totalPlanos) * 100).toFixed(1) : '100.0';

    // Matriz GUT Média
    const gutTotal = planos.reduce((acc, p) => acc + (p.score_gut || 27), 0);
    const mediaGut = totalPlanos > 0 ? (gutTotal / totalPlanos).toFixed(1) : 0;

    res.json({
      indicador,
      dadosHistoricos,
      fechamentosSetor,
      estatisticas: {
        totalMedicoes: dadosHistoricos.length,
        totalPlanos,
        planosConcluidos,
        planosEficazes,
        taxaEficaciaPDCA: `${taxaEficacia}%`,
        mediaGutPrioridade: mediaGut,
        totalIncidentesVinculados: indicador.incidentes ? indicador.incidentes.length : 0
      },
      emitidoEm: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar Dossiê ONA do indicador: ' + error.message });
  }
});

module.exports = router;
