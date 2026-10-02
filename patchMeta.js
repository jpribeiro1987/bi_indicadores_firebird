const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const markLineCode = `
      let markLine = undefined;
      if (indicador.metas && indicador.metas.length > 0 && indicador.metas[0].valor_alvo) {
        markLine = {
          data: [{ yAxis: parseFloat(indicador.metas[0].valor_alvo), name: 'Meta' }],
          lineStyle: { color: 'red', type: 'dashed', width: 2 },
          label: { show: true, position: 'end', formatter: 'Meta: {c}' }
        };
      }
`;

code = code.replace('const xAxisData = data.map', markLineCode + '\n      const xAxisData = data.map');

code = code.replace('label: {', 'markLine,\n          label: {');

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
