const fs = require('fs');
let code = fs.readFileSync('backend/src/services/alertJob.js', 'utf8');

const originalCode = `      let falhas = 0;
      for (const ind of indicadores) {
        try {
          const result = await executeWithCache(conexao, ind.query_sql, 1);
          await prisma.cacheIndicador.upsert({
            where: { indicadorId: ind.id },
            update: { dados_json: JSON.stringify(result), atualizado_em: new Date() },
            create: { indicadorId: ind.id, dados_json: JSON.stringify(result) }
          });
        } catch (err) {
          falhas++;
        }
      }
      detalhes = falhas > 0 ? falhas + ' indicadores falharam' : 'Todos atualizados com sucesso';
      sucesso = falhas === 0;`;

const newCode = `      let falhos = [];
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
      sucesso = falhos.length === 0;`;

code = code.replace(originalCode, newCode);
code = code.replace(`detalhes: detalhes.substring(0, 250)`, `detalhes: detalhes.substring(0, 2000)`);

fs.writeFileSync('backend/src/services/alertJob.js', code, 'utf8');
