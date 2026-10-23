import React, { useState } from 'react';
import { 
  FileText, LayoutDashboard, ClipboardList, Database, Settings, 
  Activity, Sparkles, Search, CheckCircle2, AlertTriangle, Clock, 
  Download, Tv, Star, Camera, History, Shield, Mail, ArrowUpDown
} from 'lucide-react';

export default function Manual() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('todos');

  const sections = [
    { id: 'todos', label: 'Manual Completo' },
    { id: 'dashboards', label: '1. Dashboards & BI' },
    { id: 'sgq', label: '2. Central SGQ (Planos de Ação)' },
    { id: 'construtor', label: '3. Construtor de BI' },
    { id: 'configuracoes', label: '4. Configurações & SMTP' },
    { id: 'logs', label: '5. Logs & Auditoria' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', background: 'var(--bg-main)' }}>
      {/* Header */}
      <div style={{ background: 'var(--panel-bg)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <FileText size={32} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Manual do Usuário e Guia de Operação</h1>
        </div>
        <p style={{ margin: '4px 0 16px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Documentação oficial e guia passo a passo do <strong>Sistema de Indicadores Hospitalar (BI & SGQ)</strong> — Versão 2.8.0.
        </p>

        {/* Barra de Filtro / Navegação Rápida */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: activeSection === sec.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: activeSection === sec.id ? 'var(--primary)' : 'var(--bg-main)',
                color: activeSection === sec.id ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--panel-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.65' }}>
        
        {/* INTRODUÇÃO */}
        {(activeSection === 'todos') && (
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
            <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Visão Geral e Perfis de Acesso</h2>
            <p>
              O <strong>Sistema de Indicadores Hospitalar</strong> integra visualizações executivas de Business Intelligence (BI) com a 
              rotina de Gestão da Qualidade Hospitalar (SGQ / ONA / ISO 9001), extraindo dados em tempo real do banco Firebird.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong style={{ color: '#3b82f6' }}>👤 Perfil Leitura</strong>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Acesso para consulta aos Dashboards dos setores autorizados, exportação de relatórios em Excel/imagem e visualização de fichas técnicas.
                </p>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong style={{ color: '#10b981' }}>🩺 Perfil Gestor</strong>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Líderes de setor e qualidade. Permite personalizar e salvar layouts, registrar Justificativas e Planos de Ação (SGQ) e avaliar eficácia PDCA.
                </p>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong style={{ color: '#8b5cf6' }}>⚙️ Perfil Administrador (ADMIN)</strong>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Acesso irrestrito a todos os setores, Construtor de BI (SQL), cadastro de usuários/permissões, configurações SMTP, backups e auditoria.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. DASHBOARDS */}
        {(activeSection === 'todos' || activeSection === 'dashboards') && (
          <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '28px' }}>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <LayoutDashboard size={24} /> 1. Dashboards e Gestão à Vista (BI)
            </h2>
            <p>A aba <strong>Dashboards (BI)</strong> é a tela principal de acompanhamento operacional e executivo.</p>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>1.1. Barra de Controles e Filtros Rápidos</h3>
            <ul>
              <li><strong>Atalhos de Período (1-Clique)</strong>: Botões <code>Mês</code>, <code>Trim</code>, <code>Sem</code>, <code>Ano</code> e <code>12M</code> para ajustar instantaneamente o período das datas <code>De:</code> e <code>Até:</code>.</li>
              <li><strong>Filtro por Setor</strong>: Escolha um setor específico para focar seus indicadores ou "Todos os Meus Setores".</li>
              <li><strong>Filtro por Categoria</strong>: Permite filtrar os indicadores em tela por categoria (ex: <em>Assistencial, Financeiro, Apoio</em>).</li>
              <li><strong>Busca Rápida</strong>: Campo para localizar qualquer indicador digitando parte do nome ou código.</li>
              <li><strong>Atualizar Agora</strong>: Força a sincronização dos dados no Firebird. Quando um setor específico está filtrado, o sistema atualiza exclusivamente os indicadores daquele setor, reduzindo o tempo de espera.</li>
              <li><strong>Exportar Painel</strong>: Gera uma única planilha Excel (<code>.xlsx</code>) em que cada indicador do setor vira uma aba própria.</li>
              <li><strong>Modo TV</strong>: Entra em tela cheia com rotação automática entre setores a cada 25 segundos (ideal para TVs e recepções).</li>
            </ul>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>1.2. Farol Geral de Desempenho e Ranking de Setores</h3>
            <ul>
              <li><strong>Farol Geral Ponderado (Clicável)</strong>: Exibe os contadores 🟢 Na Meta, 🟡 Atenção, 🔴 Crítico, ⭐ Favoritos e 🎯 Atingimento Ponderado (ponderado pelo <code>peso</code> de cada indicador). Clicar em qualquer um dos blocos filtra na hora os indicadores correspondentes.</li>
              <li><strong>Ranking Comparativo por Setor</strong>: Quando "Todos os Meus Setores" está ativo, um bloco recolhido exibe o ranking dos setores ordenados por atingimento ponderado. Clique no setor para filtrá-lo.</li>
            </ul>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>1.3. Recursos em Cada Card de Indicador</h3>
            <ul>
              <li><strong>⭐ Favoritar</strong>: Clique na estrela para fixar os indicadores prioritários no topo do painel.</li>
              <li><strong>Seletor em Tempo Real</strong>: Alterne na hora o gráfico para Barras, Linha, Área, Pizza, Pareto, Velocímetro (Gauge), Tabela ou Card sem modificar o cadastro original.</li>
              <li><strong>📷 PNG</strong>: Baixe a imagem do gráfico em alta resolução para apresentações em slides ou reuniões de diretoria.</li>
              <li><strong>⛶ Maximizar (Zoom)</strong>: Expande o gráfico ou tabela em tela cheia (92vw x 86vh).</li>
              <li><strong>ℹ️ Ficha Técnica</strong>: Exibe fórmula de cálculo, fonte de referência, peso, orientação e histórico de metas.</li>
              <li><strong>📋 Plano de Ação (SGQ)</strong>: Abre a análise crítica e o plano corretivo.</li>
              <li><strong>🔎 Inspeção / Drill-Down</strong>: Clicar em qualquer ponto ou barra do gráfico abre a inspeção com valor apurado, meta, desvio percentual e botão direto para abrir um plano de ação preenchido com aquela competência.</li>
              <li><strong>Tendência (▲ / ▼ %)</strong>: Mostra a variação percentual frente ao período anterior, colorida conforme a orientação (Maior Melhor ou Menor Melhor).</li>
              <li><strong>Linha de Média e Meta</strong>: Linha azul pontilhada (média histórica) e linha vermelha tracejada (meta vigente).</li>
              <li><strong>Resumo Estatístico no Rodapé</strong>: Mínimo, Máximo, Média (x̄) e Total Acumulado (Σ) calculados no período filtrado.</li>
              <li><strong>Tabelas de Dados</strong>: Contam com filtro interno de texto, ordenação de colunas e linha de Total/Média no rodapé.</li>
              <li><strong>Salvar Posições</strong>: Arraste e redimensione os cards livremente. Clique em "Salvar Posições" para memorizar o layout daquele setor.</li>
            </ul>
          </div>
        )}

        {/* 2. SGQ PLANOS DE ACAO */}
        {(activeSection === 'todos' || activeSection === 'sgq') && (
          <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '28px' }}>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <ClipboardList size={24} /> 2. Central de Planos de Ação (SGQ / ONA / PDCA)
            </h2>
            <p>
              Aba dedicada à Gestão da Qualidade Hospitalar para controle de não conformidades e desvios de metas.
            </p>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>2.1. Funcionalidades da Central SGQ</h3>
            <ul>
              <li><strong>Cards de Indicadores de Qualidade</strong>: Total de Planos, Pendentes, Em Andamento, Concluídos e ⚠️ Prazo Vencido.</li>
              <li><strong>Filtros Avançados</strong>: Filtre por Setor, Status e busca rápida (responsável, competência ou texto da justificativa).</li>
              <li><strong>+ Novo Plano de Ação</strong>: Permite cadastrar um plano diretamente na Central SGQ selecionando o indicador em uma lista.</li>
              <li><strong>Ciclo PDCA e Verificação de Eficácia</strong>:
                <ul style={{ marginTop: '4px' }}>
                  <li>Status de Execução: <code>PENDENTE</code>, <code>EM ANDAMENTO</code>, <code>CONCLUÍDO</code>.</li>
                  <li>Avaliação de Eficácia: <code>⏳ A Avaliar</code>, <code>✅ Eficaz</code>, <code>❌ Ineficaz</code>.</li>
                  <li>Campo de Evidência / Parecer do Avaliador (obrigatório para acreditações ONA/ISO).</li>
                </ul>
              </li>
              <li><strong>Cobrar Pendentes por E-mail</strong>: Dispara um e-mail estruturado aos gestores e responsáveis com a relação dos planos pendentes e vencidos.</li>
              <li><strong>Exportar XLS</strong>: Gera relatório completo em Excel com histórico de ações, causas e eficácia.</li>
            </ul>
          </div>
        )}

        {/* 3. CONSTRUTOR DE BI */}
        {(activeSection === 'todos' || activeSection === 'construtor') && (
          <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '28px' }}>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Database size={24} /> 3. Construtor de BI (Criação e Gestão de Indicadores)
            </h2>
            <p>Ferramenta exclusiva para o perfil <strong>ADMIN</strong> criar consultas SQL no Firebird e parametrizar indicadores.</p>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>3.1. Modelos de Gráficos Disponíveis (17 Opções)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', margin: '12px 0' }}>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📊 <strong>Barras Verticais</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📑 <strong>Barras Horizontais (Ranking)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🎯 <strong>Pareto 80/20 (Qualidade SGQ)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📈 <strong>Combo (Barras + Tendência)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📉 <strong>Linhas Contínuas</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🪜 <strong>Linha em Degraus (Step)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🌊 <strong>Área Sombreada</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🥧 <strong>Pizza</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🍩 <strong>Rosca (Donut)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🔻 <strong>Funil de Conversão</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🧱 <strong>Mapa de Árvore (Treemap)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🕸️ <strong>Radar / Teia</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🧭 <strong>Polar Radial</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🏎️ <strong>Velocímetro de Meta (Gauge)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📍 <strong>Dispersão (Scatter)</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>📋 <strong>Tabela de Dados</strong></div>
              <div style={{ background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>🔢 <strong>Card Numérico</strong></div>
            </div>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>3.2. Parâmetros Dinâmicos e Semáforo de Tolerância</h3>
            <ul>
              <li><strong>Variáveis Dinâmicas SQL</strong>: Utilize <code>:DATA_INICIO</code> e <code>:DATA_FIM</code> na query. Elas são substituídas automaticamente pelas datas selecionadas no topo do Dashboard.</li>
              <li><strong>Faixa de Tolerância Amarela (%)</strong>: Configure a margem de tolerância (ex: 5%). Resultados próximos da meta ficam Amarelos (Atenção) e desvios maiores ficam Vermelhos (Crítico).</li>
              <li><strong>Peso</strong>: Valor ponderado para cálculo do % de Atingimento Geral no Farol e Ranking.</li>
              <li><strong>Histórico de Versões SQL (Rollback)</strong>: Guarda até 10 versões anteriores de cada query, permitindo restaurar uma versão com 1 clique caso uma edição cause erro.</li>
              <li><strong>Teste de Query na Tabela (▶)</strong>: Teste qualquer indicador com 1 clique na lista, exibindo se a query está <code>OK (X reg • Y.YYs)</code> ou detalhando o erro SQL.</li>
              <li><strong>Monitor de Performance SQL</strong>: Badge <code>⚡ &lt;3s</code> (verde) ou <code>🐢 &gt;10s</code> (vermelho) identificando queries pesadas no Firebird.</li>
              <li><strong>Backup / Importação JSON</strong>: Exporte ou importe o acervo de indicadores e suas metas em lote.</li>
            </ul>
          </div>
        )}

        {/* 4. CONFIGURACOES & SMTP */}
        {(activeSection === 'todos' || activeSection === 'configuracoes') && (
          <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '28px' }}>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Settings size={24} /> 4. Configurações Gerais, SMTP e Backups
            </h2>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>4.1. Servidor de E-mail (SMTP)</h3>
            <p>Configuração utilizada pelos envios automáticos e botões de cobrança de pendências:</p>
            <ul>
              <li><strong>Host SMTP</strong>: Endereço do servidor (ex: <code>smtp.gmail.com</code> ou <code>smtp.office365.com</code>).</li>
              <li><strong>Porta</strong>: Normalmente <code>587</code> (STARTTLS) ou <code>465</code> (SSL).</li>
              <li><strong>Usuário e Senha</strong>: Credenciais de autenticação (ou Senha de Aplicativo).</li>
              <li><strong>Remetente (From)</strong>: Nome e e-mail que aparecem na caixa de entrada (ex: <code>"Gestão da Qualidade" &lt;qualidade@hospital.com&gt;</code>).</li>
              <li><strong>Botão "Testar E-mail"</strong>: Permite disparar um e-mail de teste imediato para qualquer endereço antes de salvar.</li>
            </ul>

            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: '20px' }}>4.2. Automação de Cache e Backup do Sistema</h3>
            <ul>
              <li><strong>Horários de Consulta</strong>: Horários em que o sistema puxa dados do Firebird e grava no cache (ex: <code>06:00, 12:00, 18:00</code>).</li>
              <li><strong>Baixar Backup Completo</strong>: Gera um arquivo compactado <code>.zip</code> com todo o banco de dados e arquivos locais.</li>
              <li><strong>Restaurar Backup</strong>: Permite restaurar um arquivo <code>.zip</code> previamente gerado.</li>
            </ul>
          </div>
        )}

        {/* 5. LOGS & AUDITORIA */}
        {(activeSection === 'todos' || activeSection === 'logs') && (
          <div>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Activity size={24} /> 5. Logs do Sistema e Trilha de Auditoria
            </h2>
            <p>Painel de rastreabilidade para auditorias hospitalares, segurança e monitoramento de TI:</p>
            <ul>
              <li><strong>Filtros Rápidos</strong>: Alterne entre <code>Todos</code>, <code>Sincronizações</code>, <code>Auditoria</code> e <code>⚠️ Apenas Falhas</code>.</li>
              <li><strong>Trilha de Auditoria</strong>: Registra automaticamente criação, edição, clonagem, exclusão de indicadores e abertura de planos de ação SGQ.</li>
              <li><strong>Busca em Tempo Real</strong>: Localize logs pelo nome do indicador, setor ou mensagem de erro.</li>
              <li><strong>Exportar XLS</strong>: Gera relatório em planilha das execuções e eventos de auditoria.</li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
