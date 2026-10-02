const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { executeWithCache } = require('./redisService');

const prisma = new PrismaClient();

// --- BI SYNC JOB ---
let currentBiSyncTasks = [];

async function syncBiData(tipo = 'AUTOMATICO') {
  console.log('[BI Sync] Iniciando sincronização do BI com o Firebird...');
  let sucesso = true;
  let detalhes = '';
  
  try {
    const conexao = await prisma.conexaoBanco.findFirst();
    if (!conexao) {
       detalhes = 'Sem conexão configurada';
       sucesso = false;
    } else {
      const indicadores = await prisma.indicador.findMany({ where: { ativo: true } });
      let falhos = [];
      for (const ind of indicadores) {
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
      detalhes = falhos.length > 0 ? falhos.length + ' indicadores falharam: ' + falhos.join(', ') : 'Todos atualizados com sucesso';
      sucesso = falhos.length === 0;
    }
  } catch (err) {
    sucesso = false;
    detalhes = err.message;
  }
  
  try {
    await prisma.logSincronizacao.create({
      data: { tipo, sucesso, detalhes: detalhes.substring(0, 2000) }
    });
  } catch(e) {}
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

module.exports = { syncBiData, scheduleBiSyncJob, initJobs };
