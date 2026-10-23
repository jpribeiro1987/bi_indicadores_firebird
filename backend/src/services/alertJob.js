const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { executeWithCache } = require('./redisService');
const { sendEmail } = require('./emailService');

const prisma = new PrismaClient();

// --- BI SYNC JOB & LIVE PROGRESS ---
let currentBiSyncTasks = [];
let syncProgress = {
  running: false,
  current: 0,
  total: 0,
  currentIndicator: '',
  completedAt: null,
  lastDetails: ''
};

function getSyncProgress() {
  return syncProgress;
}

async function syncBiData(tipo = 'AUTOMATICO', setorId = null) {
  const parsedSetorId = setorId && setorId !== 'ALL' ? parseInt(setorId, 10) : null;
  console.log(`[BI Sync] Iniciando sincronização do BI com o Firebird... (Setor: ${parsedSetorId || 'TODOS'})`);
  let sucesso = true;
  let detalhes = '';
  
  syncProgress = {
    running: true,
    current: 0,
    total: 0,
    currentIndicator: 'Iniciando...',
    completedAt: null,
    lastDetails: ''
  };

  try {
    const conexao = await prisma.conexaoBanco.findFirst();
    if (!conexao) {
       detalhes = 'Sem conexão configurada';
       sucesso = false;
    } else {
      const whereClause = { ativo: true };
      let prefixoSetor = '';
      if (parsedSetorId && !isNaN(parsedSetorId)) {
        whereClause.setorId = parsedSetorId;
        const setorObj = await prisma.setor.findUnique({ where: { id: parsedSetorId } });
        if (setorObj) {
          prefixoSetor = `[Setor: ${setorObj.nome}] `;
        }
      }

      const indicadores = await prisma.indicador.findMany({ where: whereClause });
      syncProgress.total = indicadores.length;

      let falhos = [];
      for (let i = 0; i < indicadores.length; i++) {
        const ind = indicadores[i];
        syncProgress.current = i + 1;
        syncProgress.currentIndicator = ind.nome;
        try {
          const result = await executeWithCache(conexao, ind.query_sql, 1);
          await prisma.cacheIndicador.upsert({
            where: { indicadorId: ind.id },
            update: { dados_json: JSON.stringify(result), atualizado_em: new Date() },
            create: { indicadorId: ind.id, dados_json: JSON.stringify(result) }
          });
        } catch (err) {
          falhos.push(ind.nome);
        }
      }
      detalhes = prefixoSetor + (falhos.length > 0 ? falhos.length + ' indicadores falharam: ' + falhos.join(', ') : `Todos atualizados com sucesso (${indicadores.length} indicadores)`);
      sucesso = falhos.length === 0;
    }
  } catch (err) {
    sucesso = false;
    detalhes = err.message;
  } finally {
    syncProgress.running = false;
    syncProgress.currentIndicator = '';
    syncProgress.completedAt = new Date().toISOString();
    syncProgress.lastDetails = detalhes;
  }
  
  try {
    await prisma.logSincronizacao.create({
      data: { tipo, sucesso, detalhes: detalhes.substring(0, 2000) }
    });
  
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 15);
    await prisma.logSincronizacao.deleteMany({
      where: { data: { lt: dataLimite } }
    });
  } catch(e) {}
}

async function sendUnmetTargetsSummaryEmail(setorId = null) {
  const parsedSetorId = setorId && setorId !== 'ALL' ? parseInt(setorId, 10) : null;
  const whereClause = { ativo: true };
  if (parsedSetorId && !isNaN(parsedSetorId)) {
    whereClause.setorId = parsedSetorId;
  }

  const indicadores = await prisma.indicador.findMany({
    where: whereClause,
    include: { metas: true, cache: true, setor: true }
  });

  const getValInline = (item, colName) => {
    if (!colName || !item) return undefined;
    const key = Object.keys(item).find(k => k.toLowerCase() === colName.toLowerCase());
    return key ? item[key] : undefined;
  };

  const unmetList = [];
  for (const ind of indicadores) {
    if (!ind.metas || ind.metas.length === 0 || !ind.cache || !ind.cache.dados_json) continue;
    let rows = [];
    try { rows = JSON.parse(ind.cache.dados_json); } catch (e) {}
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const lastItem = rows[rows.length - 1];
    let val = getValInline(lastItem, ind.coluna_y);
    if (typeof val === 'string') val = parseFloat(val.replace(',', '.'));
    if (typeof val !== 'number' || isNaN(val)) continue;

    const target = parseFloat(String(ind.metas[0].valor_alvo).replace(',', '.'));
    if (isNaN(target)) continue;

    let isUnmet = false;
    if (ind.orientacao === 'Maior Melhor' && val < target) isUnmet = true;
    if (ind.orientacao === 'Menor Melhor' && val > target) isUnmet = true;

    if (isUnmet) {
      unmetList.push({
        nome: ind.nome,
        setor: ind.setor ? ind.setor.nome : 'Geral',
        setorId: ind.setorId,
        atual: val,
        meta: target,
        orientacao: ind.orientacao,
        unidade: ind.unidade_medida || ''
      });
    }
  }

  if (unmetList.length === 0) {
    return { sent: false, count: 0, message: 'Todos os indicadores estão dentro da meta!' };
  }

  // Find recipient emails (sector managers + admins)
  const usuarios = await prisma.usuario.findMany({ include: { setores: true } });
  const recipients = new Set();
  for (const u of usuarios) {
    if (!u.email) continue;
    if (u.perfil === 'ADMIN') {
      recipients.add(u.email);
    } else if (u.setores && u.setores.some(s => unmetList.some(item => item.setorId === s.id))) {
      recipients.add(u.email);
    }
  }

  if (recipients.size === 0) {
    return { sent: false, count: unmetList.length, message: 'Nenhum destinatário de e-mail encontrado.' };
  }

  const rowsHtml = unmetList.map(u => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${u.setor}</td>
      <td style="padding:8px;border:1px solid #ddd;"><strong>${u.nome}</strong></td>
      <td style="padding:8px;border:1px solid #ddd;color:#dc2626;font-weight:bold;">${u.atual.toLocaleString('pt-BR')} ${u.unidade}</td>
      <td style="padding:8px;border:1px solid #ddd;">${u.meta.toLocaleString('pt-BR')} ${u.unidade} (${u.orientacao})</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#dc2626;">⚠️ Resumo de Indicadores Fora da Meta - Hospital Santo Antônio</h2>
      <p>Os seguintes indicadores encontram-se abaixo da meta estipulada na última apuração:</p>
      <table style="border-collapse:collapse;width:100%;max-width:750px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Setor</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Indicador</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Valor Atual</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Meta Esperada</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#64748b;">Acesse o painel de Dashboards (BI) para registrar a Justificativa e o Plano de Ação correspondente.</p>
    </div>
  `;

  const emailTo = Array.from(recipients).join(', ');
  const ok = await sendEmail(emailTo, 'Resumo de Indicadores Fora da Meta - Sistema de Indicadores Hospitalar', html);
  return {
    sent: Boolean(ok),
    count: unmetList.length,
    recipients: Array.from(recipients),
    message: ok ? `Resumo enviado com sucesso para ${recipients.size} destinatário(s)!` : 'Falha ao enviar e-mail. Verifique as configurações SMTP.'
  };
}

async function scheduleBiSyncJob(scheduleString = '') {
  currentBiSyncTasks.forEach(task => task.stop());
  currentBiSyncTasks = [];

  if (!scheduleString) return;

  const times = scheduleString.split(/[,;]/).map(t => t.trim()).filter(t => t);
  
  for (const timeString of times) {
    const [hour, minute] = timeString.split(':');
    if (hour && minute) {
      const cronExpression = parseInt(minute, 10) + ' ' + parseInt(hour, 10) + ' * * *';
      console.log('[BI Sync] Agendando Sincronização do BI para as ' + timeString);
      const task = cron.schedule(cronExpression, async () => {
        await syncBiData();
      }, { timezone: 'America/Sao_Paulo' });
      currentBiSyncTasks.push(task);
    }
  }
}

async function initJobs() {
  try {
    const biConfig = await prisma.configuracao.findUnique({ where: { chave: 'BI_SYNC_SCHEDULES' } });
    const biSchedules = biConfig?.valor || '';
    await scheduleBiSyncJob(biSchedules);
  } catch (err) {
    console.error('Failed to init BI sync job:', err);
  }
}

module.exports = { syncBiData, getSyncProgress, sendUnmetTargetsSummaryEmail, scheduleBiSyncJob, initJobs };
