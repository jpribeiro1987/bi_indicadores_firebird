import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Calendar, Tag, Search } from 'lucide-react';

const UPDATES_HISTORY = [
  {
    versao: 'v2.4.0',
    data: '19/10/2026',
    titulo: 'Exportação XLS, Sincronização por Setor e Filtro em Tabelas',
    destaque: true,
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
