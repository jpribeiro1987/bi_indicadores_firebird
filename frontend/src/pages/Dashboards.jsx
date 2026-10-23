import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);
import ReactECharts from 'echarts-for-react';
import { Save, Download, RefreshCw, Info, ClipboardList, Tv, FileSpreadsheet, Mail, ArrowUpDown, Search, Trash2, CheckCircle2, Maximize2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function Dashboards({ userRole, userSectors = [] }) {
  const [dashboards, setDashboards] = useState([]);
  const [unmetTargets, setUnmetTargets] = useState([]);
  const [showUnmetModal, setShowUnmetModal] = useState(false);
  const [activeDash, setActiveDash] = useState(null);
  const [indicatorData, setIndicatorData] = useState({});
  const [refreshingIds, setRefreshingIds] = useState({});
  const [layout, setLayout] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState('ALL');
  const [availableSectors, setAvailableSectors] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Sync progress state
  const [syncProgress, setSyncProgress] = useState({ running: false, current: 0, total: 0, currentIndicator: '' });
  const syncPollRef = useRef(null);

  // TV Mode state
  const [tvMode, setTvMode] = useState(false);

  // Ficha Técnica Modal
  const [fichaIndicador, setFichaIndicador] = useState(null);

  // Expanded Indicator (Zoom / Full-screen chart/table)
  const [expandedIndicador, setExpandedIndicador] = useState(null);

  // Plano de Ação Modal
  const [planoIndicador, setPlanoIndicador] = useState(null);
  const [planosList, setPlanosList] = useState([]);
  const [novoPlano, setNovoPlano] = useState({
    competencia: '',
    valor_obtido: '',
    meta_esperada: '',
    justificativa: '',
    plano_acao: '',
    responsavel: '',
    prazo: '',
    status: 'PENDENTE'
  });

  // Table search and sort state per indicatorId
  const [tableSearch, setTableSearch] = useState({});
  const [tableSort, setTableSort] = useState({});

  const getDefaultStartDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };
  const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());

  const applyDatePreset = (preset) => {
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let start = new Date();
    if (preset === 'MES') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'TRIMESTRE') {
      start.setMonth(now.getMonth() - 3);
    } else if (preset === 'SEMESTRE') {
      start.setMonth(now.getMonth() - 6);
    } else if (preset === 'ANO') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (preset === '12M') {
      start.setFullYear(now.getFullYear() - 1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(endStr);
  };

  const getVal = (item, colName) => {
    if (!colName || !item) return undefined;
    const key = Object.keys(item).find(k => k.toLowerCase() === colName.toLowerCase());
    return key ? item[key] : undefined;
  };

  const formatValue = (val) => {
    if (typeof val === 'number') return val.toLocaleString('pt-BR');
    return val;
  };

  // Resolve target value for indicator (supporting competence/year matching if multiple metas exist)
  const getActiveMeta = (ind) => {
    if (!ind || !ind.metas || ind.metas.length === 0) return null;
    if (endDate) {
      const endYear = endDate.substring(0, 4);
      const endYm = `${endDate.substring(5, 7)}/${endYear}`;
      const byYm = ind.metas.find(m => m.competencia && m.competencia.trim() === endYm);
      if (byYm) return byYm;
      const byYear = ind.metas.find(m => m.competencia && m.competencia.trim() === endYear);
      if (byYear) return byYear;
    }
    return ind.metas[0];
  };

  const evaluateTargetColor = (ind, rawVal, defaultColor = '#00cbb4') => {
    const metaObj = getActiveMeta(ind);
    if (!metaObj || metaObj.valor_alvo === null || metaObj.valor_alvo === undefined || !ind.orientacao) {
      return defaultColor;
    }
    let val = typeof rawVal === 'string' ? parseFloat(rawVal.replace(',', '.')) : rawVal;
    const target = parseFloat(String(metaObj.valor_alvo).replace(',', '.'));
    if (typeof val !== 'number' || isNaN(val) || isNaN(target)) return defaultColor;

    if (ind.orientacao === 'Maior Melhor') {
      return val >= target ? '#10b981' : '#ef4444';
    }
    if (ind.orientacao === 'Menor Melhor') {
      return val <= target ? '#10b981' : '#ef4444';
    }
    return defaultColor;
  };

  const filterByDate = (dataArray, colX, start, end) => {
    if (!start && !end) return dataArray;
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return dataArray;

    const detectDateValue = (row) => {
      let val = getVal(row, colX);
      if (val !== undefined && val !== null && val !== '') return val;

      const keys = Object.keys(row);
      const priorityNames = ['mes_ano', 'data', 'dt', 'competencia', 'periodo', 'data_evolucao', 'data_hora_evolucao'];
      for (const pName of priorityNames) {
        const matchKey = keys.find(k => k.toLowerCase() === pName || k.toLowerCase().includes(pName));
        if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null && row[matchKey] !== '') {
          return row[matchKey];
        }
      }

      for (const k of keys) {
        const v = row[k];
        if (v instanceof Date) return v;
        if (typeof v === 'string') {
          const s = v.trim();
          if (/^\d{1,2}\/\d{4}$/.test(s) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
            return s;
          }
        }
      }
      return undefined;
    };

    return dataArray.filter(row => {
      let rawDate = detectDateValue(row);
      if (!rawDate) return true;
      
      if (typeof rawDate === 'string') {
        const str = rawDate.trim();
        if (/^\d{1,2}\/\d{4}$/.test(str)) {
          const [mm, yyyy] = str.split('/');
          const ym = `${yyyy}-${mm.padStart(2, '0')}`;
          if (start && ym < start.substring(0, 7)) return false;
          if (end && ym > end.substring(0, 7)) return false;
          return true;
        }
        if (/^\d{4}[\/\-]\d{1,2}$/.test(str)) {
          const [yyyy, mm] = str.split(/[\/\-]/);
          const ym = `${yyyy}-${mm.padStart(2, '0')}`;
          if (start && ym < start.substring(0, 7)) return false;
          if (end && ym > end.substring(0, 7)) return false;
          return true;
        }
        if (/^\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}/.test(str)) {
          const parts = str.substring(0, 10).split(/[\/\.]/);
          const ymd = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          if (start && ymd < start) return false;
          if (end && ymd > end) return false;
          return true;
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const ymd = str.substring(0, 10);
          if (start && ymd < start) return false;
          if (end && ymd > end) return false;
          return true;
        }
      }

      let parsed = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (!parsed || isNaN(parsed.getTime())) return true;
      
      const ymd = parsed.toISOString().substring(0, 10);
      if (start && ymd < start) return false;
      if (end && ymd > end) return false;
      return true;
    });
  };

  useEffect(() => {
    fetchSectors();
    return () => {
      if (syncPollRef.current) clearInterval(syncPollRef.current);
    };
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

  // Modo TV: alterna automaticamente entre setores a cada 25 segundos
  useEffect(() => {
    if (!tvMode) return;
    const allowedSectors = availableSectors.filter(
      s => userRole === 'ADMIN' || userRole === 'LEITURA' || userSectors.includes(s.id)
    );
    const options = ['ALL', ...allowedSectors.map(s => String(s.id))];
    if (options.length <= 1) return;

    const timer = setInterval(() => {
      setSelectedSectorId(prev => {
        const idx = options.indexOf(String(prev));
        const nextIdx = (idx + 1) % options.length;
        return options[nextIdx];
      });
    }, 25000);

    return () => clearInterval(timer);
  }, [tvMode, availableSectors, userRole, userSectors]);

  const toggleTvMode = () => {
    if (!tvMode) {
      setTvMode(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setTvMode(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const fetchDashboards = async () => {
    try {
      const logsRes = await axios.get('/api/config/logs');
      const sucessos = logsRes.data.filter(l => l.status === 'SUCESSO' || l.sucesso === true);
      if (sucessos.length > 0) {
        setLastUpdate(new Date(sucessos[0].data).toLocaleString('pt-BR'));
      }
    } catch(e) {}
    try {
      const res = await axios.get('/api/dashboards');
      const dbs = res.data.map(d => ({
        ...d,
        indicadores: d.indicadores.filter(di => 
          (userRole === 'ADMIN' || userRole === 'LEITURA' || !di.indicador.setorId || userSectors.includes(di.indicador.setorId))
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

    const newData = {};
    for (const di of dash.indicadores) {
      try {
        const res = await axios.get(`/api/indicadores/${di.indicadorId}/executar`, {
          params: { startDate, endDate }
        });
        newData[di.indicadorId] = res.data;
      } catch (e) {
        console.error('Failed to load indicator', di.indicadorId);
      }
    }
    setIndicatorData(newData);
  };

  const refreshSingleIndicator = async (indId) => {
    setRefreshingIds(prev => ({ ...prev, [indId]: true }));
    try {
      const res = await axios.get(`/api/indicadores/${indId}/executar`, {
        params: { force: 'true', startDate, endDate }
      });
      setIndicatorData(prev => ({ ...prev, [indId]: res.data }));
    } catch (e) {
      alert('Erro ao atualizar este indicador no Firebird.');
    } finally {
      setRefreshingIds(prev => ({ ...prev, [indId]: false }));
    }
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

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const getOption = (indicador, result, filteredData) => {
    if (!result || !result.data) return {};
    
    const config = result.config;
    const data = filteredData || result.data;
    const activeMeta = getActiveMeta(indicador);

    const markLines = [
      {
        type: 'average',
        name: 'Média',
        lineStyle: { color: '#3b82f6', type: 'dotted', width: 2 },
        label: { show: true, position: 'start', formatter: 'Média: {c}' }
      }
    ];
    if (activeMeta && activeMeta.valor_alvo !== null && activeMeta.valor_alvo !== undefined) {
      markLines.push({
        yAxis: parseFloat(String(activeMeta.valor_alvo).replace(',', '.')),
        name: 'Meta',
        lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
        label: { show: true, position: 'end', formatter: 'Meta: {c}' }
      });
    }
    const markLine = { data: markLines };

    const xAxisData = data.map(item => {
      let val = getVal(item, config.coluna_x);
      if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
        return val.substring(0, 10).split('-').reverse().join('/');
      }
      return val;
    });
    
    const seriesData = data.map(item => {
      const rawVal = getVal(item, config.coluna_y);
      if (config.tipo_grafico === 'BAR' && activeMeta && indicador.orientacao) {
        return {
          value: rawVal,
          itemStyle: {
            color: evaluateTargetColor(indicador, rawVal, '#00cbb4'),
            borderRadius: [4, 4, 0, 0]
          }
        };
      }
      return rawVal;
    });

    if (config.tipo_grafico === 'PIE' || config.tipo_grafico === 'DONUT') {
      const pieData = data.map(item => ({ name: getVal(item, config.coluna_x), value: getVal(item, config.coluna_y) }));
      const isDonut = config.tipo_grafico === 'DONUT';
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c}' + (indicador.unidade_medida ? ' ' + indicador.unidade_medida : '') + ' ({d}%)' },
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
          formatter: (params) => formatValue(params.value) + (indicador.unidade_medida ? ' ' + indicador.unidade_medida : '')
        }
      }]
    };
  };

  useEffect(() => {
    if (!activeDash || !indicatorData || Object.keys(indicatorData).length === 0) return;
    
    const unmet = [];
    for (const di of activeDash.indicadores) {
      const ind = di.indicador;
      const res = indicatorData[di.indicadorId];
      const activeMeta = getActiveMeta(ind);
      if (res && res.data && activeMeta && activeMeta.valor_alvo !== null) {
        const config = res.config;
        const seriesData = filterByDate(res.data, config.coluna_x, startDate, endDate);
        if (seriesData && seriesData.length > 0) {
          const lastItem = seriesData[seriesData.length - 1];
          let val = getVal(lastItem, config.coluna_y);
          if (typeof val === 'string') val = parseFloat(val.replace(',', '.'));
          
          const metaStr = String(activeMeta.valor_alvo).replace(',', '.');
          const target = parseFloat(metaStr);
          
          let isUnmet = false;
          if (ind.orientacao === 'Maior Melhor' && val < target) isUnmet = true;
          if (ind.orientacao === 'Menor Melhor' && val > target) isUnmet = true;
          
          if (isUnmet) {
            unmet.push({
              indicadorObj: ind,
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
      if (!tvMode) setShowUnmetModal(true);
    } else {
      setUnmetTargets([]);
      setShowUnmetModal(false);
    }
  }, [activeDash, indicatorData, startDate, endDate]);

  const handleSync = async () => {
    try {
      await axios.post('/api/dashboards/sync', { setorId: selectedSectorId });
      setSyncProgress({ running: true, current: 0, total: 1, currentIndicator: 'Iniciando...' });

      if (syncPollRef.current) clearInterval(syncPollRef.current);
      syncPollRef.current = setInterval(async () => {
        try {
          const st = await axios.get('/api/dashboards/sync-status');
          setSyncProgress(st.data);
          if (!st.data.running) {
            clearInterval(syncPollRef.current);
            syncPollRef.current = null;
            fetchDashboards();
          }
        } catch (e) {
          clearInterval(syncPollRef.current);
        }
      }, 1500);
    } catch (err) {
      alert('Erro ao disparar sincronização');
    }
  };

  const handleSendEmailSummary = async () => {
    try {
      const res = await axios.post('/api/dashboards/enviar-resumo-email', { setorId: selectedSectorId });
      alert(res.data.message || 'Solicitação de envio concluída!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar resumo por e-mail.');
    }
  };

  // --- PLANO DE AÇÃO HANDLERS ---
  const openPlanoModal = async (ind, valorAtual = '', metaVal = '') => {
    setPlanoIndicador(ind);
    const defaultComp = endDate ? `${endDate.substring(5, 7)}/${endDate.substring(0, 4)}` : '';
    const activeMeta = getActiveMeta(ind);
    setNovoPlano({
      competencia: defaultComp,
      valor_obtido: valorAtual !== '' ? valorAtual : '',
      meta_esperada: metaVal !== '' ? metaVal : (activeMeta ? activeMeta.valor_alvo : ''),
      justificativa: '',
      plano_acao: '',
      responsavel: '',
      prazo: '',
      status: 'PENDENTE'
    });
    try {
      const res = await axios.get(`/api/indicadores/${ind.id}/planos-acao`);
      setPlanosList(res.data);
    } catch (e) {
      setPlanosList(ind.planosAcao || []);
    }
  };

  const salvarPlanoAcao = async () => {
    if (!novoPlano.justificativa || !novoPlano.plano_acao) {
      return alert('Preencha a Justificativa e o Plano de Ação.');
    }
    try {
      const res = await axios.post(`/api/indicadores/${planoIndicador.id}/planos-acao`, novoPlano);
      setPlanosList([res.data, ...planosList]);
      setNovoPlano({ ...novoPlano, justificativa: '', plano_acao: '', responsavel: '', prazo: '' });
      alert('Plano de Ação registrado com sucesso!');
    } catch (err) {
      alert('Erro ao registrar Plano de Ação');
    }
  };

  const atualizarStatusPlano = async (planoId, status) => {
    try {
      const res = await axios.put(`/api/indicadores/planos-acao/${planoId}`, { status });
      setPlanosList(planosList.map(p => p.id === planoId ? res.data : p));
    } catch (e) {
      alert('Erro ao atualizar status');
    }
  };

  const excluirPlano = async (planoId) => {
    if (!window.confirm('Deseja excluir este Plano de Ação?')) return;
    try {
      await axios.delete(`/api/indicadores/planos-acao/${planoId}`);
      setPlanosList(planosList.filter(p => p.id !== planoId));
    } catch (e) {
      alert('Erro ao excluir plano');
    }
  };

  // --- EXPORTAÇÃO XLS INDIVIDUAL E COMPLETA (MÚLTIPLAS ABAS) ---
  const formatRowsForExport = (rows) => {
    return rows.map(row => {
      const cleanRow = {};
      Object.entries(row).forEach(([key, val]) => {
        const header = key.toUpperCase();
        if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
          cleanRow[header] = val.substring(0, 10).split('-').reverse().join('/');
        } else {
          cleanRow[header] = val;
        }
      });
      return cleanRow;
    });
  };

  const exportIndicatorXls = (ind, rows) => {
    if (!rows || rows.length === 0) {
      alert('Não há dados disponíveis para exportar no período selecionado.');
      return;
    }

    const formattedRows = formatRowsForExport(rows);
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    const sheetName = (ind.codigo ? `Ind_${ind.codigo}` : ind.nome || 'Indicador').replace(/[\\/?*\[\]:]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Dados');

    const safeFileName = (ind.nome || 'indicador')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 60);

    XLSX.writeFile(workbook, `${safeFileName}.xls`, { bookType: 'biff8' });
  };

  const exportAllDashboardXls = () => {
    if (!activeDash || !activeDash.indicadores || activeDash.indicadores.length === 0) {
      return alert('Nenhum indicador disponível para exportar.');
    }

    const workbook = XLSX.utils.book_new();
    let sheetsAdded = 0;
    const usedSheetNames = new Set();

    for (const di of activeDash.indicadores) {
      const ind = di.indicador;
      const res = indicatorData[ind.id];
      if (!res || !res.data) continue;
      const rows = filterByDate(res.data, ind.coluna_x, startDate, endDate);
      if (!rows || rows.length === 0) continue;

      const formattedRows = formatRowsForExport(rows);
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      let baseName = (ind.codigo ? `${ind.codigo}_${ind.nome}` : ind.nome || `Ind_${ind.id}`)
        .replace(/[\\/?*\[\]:]/g, '')
        .substring(0, 28);
      if (!baseName) baseName = `Ind_${ind.id}`;
      let sheetName = baseName;
      let counter = 2;
      while (usedSheetNames.has(sheetName.toLowerCase())) {
        sheetName = `${baseName.substring(0, 25)}_${counter++}`;
      }
      usedSheetNames.add(sheetName.toLowerCase());

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      sheetsAdded++;
    }

    if (sheetsAdded === 0) {
      return alert('Não há dados no período selecionado para exportar.');
    }

    const sectorLabel = selectedSectorId === 'ALL'
      ? 'Todos_Setores'
      : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor');
    const safeSector = sectorLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    XLSX.writeFile(workbook, `Painel_${safeSector}_${startDate}_a_${endDate}.xlsx`);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Banner de Modo TV */}
      {tvMode && (
        <div
          onClick={toggleTvMode}
          style={{
            background: 'linear-gradient(90deg, #0f172a, #1e293b)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            border: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tv size={20} color="#00cbb4" />
            <strong>MODO TV ATIVO:</strong>
            <span>Setor Atual: <strong>{selectedSectorId === 'ALL' ? 'Todos os Setores' : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor')}</strong> (Rotação automática a cada 25s)</span>
          </div>
          <span style={{ background: '#ef4444', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Sair do Modo TV
          </span>
        </div>
      )}

      {/* Barra de Progresso de Sincronização em Tempo Real */}
      {syncProgress.running && (
        <div style={{
          background: 'var(--panel-bg)',
          border: '2px solid var(--primary)',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Sincronizando dados com o Firebird... ({syncProgress.current} de {syncProgress.total || '?'})
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {syncProgress.currentIndicator}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${syncProgress.total > 0 ? Math.min(100, Math.round((syncProgress.current / syncProgress.total) * 100)) : 20}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Dashboards</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>De:</span>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Até:</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
             <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '8px' }}>
               {[
                 { id: 'MES', label: 'Mês' },
                 { id: 'TRIMESTRE', label: 'Trim' },
                 { id: 'SEMESTRE', label: 'Sem' },
                 { id: 'ANO', label: 'Ano' },
                 { id: '12M', label: '12M' }
               ].map(p => (
                 <button
                   key={p.id}
                   type="button"
                   onClick={() => applyDatePreset(p.id)}
                   style={{ padding: '2px 6px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                 >
                   {p.label}
                 </button>
               ))}
             </div>
          </div>

          <select 
            value={selectedSectorId} 
            onChange={e => setSelectedSectorId(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          >
            <option value='ALL'>Todos os Meus Setores</option>
            {availableSectors.filter(s => userRole === 'ADMIN' || userRole === 'LEITURA' || userSectors.includes(s.id)).map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          {lastUpdate && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginRight: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Última atualização:</span>
              <strong style={{ color: 'var(--text-main)' }}>{lastUpdate}</strong>
            </div>
          )}

          <button onClick={handleSync} disabled={syncProgress.running} style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> {syncProgress.running ? 'Atualizando...' : 'Atualizar Agora'}
          </button>

          <button onClick={exportAllDashboardXls} title="Exportar todos os indicadores do setor em um único Excel com várias abas" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={15} color="#10b981" /> Exportar Painel
          </button>

          <button onClick={toggleTvMode} title="Modo TV / Apresentação com rotação automática" style={{ background: tvMode ? '#00cbb4' : 'var(--panel-bg)', color: tvMode ? '#fff' : 'var(--text-main)', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tv size={15} /> Modo TV
          </button>

          <button onClick={() => window.print()} style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🖨️ Imprimir
          </button>
          
          {userRole !== 'LEITURA' && <button onClick={saveLayout} style={{ background: 'var(--primary)', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={15}/> Salvar Posições
          </button>}
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
        <>
        {/* Farol Geral de Desempenho do Setor (Scorecard) */}
        {(() => {
          let dentroMeta = 0;
          let foraMeta = 0;
          let semMeta = 0;
          let somaPesos = 0;
          let somaPesosAtingidos = 0;

          for (const di of activeDash.indicadores) {
            const ind = di.indicador;
            const res = indicatorData[ind.id];
            const activeMeta = getActiveMeta(ind);
            const peso = ind.peso && ind.peso > 0 ? ind.peso : 1;

            if (!activeMeta || activeMeta.valor_alvo === null || activeMeta.valor_alvo === undefined || !ind.orientacao) {
              semMeta++;
              continue;
            }
            if (!res || !res.data) continue;
            const series = filterByDate(res.data, ind.coluna_x, startDate, endDate);
            if (!series || series.length === 0) continue;

            const lastItem = series[series.length - 1];
            const rawVal = getVal(lastItem, ind.coluna_y);
            const color = evaluateTargetColor(ind, rawVal, 'neutral');
            if (color === '#10b981') {
              dentroMeta++;
              somaPesos += peso;
              somaPesosAtingidos += peso;
            } else if (color === '#ef4444') {
              foraMeta++;
              somaPesos += peso;
            } else {
              semMeta++;
            }
          }

          const pctAtingimento = somaPesos > 0 ? Math.round((somaPesosAtingidos / somaPesos) * 100) : null;

          return (
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #10b98140', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🟢 Dentro da Meta</span>
                <strong style={{ fontSize: '1.3rem', color: '#10b981' }}>{dentroMeta}</strong>
              </div>
              <div style={{ background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ef444440', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔴 Fora da Meta</span>
                <strong style={{ fontSize: '1.3rem', color: '#ef4444' }}>{foraMeta}</strong>
              </div>
              <div style={{ background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⚪ Sem Meta</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>{semMeta}</strong>
              </div>
              <div style={{ background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🎯 Atingimento Ponderado</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{pctAtingimento !== null ? `${pctAtingimento}%` : '-'}</strong>
              </div>
            </div>
          );
        })()}

        <div className="print-only">
          Painel de Indicadores - {selectedSectorId === 'ALL' ? 'Todos os Setores' : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor')}
        </div>
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
            const activeMeta = getActiveMeta(ind);

            // Prepare TABLE sorting/filtering/totals if TABLE
            let tableRows = filteredData || [];
            const searchStr = (tableSearch[ind.id] || '').toLowerCase();
            if (ind.tipo_grafico === 'TABLE' && searchStr) {
              tableRows = tableRows.filter(r =>
                Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchStr))
              );
            }
            const sortCfg = tableSort[ind.id];
            if (ind.tipo_grafico === 'TABLE' && sortCfg && sortCfg.col) {
              tableRows = [...tableRows].sort((a, b) => {
                const va = a[sortCfg.col];
                const vb = b[sortCfg.col];
                if (typeof va === 'number' && typeof vb === 'number') {
                  return sortCfg.dir === 'asc' ? va - vb : vb - va;
                }
                return sortCfg.dir === 'asc'
                  ? String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { numeric: true })
                  : String(vb ?? '').localeCompare(String(va ?? ''), 'pt-BR', { numeric: true });
              });
            }

            const tableCols = ((tableRows && tableRows[0]) || (res?.data && res.data[0]))
              ? Object.keys((tableRows && tableRows[0]) || res.data[0])
              : [];

            // Calculate Trend Variation (% vs previous period)
            let trendBadge = null;
            if (filteredData && filteredData.length >= 2 && ind.coluna_y && ind.tipo_grafico !== 'TABLE') {
              const lastRaw = getVal(filteredData[filteredData.length - 1], ind.coluna_y);
              const prevRaw = getVal(filteredData[filteredData.length - 2], ind.coluna_y);
              const vLast = typeof lastRaw === 'string' ? parseFloat(lastRaw.replace(',', '.')) : lastRaw;
              const vPrev = typeof prevRaw === 'string' ? parseFloat(prevRaw.replace(',', '.')) : prevRaw;
              if (typeof vLast === 'number' && typeof vPrev === 'number' && !isNaN(vLast) && !isNaN(vPrev) && vPrev !== 0) {
                const diffPct = ((vLast - vPrev) / Math.abs(vPrev)) * 100;
                const isUp = diffPct >= 0;
                let badgeColor = '#64748b';
                if (ind.orientacao === 'Maior Melhor') badgeColor = isUp ? '#10b981' : '#ef4444';
                if (ind.orientacao === 'Menor Melhor') badgeColor = isUp ? '#ef4444' : '#10b981';
                trendBadge = (
                  <span title="Variação em relação ao período imediatamente anterior" style={{ marginLeft: '6px', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${badgeColor}18`, color: badgeColor }}>
                    {isUp ? '▲' : '▼'} {diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%
                  </span>
                );
              }
            }

            return (
              <div key={ind.id.toString()} data-grid={layout.find(l => l.i === ind.id.toString()) || { x: 0, y: 0, w: 6, h: 12, minW: 3, minH: 6 }} style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{ind.nome}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                      {activeMeta && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Meta: <strong>{activeMeta.valor_alvo} {ind.unidade_medida || ''}</strong> {ind.orientacao ? `(${ind.orientacao})` : ''}
                        </span>
                      )}
                      {trendBadge}
                    </div>
                  </div>
                  <div className="no-print" onMouseDown={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Expandir Gráfico / Tabela em Tela Cheia"
                      onClick={() => setExpandedIndicador(ind)}
                      style={{ padding: '4px 6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Ficha Técnica do Indicador (Fórmula, Fonte, Metas)"
                      onClick={() => setFichaIndicador(ind)}
                      style={{ padding: '4px 6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                    <button
                      type="button"
                      title="Justificativa / Plano de Ação (SGQ)"
                      onClick={() => openPlanoModal(ind)}
                      style={{ padding: '4px 6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <ClipboardList size={13} />
                    </button>
                    <button
                      type="button"
                      title="Atualizar apenas este indicador agora"
                      onClick={() => refreshSingleIndicator(ind.id)}
                      style={{ padding: '4px 6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <RefreshCw size={13} style={{ opacity: refreshingIds[ind.id] ? 0.5 : 1 }} />
                    </button>
                    {res && (
                      <button
                        type="button"
                        title="Baixar dados do indicador em XLS"
                        onClick={() => exportIndicatorXls(ind, filteredData || res.data)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Download size={13} /> XLS
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {res ? (
                    ind.tipo_grafico === 'CARD' ? (
                      (() => {
                        const rawCardVal = filteredData && filteredData[0] ? getVal(filteredData[0], ind.coluna_y) : 0;
                        const semColor = evaluateTargetColor(ind, rawCardVal, 'var(--primary)');
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', fontWeight: 'bold', color: semColor }}>
                            {filteredData && filteredData[0] ? (formatValue(rawCardVal) + (ind.unidade_medida ? ' ' + ind.unidade_medida : '')) : '0'}
                          </div>
                        );
                      })()
                    ) : ind.tipo_grafico === 'TABLE' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <div className="no-print" onMouseDown={e => e.stopPropagation()} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          <Search size={14} color="var(--text-muted)" />
                          <input
                            type="text"
                            placeholder="Filtrar na tabela..."
                            value={tableSearch[ind.id] || ''}
                            onChange={e => setTableSearch(prev => ({ ...prev, [ind.id]: e.target.value }))}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', fontSize: '0.8rem', width: '100%' }}
                          />
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: '4px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1, borderBottom: '2px solid var(--border)' }}>
                              <tr>
                                {tableCols.map((k, i) => (
                                  <th
                                    key={i}
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={() => {
                                      setTableSort(prev => {
                                        const cur = prev[ind.id];
                                        const nextDir = cur && cur.col === k && cur.dir === 'asc' ? 'desc' : 'asc';
                                        return { ...prev, [ind.id]: { col: k, dir: nextDir } };
                                      });
                                    }}
                                    style={{ padding: '8px', textAlign: 'left', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      {k.toUpperCase()}
                                      <ArrowUpDown size={11} color="var(--text-muted)" />
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableRows && tableRows.length > 0 ? tableRows.map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                                  {tableCols.map((colKey, cIdx) => {
                                    const val = row[colKey];
                                    return (
                                      <td key={cIdx} style={{ padding: '8px', color: 'var(--text-main)' }}>
                                        {typeof val === 'number' ? val.toLocaleString('pt-BR') : 
                                         (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) ? val.substring(0, 10).split('-').reverse().join('/') : 
                                         String(val ?? '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={tableCols.length || 1} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Nenhum registro encontrado no período selecionado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {tableRows && tableRows.length > 1 && (
                              <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--panel-bg)', borderTop: '2px solid var(--border)', fontWeight: 'bold' }}>
                                <tr>
                                  {tableCols.map((colKey, cIdx) => {
                                    if (cIdx === 0) return <td key={cIdx} style={{ padding: '8px', color: 'var(--primary)' }}>TOTAL / MÉDIA ({tableRows.length})</td>;
                                    const nums = tableRows.map(r => r[colKey]).filter(v => typeof v === 'number' && !isNaN(v));
                                    if (nums.length === tableRows.length && !/cod|id|reg|ano|mes/i.test(colKey)) {
                                      const sum = nums.reduce((a, b) => a + b, 0);
                                      const avg = sum / nums.length;
                                      return (
                                        <td key={cIdx} style={{ padding: '8px', color: 'var(--text-main)', fontSize: '0.78rem' }}>
                                          Σ {sum.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} | x̄ {avg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                        </td>
                                      );
                                    }
                                    return <td key={cIdx} style={{ padding: '8px' }}>-</td>;
                                  })}
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
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
        </>
      )}
      
      {!activeDash && dashboards.length > 0 && (
         <div style={{ color: 'var(--text-muted)' }}>Selecione um dashboard acima.</div>
      )}
      {dashboards.length === 0 && (
         <div style={{ color: 'var(--text-muted)' }}>Nenhum dashboard disponível para o seu setor.</div>
      )}

      {/* Modal de Ficha Técnica do Indicador */}
      {fichaIndicador && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', color: '#1e293b', padding: '24px', borderRadius: '10px', maxWidth: '580px', width: '92%', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              ℹ️ Ficha Técnica: {fichaIndicador.nome}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '16px' }}>
              <div><strong>Código:</strong> {fichaIndicador.codigo || '-'}</div>
              <div><strong>Categoria:</strong> {fichaIndicador.categoria || '-'} {fichaIndicador.subcategoria ? `/ ${fichaIndicador.subcategoria}` : ''}</div>
              <div><strong>Unidade de Medida:</strong> {fichaIndicador.unidade_medida || '-'}</div>
              <div><strong>Orientação:</strong> {fichaIndicador.orientacao || '-'}</div>
              <div><strong>Frequência:</strong> {fichaIndicador.frequencia || '-'}</div>
              <div><strong>Peso:</strong> {fichaIndicador.peso ?? '-'}</div>
            </div>
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <strong>Descrição:</strong>
              <p style={{ margin: '4px 0', background: '#f8fafc', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                {fichaIndicador.descricao || 'Não informada.'}
              </p>
            </div>
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <strong>Fórmula de Cálculo:</strong>
              <p style={{ margin: '4px 0', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                {fichaIndicador.desc_formula || 'Não informada.'}
              </p>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
              <strong>Fonte de Referência:</strong> {fichaIndicador.fonte_referencia || 'Não informada.'}
            </div>
            {fichaIndicador.metas && fichaIndicador.metas.length > 0 && (
              <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                <strong>Histórico de Metas Cadastradas:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                  {fichaIndicador.metas.map((m, i) => (
                    <li key={i}>
                      <strong>{m.valor_alvo} {fichaIndicador.unidade_medida || ''}</strong>
                      {m.competencia ? ` (Competência/Ano: ${m.competencia})` : ''}
                      {m.descricao ? ` - ${m.descricao}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setFichaIndicador(null)} style={{ padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Justificativa e Plano de Ação (SGQ) */}
      {planoIndicador && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', color: '#1e293b', padding: '24px', borderRadius: '10px', maxWidth: '680px', width: '94%', maxHeight: '88vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              📋 Análise Crítica e Plano de Ação: {planoIndicador.nome}
            </h3>

            {userRole !== 'LEITURA' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Registrar Nova Justificativa / Plano de Ação</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Competência</label>
                    <input placeholder="Ex: 10/2026" value={novoPlano.competencia} onChange={e => setNovoPlano({ ...novoPlano, competencia: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Valor Obtido</label>
                    <input type="number" value={novoPlano.valor_obtido} onChange={e => setNovoPlano({ ...novoPlano, valor_obtido: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Meta Esperada</label>
                    <input type="number" value={novoPlano.meta_esperada} onChange={e => setNovoPlano({ ...novoPlano, meta_esperada: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Análise Crítica / Justificativa (Por que não atingiu a meta?)</label>
                  <textarea rows={2} value={novoPlano.justificativa} onChange={e => setNovoPlano({ ...novoPlano, justificativa: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Plano de Ação (O que será feito?)</label>
                  <textarea rows={2} value={novoPlano.plano_acao} onChange={e => setNovoPlano({ ...novoPlano, plano_acao: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Responsável</label>
                    <input value={novoPlano.responsavel} onChange={e => setNovoPlano({ ...novoPlano, responsavel: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Prazo</label>
                    <input placeholder="Ex: 30/11/2026" value={novoPlano.prazo} onChange={e => setNovoPlano({ ...novoPlano, prazo: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
                <button onClick={salvarPlanoAcao} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Salvar Plano de Ação
                </button>
              </div>
            )}

            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Histórico de Planos de Ação ({planosList.length})</h4>
            {planosList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhum plano de ação registrado para este indicador.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {planosList.map(p => (
                  <div key={p.id} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        <strong>Competência:</strong> {p.competencia || '-'} | <strong>Obtido:</strong> {p.valor_obtido ?? '-'} | <strong>Meta:</strong> {p.meta_esperada ?? '-'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={p.status}
                          disabled={userRole === 'LEITURA'}
                          onChange={e => atualizarStatusPlano(p.id, e.target.value)}
                          style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                        >
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                          <option value="CONCLUIDO">CONCLUÍDO</option>
                        </select>
                        {userRole !== 'LEITURA' && (
                          <button onClick={() => excluirPlano(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}><strong>Justificativa:</strong> {p.justificativa}</div>
                    <div style={{ fontSize: '0.88rem', marginBottom: '4px' }}><strong>Plano de Ação:</strong> {p.plano_acao}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Responsável: {p.responsavel || '-'} | Prazo: {p.prazo || '-'} | Criado em: {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setPlanoIndicador(null)} style={{ padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Expandir Gráfico / Tabela (Zoom em Tela Cheia) */}
      {expandedIndicador && indicatorData[expandedIndicador.id] && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '24px', borderRadius: '12px', width: '92vw', height: '86vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{expandedIndicador.nome}</h2>
                {expandedIndicador.descricao && <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{expandedIndicador.descricao}</p>}
              </div>
              <button onClick={() => setExpandedIndicador(null)} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                ✕ Fechar
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {(() => {
                const resExp = indicatorData[expandedIndicador.id];
                const filtExp = filterByDate(resExp.data, expandedIndicador.coluna_x, startDate, endDate) || [];
                if (expandedIndicador.tipo_grafico === 'TABLE') {
                  const colsExp = filtExp[0] ? Object.keys(filtExp[0]) : [];
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', borderBottom: '2px solid var(--border)' }}>
                        <tr>
                          {colsExp.map((k, i) => <th key={i} style={{ padding: '10px', textAlign: 'left' }}>{k.toUpperCase()}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filtExp.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                            {colsExp.map((cKey, cIdx) => {
                              const val = row[cKey];
                              return (
                                <td key={cIdx} style={{ padding: '10px' }}>
                                  {typeof val === 'number' ? val.toLocaleString('pt-BR') :
                                   (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) ? val.substring(0, 10).split('-').reverse().join('/') :
                                   String(val ?? '')}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                }
                return (
                  <ReactECharts
                    option={getOption(expandedIndicador, resExp, filtExp)}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Metas Não Alcançadas */}
      {showUnmetModal && unmetTargets.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '560px', width: '92%', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Metas Não Alcançadas
            </h2>
            <p style={{ color: '#475569', marginBottom: '16px' }}>Os seguintes indicadores não atingiram a meta no período selecionado:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
              {unmetTargets.map((t, idx) => (
                <li key={idx} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <strong style={{ color: '#1e293b' }}>{t.nome}</strong><br/>
                    <span style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>
                      Atual: {t.valor_atual.toLocaleString('pt-BR')} {t.unidade} | Meta: {t.meta.toLocaleString('pt-BR')} {t.unidade}
                    </span>
                  </div>
                  {t.indicadorObj && (
                    <button
                      onClick={() => {
                        setShowUnmetModal(false);
                        openPlanoModal(t.indicadorObj, t.valor_atual, t.meta);
                      }}
                      style={{ padding: '6px 10px', background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0 }}
                    >
                      📋 Justificar / Plano
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleSendEmailSummary} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <Mail size={15} /> Enviar Resumo por E-mail
              </button>
              <button onClick={() => setShowUnmetModal(false)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Ciente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
