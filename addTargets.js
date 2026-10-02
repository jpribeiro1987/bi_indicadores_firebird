const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

if (!code.includes('unmetTargets')) {
  // 1. Add states
  code = code.replace(
    /const \[dashboards, setDashboards\] = useState\(\[\]\);/,
    `const [dashboards, setDashboards] = useState([]);\n  const [unmetTargets, setUnmetTargets] = useState([]);\n  const [showUnmetModal, setShowUnmetModal] = useState(false);`
  );

  // 2. Add useEffect to evaluate targets
  code = code.replace(
    /const handleSync = async \(\) => \{/,
    `useEffect(() => {
    if (!activeDash || !indicatorData || Object.keys(indicatorData).length === 0) return;
    
    const unmet = [];
    const getValInline = (item, colName) => {
      if (!colName || !item) return undefined;
      const key = Object.keys(item).find(k => k.toLowerCase() === colName.toLowerCase());
      return key ? item[key] : undefined;
    };

    for (const di of activeDash.indicadores) {
      const ind = di.indicador;
      const res = indicatorData[di.indicadorId];
      if (res && res.data && ind.metas && ind.metas.length > 0 && ind.metas[0].valor_alvo !== null) {
        const config = res.config;
        const seriesData = filterByDate(res.data, config.coluna_x, startDate, endDate);
        if (seriesData && seriesData.length > 0) {
          const lastItem = seriesData[seriesData.length - 1];
          let val = getValInline(lastItem, config.coluna_y);
          if (typeof val === 'string') val = parseFloat(val.replace(',', '.'));
          
          const metaStr = String(ind.metas[0].valor_alvo).replace(',', '.');
          const target = parseFloat(metaStr);
          
          let isUnmet = false;
          if (ind.orientacao === 'Maior Melhor' && val < target) isUnmet = true;
          if (ind.orientacao === 'Menor Melhor' && val > target) isUnmet = true;
          
          if (isUnmet) {
            unmet.push({
              nome: ind.nome,
              valor_atual: val,
              meta: target,
              orientacao: ind.orientacao,
              unidade: ind.unidade_medida || ''
            });
          }
        }
      }
    }
    
    if (unmet.length > 0) {
      setUnmetTargets(unmet);
      setShowUnmetModal(true);
    } else {
      setUnmetTargets([]);
      setShowUnmetModal(false);
    }
  }, [activeDash, indicatorData, startDate, endDate]);

  const handleSync = async () => {`
  );

  // 3. Add Modal to the return block
  const modalUI = `
      {showUnmetModal && unmetTargets.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Metas Não Alcançadas
            </h2>
            <p style={{ color: '#475569', marginBottom: '16px' }}>Os seguintes indicadores não atingiram a meta no período selecionado:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
              {unmetTargets.map((t, idx) => (
                <li key={idx} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', marginBottom: '8px' }}>
                  <strong>{t.nome}</strong><br/>
                  <span style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>
                    Atual: {t.valor_atual.toLocaleString('pt-BR')} {t.unidade} | Meta: {t.meta.toLocaleString('pt-BR')} {t.unidade}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUnmetModal(false)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Ciente
              </button>
            </div>
          </div>
        </div>
      )}
  `;

  code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\)\;\s*\}/,
    (match) => modalUI + match
  );

  fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
}
