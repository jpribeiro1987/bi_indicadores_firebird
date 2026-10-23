import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Calendar, Tag, Search } from 'lucide-react';

const UPDATES_HISTORY = [
  {
    versao: 'v2.7.0',
    data: '23/10/2026',
    titulo: 'Ranking de Setores, Semáforo 3 Cores (Tolerância), Drill-Down nos Gráficos, Favoritos, Rollback SQL e Cobrança SGQ',
    destaque: true,
    itens: [
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Ranking Comparativo entre Setores (Visão Diretoria)',
        descricao: 'Ao visualizar "Todos os Setores", exibe automaticamente o Ranking Comparativo de Desempenho por Setor com o % de Atingimento Ponderado, contadores 🟢/🟡/🔴 e Planos de Ação pendentes. Clicar em um setor filtra o painel imediatamente.'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Semáforo de 3 Cores com Faixa de Tolerância (🟢 Verde / 🟡 Amarelo / 🔴 Vermelho)',
        descricao: 'Suporte a margem de tolerância percentual configurável por indicador (padrão 5%), destacando em Amarelo (Atenção) resultados próximos da meta e em Vermelho (Crítico) resultados fora da tolerância.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Farol Clicável + Indicadores Favoritos (⭐) + Troca de Gráfico em Tempo Real',
        descricao: 'Os contadores do Farol Geral agora filtram os cards na tela ao clicar (Na Meta, Atenção, Crítico, Favoritos). Adicionado botão de Estrela (⭐) para fixar KPIs prioritários no topo e seletor rápido no card para alternar entre Barras, Linha, Área, Pizza, Tabela ou Card.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Inspeção / Drill-Down ao Clicar em uma Barra ou Ponto do Gráfico',
        descricao: 'Clicar em qualquer período de um gráfico abre o modal de Inspeção do Período com valor apurado, meta, desvio percentual, histórico de ações e atalho para registrar um Plano de Ação já preenchido com aquela competência.'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Edição Completa de Planos de Ação e Cobrança de Pendentes por E-mail (SGQ)',
        descricao: 'Na Central de Planos de Ação (SGQ), agora é possível editar todos os campos do plano (Competência, Justificativa, Ação, Responsável, Prazo e Status) e disparar cobrança automática por e-mail dos planos pendentes ou vencidos.'
      },
      {
        categoria: 'Construtor de BI',
        titulo: 'Histórico de Versões SQL (Rollback em 1 Clique), Ordem (↑/↓) e Monitor de Performance',
        descricao: 'Guarda automaticamente as últimas 10 versões da Query SQL ao editar um indicador (permitindo restaurar versões anteriores com 1 clique), exibe a velocidade da última sincronização (⚡/🐢 em segundos) e permite reordenar a prioridade dos indicadores (↑/↓).'
      }
    ]
  },
  {
    versao: 'v2.6.0',
    data: '23/10/2026',
    titulo: 'Central SGQ, Farol Ponderado do Setor, Tendência %, Linha de Média, Zoom em Tela Cheia, Backup JSON e Auditoria',
    destaque: false,
    itens: [
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Farol Geral de Desempenho do Setor (Scorecard Ponderado)',
        descricao: 'Adicionada barra executiva no topo do Dashboard contabilizando indicadores Dentro da Meta (🟢), Fora da Meta (🔴), Sem Meta (⚪) e o Índice de Atingimento Ponderado (%) do setor com base no peso de cada indicador.'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Indicador de Tendência (▲ / ▼ %) e Linha de Média Histórica nos Gráficos',
        descricao: 'Exibição automática da variação percentual entre os dois últimos períodos nos cards (colorida conforme Maior/Menor Melhor) e adição da Linha de Média Histórica (pontilhada azul) junto à linha de Meta.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Atalhos Rápidos de Período (1-Clique) e Modo Expandir Gráfico (Zoom)',
        descricao: 'Botões rápidos de período (Mês, Trim, Sem, Ano, 12M) na barra de filtros do Dashboard e botão de Maximizar (⛶) em cada card para inspecionar gráficos ou tabelas extensas em tela cheia.'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Central de Planos de Ação (Nova Aba SGQ)',
        descricao: 'Nova tela dedicada à Gestão da Qualidade consolidando todos os Planos de Ação e Análises Críticas de todos os setores, com contadores de Prazo Vencido, filtros por setor/status/competência, atualização rápida de status e exportação XLS.'
      },
      {
        categoria: 'Construtor de BI',
        titulo: 'Backup / Importação de Indicadores em JSON e Tempo de Execução SQL',
        descricao: 'Exportação e importação em lote de definições de indicadores (.json) para backup ou migração, além de medição em segundos da duração de cada consulta SQL no botão "Testar Query" e nos Logs.'
      },
      {
        categoria: 'Logs & Sincronização',
        titulo: 'Trilha de Auditoria de Alterações',
        descricao: 'Registro automático de criação, edição, clonagem, exclusão, importação de indicadores e abertura de planos de ação nos Logs do sistema com identificação do usuário.'
      }
    ]
  },
  {
    versao: 'v2.5.0',
    data: '23/10/2026',
    titulo: 'Plano de Ação SGQ, Modo TV, Semáforo de Metas, Progresso em Tempo Real e Exportação Multi-Abas',
    destaque: false,
    itens: [
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Análise Crítica e Plano de Ação (SGQ) para Indicadores',
        descricao: 'Adicionado registro e acompanhamento de Justificativas e Planos de Ação diretamente nos cards dos indicadores e no pop-up de Metas Não Alcançadas, com controle de Competência, Responsável, Prazo e Status (Pendente, Em Andamento, Concluído).'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Cores Condicionais Automáticas (Semáforo) e Histórico de Metas por Competência',
        descricao: 'Gráficos de Barras e Cards Numéricos agora mudam automaticamente para Verde (meta atingida) ou Vermelho (abaixo da meta) com base na orientação do indicador. Adicionado suporte a múltiplas metas por Ano/Competência.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Atualização Individual por Indicador, Ficha Técnica [i] e Modo TV',
        descricao: 'Adicionado botão para atualizar apenas um indicador específico no Firebird sem recarregar o painel todo, botão de Ficha Técnica (exibindo fórmula, fonte e metas) e Modo TV em tela cheia com rotação automática entre setores a cada 25 segundos.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Busca, Ordenação por Coluna e Total/Média nas Tabelas de Dados',
        descricao: 'Indicadores do tipo Tabela de Dados agora contam com filtro rápido de texto, ordenação crescente/decrescente ao clicar no título da coluna e linha automática de Soma (Σ) e Média (x̄) no rodapé.'
      },
      {
        categoria: 'Logs & Sincronização',
        titulo: 'Barra de Progresso em Tempo Real e Parâmetros Dinâmicos (:DATA_INICIO e :DATA_FIM)',
        descricao: 'Ao clicar em "Atualizar Agora", o painel exibe uma barra de progresso em tempo real mostrando qual indicador está sendo processado e recarrega os gráficos automaticamente ao concluir. Suporte às variáveis :DATA_INICIO e :DATA_FIM nas queries SQL.'
      },
      {
        categoria: 'Exportação',
        titulo: 'Exportar Painel Completo em Excel (Múltiplas Abas), Clonar Indicador e Resumo por E-mail',
        descricao: 'Adicionado botão "Exportar Painel" que gera uma única planilha .xlsx onde cada indicador do setor vira uma aba, botão de Duplicar/Clonar indicador no Construtor de BI e envio de resumo por e-mail dos indicadores fora da meta.'
      }
    ]
  },
  {
    versao: 'v2.4.0',
    data: '19/10/2026',
    titulo: 'Exportação XLS, Sincronização por Setor e Filtro em Tabelas',
    destaque: false,
    itens: [
      {
        categoria: 'Logs & Sincronização',
        titulo: 'Aumento do Timeout de Consultas SQL para 120 Segundos',
        descricao: 'Ampliado o tempo limite de execução de consultas SQL no Firebird (e no proxy Nginx) de 30 segundos para 120 segundos, evitando cancelamentos em queries mais pesadas.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Atualização imediata apenas do Setor selecionado',
        descricao: 'Ao selecionar um setor específico no filtro do Dashboard e clicar em "Atualizar Agora", o sistema sincroniza no Firebird exclusivamente os indicadores daquele setor, reduzindo drasticamente o tempo de espera e registrando o setor no Log de Sincronização.'
      },
      {
        categoria: 'Exportação',
        titulo: 'Download de dados em XLS por Indicador',
        descricao: 'Adicionado botão "XLS" no canto superior direito de cada card de indicador nos Dashboards, permitindo baixar os dados filtrados pelo período selecionado diretamente em planilha Excel (.xls).'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Filtro de Datas em gráficos do tipo Tabela de Dados',
        descricao: 'Ajustado o filtro de período (De / Até) do Dashboard para identificar automaticamente colunas de data ou competência (MES_ANO, DATA, COMPETENCIA, etc.) em indicadores do tipo Tabela de Dados, suportando formatos mensais (MM/AAAA) e datas completas.'
      }
    ]
  },
  {
    versao: 'v2.3.0',
    data: '02/10/2026',
    titulo: 'Metas nos Gráficos, Alertas de Metas e Nova Tela de Login',
    destaque: false,
    itens: [
      {
        categoria: 'Interface & Login',
        titulo: 'Nova Tela de Login com Tema Escuro Padrão Independente',
        descricao: 'Adicionado plano de fundo personalizado do Hospital Santo Antônio na tela de login com card em efeito glassmorphism ajustado. A tela de login utiliza o Tema Escuro por padrão, enquanto o interior do sistema mantém o Tema Claro como padrão.'
      },
      {
        categoria: 'Dashboards & Metas',
        titulo: 'Linha de Meta nos Gráficos e Pop-up de Metas Não Alcançadas',
        descricao: 'Exibição da linha tracejada vermelha indicando a meta cadastrada diretamente nos gráficos. Caso algum indicador do painel não atinja a meta no período selecionado (considerando a orientação Maior Melhor ou Menor Melhor), um pop-up de alerta é exibido automaticamente listando o valor atual e a meta esperada.'
      },
      {
        categoria: 'Construtor de BI',
        titulo: 'Barra de Pesquisa de Indicadores Cadastrados',
        descricao: 'Adicionada busca em tempo real no Construtor de BI para filtrar indicadores já cadastrados por Nome, Código ou Categoria.'
      },
      {
        categoria: 'Logs & Sincronização',
        titulo: 'Retenção Automática de Logs por 15 Dias',
        descricao: 'Implementada limpeza automática na rotina de sincronização para manter apenas os registros dos últimos 15 dias na tabela de Logs do Sistema.'
      }
    ]
  },
  {
    versao: 'v2.2.0',
    data: '02/10/2026',
    titulo: 'Gestão de Unidades de Medida, Frequências de Apuração e Impressão A4',
    destaque: false,
    itens: [
      {
        categoria: 'Construtor de BI',
        titulo: 'Gerenciamento Dinâmico de Frequência de Apuração',
        descricao: 'Criado cadastro e modal (+ Gerenciar) para adicionar, listar e excluir Frequências de Apuração (Diário, Semanal, Mensal, Bimestral, Semestral, Anual, etc.) armazenadas no banco de dados.'
      },
      {
        categoria: 'Construtor de BI',
        titulo: 'Gerenciamento Dinâmico de Unidades de Medida',
        descricao: 'Unificado o seletor de Unidade de Medida no formulário de indicadores com modal dedicado (+ Gerenciar Unidades) para cadastrar nome e símbolo das unidades e exibi-las nos gráficos e cards.'
      },
      {
        categoria: 'Impressão',
        titulo: 'Impressão de Dashboards em Paisagem (Landscape) com Cabeçalho do Setor',
        descricao: 'Configurada a impressão dos Dashboards para forçar orientação Paisagem (A4 Landscape), exibindo o nome do setor selecionado no topo da folha e ajustando proporcionalmente a escala dos gráficos sem cortes ou barras de rolagem.'
      }
    ]
  },
  {
    versao: 'v2.1.0',
    data: '01/10/2026',
    titulo: 'Perfil de Leitura, Manual do Sistema e Auditoria de Sincronização',
    destaque: false,
    itens: [
      {
        categoria: 'Permissões',
        titulo: 'Ajuste do Perfil LEITURA nos Dashboards',
        descricao: 'Usuários com perfil LEITURA têm permissão para visualizar os painéis de todos os setores, ocultando o botão de salvar posições do layout.'
      },
      {
        categoria: 'Documentação',
        titulo: 'Manual do Sistema Integrado',
        descricao: 'Adicionada aba exclusiva para Administradores contendo o Manual Completo de Utilização do Sistema de Indicadores Hospitalar.'
      },
      {
        categoria: 'Logs & Sincronização',
        titulo: 'Painel de Logs do Sistema e Última Atualização',
        descricao: 'Criada a aba Logs do Sistema detalhando data/hora, gatilho (Automático ou Manual), status e nomes dos indicadores em caso de falha, além de exibir no topo do Dashboard o horário da última sincronização bem-sucedida.'
      },
      {
        categoria: 'Dashboards',
        titulo: 'Layouts Independentes por Setor',
        descricao: 'Possibilidade de organizar, redimensionar e salvar as posições dos gráficos de forma independente para cada setor selecionado.'
      }
    ]
  }
];

export default function Atualizacoes() {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  const categorias = [
    'TODAS',
    ...Array.from(new Set(UPDATES_HISTORY.flatMap(v => v.itens.map(i => i.categoria))))
  ];

  const versoesFiltradas = UPDATES_HISTORY.map(bloco => {
    const itensFiltrados = bloco.itens.filter(item => {
      const matchCat = categoriaFiltro === 'TODAS' || item.categoria === categoriaFiltro;
      const termo = busca.toLowerCase();
      const matchTexto =
        !termo ||
        item.titulo.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo) ||
        bloco.versao.toLowerCase().includes(termo) ||
        bloco.titulo.toLowerCase().includes(termo);
      return matchCat && matchTexto;
    });
    return { ...bloco, itens: itensFiltrados };
  }).filter(bloco => bloco.itens.length > 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={28} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Últimas Atualizações do Sistema</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Histórico das principais melhorias, novos recursos e correções implementadas (visível apenas para Administradores).
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtro por Categoria */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Pesquisar atualização por palavra-chave..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '0.95rem' }}
          />
        </div>

        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }}
        >
          {categorias.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'TODAS' ? 'Todas as Categorias' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Versões e Atualizações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {versoesFiltradas.map((bloco, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--panel-bg)',
              borderRadius: '12px',
              border: bloco.destaque ? '2px solid var(--primary)' : '1px solid var(--border)',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  background: bloco.destaque ? 'var(--primary)' : 'rgba(59, 130, 246, 0.15)',
                  color: bloco.destaque ? '#fff' : 'var(--primary)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {bloco.versao}
                </span>
                {bloco.destaque && (
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontWeight: 600,
                    fontSize: '0.78rem'
                  }}>
                    MAIS RECENTE
                  </span>
                )}
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{bloco.titulo}</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                <span>{bloco.data}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bloco.itens.map((item, iIdx) => (
                <div
                  key={iIdx}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    background: 'var(--bg-main)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <CheckCircle2 size={20} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--primary)'
                      }}>
                        <Tag size={11} /> {item.categoria}
                      </span>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{item.titulo}</strong>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      {item.descricao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {versoesFiltradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Nenhuma atualização encontrada para o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  );
}
