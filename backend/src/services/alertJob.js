const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { executeWithCache } = require('./redisService');

const prisma = new PrismaClient();

// --- BI SYNC JOB ---
let currentBiSyncTasks = [];

async function syncBiData() {
  console.log('[BI Sync] Iniciando sincronização do BI com o Firebird...');
  try {
    const conexao = await prisma.conexaoBanco.findFirst();
    if (!conexao) return console.log('[BI Sync] Sem conexão para sincronizar BI.');
    
    const indicadores = await prisma.indicador.findMany({ where: { ativo: true } });
    
    for (const ind of indicadores) {
      try {
        const result = await executeWithCache(conexao, ind.query_sql, 1);
        await prisma.cacheIndicador.upsert({
          where: { indicadorId: ind.id },
          update: { dados_json: JSON.stringify(result), atualizado_em: new Date() },
          create: { indicadorId: ind.id, dados_json: JSON.stringify(result) }
        });
        console.log('[BI Sync] Indicador ' + ind.id + ' atualizado no cache local.');
      } catch (err) {
        console.error('[BI Sync] Falha ao atualizar indicador ' + ind.id + ':', err.message);
      }
    }
    console.log('[BI Sync] Sincronização do BI concluída.');
  } catch (err) {
    console.error('[BI Sync] Erro geral na sincronização do BI:', err);
  }
}

async function scheduleBiSyncJob(scheduleString = '') {
  currentBiSyncTasks.forEach(task => task.stop());
  currentBiSyncTasks = [];

  if (!scheduleString) return;

  const times = scheduleString.split(',').map(t => t.trim()).filter(t => t);
  
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

module.exports = { syncBiData, scheduleBiSyncJob, initJobs };
