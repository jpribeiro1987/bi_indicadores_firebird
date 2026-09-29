import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);
import ReactECharts from 'echarts-for-react';
import { Save } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function Dashboards({ userRole, userSectors = [] }) {
  const [dashboards, setDashboards] = useState([]);
  const [activeDash, setActiveDash] = useState(null);
  const [indicatorData, setIndicatorData] = useState({});
  const [layout, setLayout] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState('ALL');
  const [availableSectors, setAvailableSectors] = useState([]);

  const getDefaultStartDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };
  const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());

  const filterByDate = (dataArray, colX, start, end) => {
    if (!start && !end) return dataArray;
    if (!dataArray || !Array.isArray(dataArray)) return dataArray;
    
    // helper to find key ignoring case
    const getVal = (item, colName) => {
      if (!colName) return undefined;
      const key = Object.keys(item).find(k => k.toLowerCase() === colName.toLowerCase());
      return key ? item[key] : undefined;
    };

    return dataArray.filter(row => {
      let rawDate = getVal(row, colX);
      if (!rawDate) return true;
      
      let parsed = null;
      if (typeof rawDate === 'string') {
        if (rawDate.includes('/')) {
          let parts = rawDate.split('/');
          if (parts.length === 2) parsed = new Date(`${parts[1]}-${parts[0]}-01T00:00:00`);
          if (parts.length === 3) parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        } else {
          parsed = new Date(rawDate);
        }
      } else if (rawDate instanceof Date) {
        parsed = rawDate;
      }
      
      if (!parsed || isNaN(parsed.getTime())) return true;
      
      let isAfterStart = true;
      let isBeforeEnd = true;
      
      if (start) {
         isAfterStart = parsed >= new Date(start + 'T00:00:00');
      }
      if (end) {
         isBeforeEnd = parsed <= new Date(end + 'T23:59:59');
      }
      return isAfterStart && isBeforeEnd;
    });
  };


  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const res = await axios.get('/api/setores');
      setAvailableSectors(res.data);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchDashboards();
  }, [userRole, userSectors, selectedSectorId]);

  const fetchDashboards = async () => {
    try {
      const res = await axios.get('/api/dashboards');
            const dbs = res.data.map(d => ({
        ...d,
        indicadores: d.indicadores.filter(di => 
          (userRole === 'ADMIN' || !di.indicador.setorId || userSectors.includes(di.indicador.setorId))
          && (selectedSectorId === 'ALL' || di.indicador.setorId === parseInt(selectedSectorId) || !di.indicador.setorId)
        )
      }));
      setDashboards(dbs);
      if (dbs.length > 0) {
        selectDashboard(dbs[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDashboard = async (dash, sector = null) => {
    setActiveDash(dash);
    const targetSector = sector || selectedSectorId;
    
    // Find layout for this sector
    let newLayout = [];
    const parsedSectorId = targetSector === 'ALL' ? null : parseInt(targetSector);
    const customLayout = dash.layouts?.find(l => l.setorId === parsedSectorId);
    
    if (customLayout) {
      newLayout = JSON.parse(customLayout.layout_json).map(l => ({
        i: l.indicadorId ? l.indicadorId.toString() : (l.i ? l.i.toString() : ''),
        x: l.pos_x !== undefined ? l.pos_x : l.x,
        y: l.pos_y !== undefined ? l.pos_y : l.y,
        w: l.largura !== undefined ? l.largura : l.w,
        h: l.altura !== undefined ? l.altura : l.h,
        minW: 3, minH: 6 
      }));
    } else {
      newLayout = dash.indicadores.map(di => ({
        i: di.indicadorId.toString(),
        x: di.pos_x,
        y: di.pos_y,
        w: di.largura,
        h: di.altura,
        minW: 3,
        minH: 6,
      }));
    }
    setLayout(newLayout);

    // Fetch data for each indicator
    const newData = {};
    for (const di of dash.indicadores) {
      try {
        const res = await axios.get(`/api/indicadores/${di.indicadorId}/executar`);
        newData[di.indicadorId] = res.data;
      } catch (e) {
        console.error('Failed to load indicator', di.indicadorId);
      }
    }
    setIndicatorData(newData);
  };

  const saveLayout = async () => {
    if (!activeDash) return;
    try {
      const payload = layout.map(l => ({
        indicadorId: parseInt(l.i),
        pos_x: l.x,
        pos_y: l.y,
        largura: l.w,
        altura: l.h
      }));
      await axios.put(`/api/dashboards/${activeDash.id}/layout`, { layout: payload, setorId: selectedSectorId });
      alert('Layout salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar layout');
    }
  };

  const onLayoutChange = (newLayout, allLayouts) => {
    setLayout(newLayout);
  };

  const getOption = (indicador, result, filteredData) => {
    if (!result || !result.data) return {};
    
    const config = result.config; const data = filteredData || result.data;
    
    // Helper para buscar a chave ignorando case (Firebird retorna UPPERCASE)
    const getVal = (item, colName) => {
      if (!colName) return undefined;
      const key = Object.keys(item).find(k => k.toLowerCase() === colName.toLowerCase());
      return key ? item[key] : undefined;
    };
    
    const formatValue = (val) => {
      if (typeof val === 'number') return val.toLocaleString('pt-BR');
      return val;
    };

    
      let markLine = undefined;
      if (indicador.metas && indicador.metas.length > 0 && indicador.metas[0].valor_alvo) {
        markLine = {
          data: [{ yAxis: parseFloat(String(indicador.metas[0].valor_alvo).replace(',', '.')), name: 'Meta' }],
          lineStyle: { color: 'red', type: 'dashed', width: 2 },
          label: { show: true, position: 'end', formatter: 'Meta: {c}' }
        };
      }

      const xAxisData = data.map(item => {
      let val = getVal(item, config.coluna_x);
      // Extrair apenas o YYYY-MM-DD se for string ISO datetime para ficar legível
      if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
        return val.substring(0, 10).split('-').reverse().join('/');
      }
      return val;
    });
    
    const seriesData = data.map(item => getVal(item, config.coluna_y));

    if (config.tipo_grafico === 'PIE' || config.tipo_grafico === 'DONUT') {
      const pieData = data.map(item => ({ name: getVal(item, config.coluna_x), value: getVal(item, config.coluna_y) }));
      const isDonut = config.tipo_grafico === 'DONUT';
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'horizontal', bottom: 0 },
        series: [{ 
          type: 'pie', 
          radius: isDonut ? ['40%', '70%'] : '60%', 
          itemStyle: isDonut ? { borderRadius: 5, borderColor: '#fff', borderWidth: 2 } : {},
          data: pieData,
          label: { show: true, formatter: '{b}: {c}' },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
      };
    }

    if (config.tipo_grafico === 'CARD' || config.tipo_grafico === 'TABLE') {
       return {};
    }

    return {
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: xAxisData,
        name: config.coluna_x ? config.coluna_x.toUpperCase() : '',
        nameLocation: 'middle',
        nameGap: 60,
        axisLabel: { color: '#555', rotate: xAxisData.length > 5 ? 45 : 0 }
      },
      yAxis: { 
        type: 'value',
        name: config.coluna_y ? config.coluna_y.toUpperCase() : '',
        nameLocation: 'end',
        nameTextStyle: { padding: [0, 0, 10, 0] },
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [{ 
        type: (config.tipo_grafico === 'LINE' || config.tipo_grafico === 'AREA') ? 'line' : config.tipo_grafico === 'SCATTER' ? 'scatter' : 'bar', 
        data: seriesData,
        areaStyle: config.tipo_grafico === 'AREA' ? { opacity: 0.3 } : undefined,
        itemStyle: { color: '#00cbb4', borderRadius: config.tipo_grafico === 'BAR' ? [4, 4, 0, 0] : 0 },
        smooth: true,
        symbolSize: config.tipo_grafico === 'SCATTER' ? 12 : 6,
          markLine: markLine,
        label: {
          show: true,
          position: 'top',
          color: '#333',
          fontWeight: 'bold',
          formatter: (params) => formatValue(params.value)
        }
      }]
    };
  };


  const handleSync = async () => {
    try {
      await axios.post('/api/dashboards/sync');
      alert('Sincronização iniciada com sucesso! O processo roda em background. Atualize a tela em alguns instantes.');
    } catch (err) {
      alert('Erro ao disparar sincronização');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
            
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Dashboards</h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>De:</span>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Até:</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
          </div>

          <select 
            value={selectedSectorId} 
            onChange={e => setSelectedSectorId(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          >
            <option value='ALL'>Todos os Meus Setores</option>
            {availableSectors.filter(s => userRole === 'ADMIN' || userSectors.includes(s.id)).map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          
          <button onClick={handleSync} style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Atualizar Agora
          </button>
          <button onClick={() => window.print()} style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🖨️ Imprimir
          </button>
          
          <button onClick={saveLayout} style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16}/> Salvar Posições
          </button>
        </div>
      </div>


      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {dashboards.map(dash => (
          <button
            key={dash.id}
            onClick={() => selectDashboard(dash)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeDash?.id === dash.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: activeDash?.id === dash.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-bg)',
              color: activeDash?.id === dash.id ? 'var(--primary)' : 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: activeDash?.id === dash.id ? 600 : 400
            }}
          >
            {dash.nome}
          </button>
        ))}
      </div>

      {activeDash && layout.length > 0 && (
        <ResponsiveGridLayoutWithWidth layouts={{ lg: layout }}
          className="layout"
          
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 1, xxs: 1 }}
          rowHeight={30}
            margin={[24, 24]}
            containerPadding={[0, 0]}
          onLayoutChange={onLayoutChange}
        >
          
          {activeDash.indicadores.map(di => {
            const ind = di.indicador;
            const res = indicatorData[ind.id];
            const filteredData = res ? filterByDate(res.data, ind.coluna_x, startDate, endDate) : null;
            
            return (

              <div key={ind.id.toString()} data-grid={layout.find(l => l.i === ind.id.toString()) || { x: 0, y: 0, w: 6, h: 12, minW: 3, minH: 6 }} style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>{ind.nome}</h4>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  {res ? (
                    ind.tipo_grafico === 'CARD' ? (
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                         {filteredData && filteredData[0] ? filteredData[0][ind.coluna_y] : '0'}
                       </div>
                    ) : ind.tipo_grafico === 'TABLE' ? (
                      <div style={{ height: '100%', overflow: 'auto', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1, borderBottom: '2px solid var(--border)' }}>
                            <tr>
                              {filteredData && filteredData.length > 0 && Object.keys(filteredData[0]).map((k, i) => (
                                <th key={i} style={{ padding: '8px', textAlign: 'left', color: 'var(--text-main)' }}>{k.toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData && filteredData.map((row, rIdx) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                                {Object.values(row).map((val, cIdx) => (
                                  <td key={cIdx} style={{ padding: '8px', color: 'var(--text-main)' }}>
                                    {typeof val === 'number' ? val.toLocaleString('pt-BR') : 
                                     (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) ? val.substring(0, 10).split('-').reverse().join('/') : 
                                     String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ReactECharts 
                        option={getOption(ind, res, filteredData)} 
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                      />
                    )
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Carregando dados...</div>
                  )}
                </div>
                {ind.descricao && (
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    {ind.descricao}
                  </div>
                )}
              </div>
            );
          })}
        </ResponsiveGridLayoutWithWidth>
      )}
      
      {!activeDash && dashboards.length > 0 && (
         <div style={{ color: 'var(--text-muted)' }}>Selecione um dashboard acima.</div>
      )}
      {dashboards.length === 0 && (
         <div style={{ color: 'var(--text-muted)' }}>Nenhum dashboard disponível para o seu setor.</div>
      )}
    </div>
  );
}
