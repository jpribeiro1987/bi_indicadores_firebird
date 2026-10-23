const redis = require('redis');
const crypto = require('crypto');
const { executeQuery, prepareQuery } = require('./firebirdService');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Conectar ao Redis
(async () => {
  await client.connect();
})();

function generateHash(conexao, sql) {
  const hash = crypto.createHash('sha256');
  hash.update(`${conexao.id}_${sql}`);
  return hash.digest('hex');
}

/**
 * Executa SQL via Cache ou Firebird
 */
async function executeWithCache(conexao, sql, ttlSeconds = 1800, params = {}) {
  const resolvedSql = prepareQuery(sql, params);
  const cacheKey = `query:${generateHash(conexao, resolvedSql)}`;
  
  if (ttlSeconds > 1) {
    try {
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.error('Redis get error:', err);
    }
  }

  // Se não estiver em cache, consulta o banco
  const result = await executeQuery(conexao, sql, 120000, params);

  try {
    await client.setEx(cacheKey, ttlSeconds, JSON.stringify(result));
  } catch (err) {
    console.error('Redis set error:', err);
  }

  return result;
}

module.exports = {
  executeWithCache
};
