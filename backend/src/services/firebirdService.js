const Firebird = require('node-firebird');

const FORBIDDEN_WORDS = ['UPDATE', 'DELETE', 'INSERT', 'DROP', 'EXECUTE', 'COMMIT', 'ALTER', 'CREATE'];

/**
 * Filtro Anti-Injeção e Paginação
 */
function prepareQuery(sql) {
  // Remove comentários (-- e /* */) apenas para a validação
  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let upperSql = cleanSql.toUpperCase().trim();
  
  if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('WITH')) {
    throw new Error('A query deve começar obrigatoriamente com SELECT ou WITH.');
  }

  for (const word of FORBIDDEN_WORDS) {
    if (new RegExp(`\\b${word}\\b`).test(upperSql)) {
      throw new Error(`Palavra reservada bloqueada por segurança: ${word}`);
    }
  }

  // Verifica se já existe paginação
  if (!upperSql.match(/\bFIRST\b/) && !upperSql.match(/\bROWS\b/)) {
    // Injeta FIRST 1000
    // Usamos expressão regular para pegar o SELECT, mesmo que tenha espaços
    sql = sql.replace(/^(\s*SELECT\s+)(.*)/is, '$1FIRST 1000 $2');
  }

  return sql;
}

/**
 * Executa a query no Firebird com timeout
 */
function executeQuery(conexao, sql, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    try {
      const safeSql = prepareQuery(sql);
      
      const options = {
        host: conexao.host,
        port: conexao.porta || 3050,
        database: conexao.caminho,
        user: conexao.usuario,
        password: conexao.senha,
        lowercase_keys: false,
        role: null,
        pageSize: 4096
      };

      let queryFinished = false;

      Firebird.attach(options, function(err, db) {
        if (err) return reject(err);

        // Timeout fallback
        const timer = setTimeout(() => {
          if (!queryFinished) {
            db.detach();
            reject(new Error('Timeout: A query demorou muito para responder e foi cancelada.'));
          }
        }, timeoutMs);

        db.query(safeSql, function(err, result) {
          queryFinished = true;
          clearTimeout(timer);
          db.detach();
          
          if (err) return reject(err);
          resolve(result);
        });
      });

    } catch (err) {
      reject(err);
    }
  });
}

function testConnection(conexaoInfo) {
  return new Promise((resolve, reject) => {
    const options = {
      host: conexaoInfo.host,
      port: conexaoInfo.porta,
      database: conexaoInfo.caminho,
      user: conexaoInfo.usuario,
      password: conexaoInfo.senha,
      lowercase_keys: false,
      role: null,
      pageSize: 4096,
      timeout: 5000
    };

    Firebird.attach(options, function(err, db) {
      if (err) return reject(err);
      
      db.detach();
      resolve(true);
    });
  });
}

module.exports = {
  testConnection,
  prepareQuery,
  executeQuery
};
