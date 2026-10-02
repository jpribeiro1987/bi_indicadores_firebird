const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

// Update getOption to append unidade_medida
code = code.replace(
  `tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' }`,
  `tooltip: { trigger: 'item', formatter: '{b}: {c}' + (config.unidade_medida ? ' ' + config.unidade_medida : '') + ' ({d}%)' }`
);

code = code.replace(
  `        tooltip: { \n          trigger: 'axis',\n          axisPointer: { type: 'shadow' }\n        },`,
  `        tooltip: { \n          trigger: 'axis',\n          axisPointer: { type: 'shadow' },\n          valueFormatter: (value) => value + (config.unidade_medida ? ' ' + config.unidade_medida : '')\n        },`
);

code = code.replace(
  `formatter: (params) => formatValue(params.value)`,
  `formatter: (params) => formatValue(params.value) + (config.unidade_medida ? ' ' + config.unidade_medida : '')`
);

code = code.replace(
  `{filteredData && filteredData[0] ? filteredData[0][ind.coluna_y] : '0'}`,
  `{filteredData && filteredData[0] ? (formatValue(filteredData[0][ind.coluna_y]) + (ind.unidade_medida ? ' ' + ind.unidade_medida : '')) : '0'}`
);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
