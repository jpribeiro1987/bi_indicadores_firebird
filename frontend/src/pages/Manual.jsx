import React from 'react';

export default function Manual() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: 'var(--text-main)', background: 'var(--bg-main)' }}>
      <div style={{ background: 'var(--panel-bg)', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <h1 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', color: 'var(--primary)', marginBottom: '24px' }}>Manual do Usuário - Sistema de Indicadores Hospitalar</h1>
      
      <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>Bem-vindo ao manual completo de utilização do <strong>Sistema de Indicadores Hospitalar</strong>. Este documento descreve as funcionalidades do sistema e orienta passo a passo como utilizá-las de acordo com o seu perfil de acesso.</p>
      
      <p style={{ marginTop: '16px' }}>O sistema possui dois perfis principais:</p>
      <ol style={{ marginLeft: '24px', marginBottom: '32px', lineHeight: '1.6' }}>
        <li><strong>Perfil Usuário</strong>: Acesso focado na visualização, filtro e personalização dos painéis de indicadores (Dashboards) correspondentes aos seus setores.</li>
        <li><strong>Perfil Administrador (ADMIN)</strong>: Acesso total. Pode criar setores, gerenciar usuários, construir novos gráficos de BI, configurar a comunicação com o banco de dados do hospital e monitorar falhas.</li>
      </ol>

      <h2 style={{ color: 'var(--primary)', marginTop: '32px' }}>1. Visão Geral Básica (Ambos os Perfis)</h2>
      
      <h3 style={{ marginTop: '16px' }}>1.1. Acesso e Interface</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Login</strong>: Insira seu e-mail corporativo e senha fornecidos pela administração.</li>
        <li><strong>Menu Lateral (Sidebar)</strong>: Localizado à esquerda, permite navegar entre as páginas disponíveis para o seu perfil.</li>
        <li><strong>Tema (Claro/Escuro)</strong>: Na parte inferior do menu esquerdo, você pode alternar entre o modo noturno ou diurno clicando em "Tema Escuro / Tema Claro".</li>
        <li><strong>Sair</strong>: Finaliza sua sessão com segurança.</li>
      </ul>

      <h2 style={{ color: 'var(--primary)', marginTop: '32px' }}>2. Visão do Usuário (Painéis e Gráficos)</h2>
      <p>Esta é a aba principal do sistema, intitulada <strong>Dashboards (BI)</strong>, disponível para todos.</p>

      <h3 style={{ marginTop: '16px' }}>2.1. Navegação e Filtros</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Seleção de Setor</strong>: No menu suspenso do topo, você pode escolher visualizar "Todos os Meus Setores" simultaneamente ou selecionar um setor específico do qual você faz parte.</li>
        <li><strong>Filtro de Datas (De / Até)</strong>: Permite limitar a análise de todos os gráficos na tela para um período específico. Por padrão, ele vem pré-preenchido cobrindo exatamente os últimos 12 meses.</li>
        <li><strong>Atualizar Agora</strong>: Força o sistema a ir no servidor central e buscar dados novos em tempo real.</li>
        <li><strong>Última Atualização</strong>: Logo acima do botão de atualização, o sistema informa a data e a hora do último carregamento de dados bem-sucedido.</li>
        <li><strong>Imprimir</strong>: Oculta os menus laterais e ferramentas para impressão otimizada.</li>
      </ul>

      <h3 style={{ marginTop: '16px' }}>2.2. Personalização da Tela</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Redimensionar Gráficos</strong>: No canto inferior direito de cada gráfico há uma pequena alça. Clique e arraste para deixá-lo mais largo ou mais comprido.</li>
        <li><strong>Mover (Drag and Drop)</strong>: Clique no título (ou área livre) de qualquer gráfico, segure e arraste para reordená-los.</li>
        <li><strong>Salvar Posições</strong>: <strong>Atenção:</strong> as mudanças feitas só são gravadas se você clicar no botão roxo "Salvar Posições". Cada setor possui seu próprio layout.</li>
      </ul>

      <h2 style={{ color: 'var(--primary)', marginTop: '32px' }}>3. Visão do Administrador</h2>
      <p>Ao logar como <strong>ADMIN</strong>, novas abas surgirão no menu esquerdo, habilitando o total controle do sistema.</p>

      <h3 style={{ marginTop: '16px' }}>3.1. Aba "Usuários" (Gestão de Setores e Pessoas)</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Setores</strong>: Crie as "pastas" que abrigarão os gráficos (Ex: UTI, Administração, Recepção).</li>
        <li><strong>Usuários</strong>: Crie usuários, defina as senhas e atribua os perfis. Para usuários comuns, selecione quais setores eles poderão ver.</li>
      </ul>

      <h3 style={{ marginTop: '16px' }}>3.2. Aba "Construtor de BI" (Criação de Gráficos)</h3>
      <p>Ferramenta de geração dos gráficos em tempo real utilizando comandos SQL no banco Firebird.</p>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Nome e Setor</strong>: Defina o nome. Se não escolher setor, o gráfico será <strong>Global</strong> (visível para todos).</li>
        <li><strong>Tipo de Gráfico</strong>: CARD (Bloco numérico), LINHA (Evolução temporal) ou BARRA (Colunas).</li>
        <li><strong>Query SQL Obrigatória</strong>: 
            <ul style={{ marginLeft: '24px', marginTop: '8px' }}>
              <li><strong>CARD</strong>: A coluna devolvida deve ser apelidada de <code>TOTAL</code>.</li>
              <li><strong>LINHA/BARRA</strong>: O eixo X deve se chamar <code>MESANO</code>, o valor da coluna <code>PERCENTUAL</code>, e o limite de meta <code>META</code>.</li>
            </ul>
        </li>
      </ul>

      <h3 style={{ marginTop: '16px' }}>3.3. Aba "Configurações"</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li><strong>Banco de Dados (Firebird)</strong>: Configure IP, Caminho, Porta, Usuário e Senha.</li>
        <li><strong>Agendamento Automático</strong>: Digite horários separados por vírgula ou ponto e vírgula (Ex: <code>06:00; 12:00; 18:00</code>) para o sistema puxar dados sozinho.</li>
      </ul>

      <h3 style={{ marginTop: '16px' }}>3.4. Aba "Logs do Sistema"</h3>
      <ul style={{ marginLeft: '24px', marginBottom: '24px', lineHeight: '1.6' }}>
        <li>Painel de auditoria térmica. Mostra se o BI puxou os dados com SUCESSO ou se houve ERRO.</li>
        <li>Mostra exatamente qual gráfico falhou (ex: erro de SQL) para o Administrador arrumar.</li>
      </ul>
      
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', marginTop: '32px', lineHeight: '1.6' }}>
        <strong>Suporte Técnico:</strong> Em caso de erros na formatação visual "encavalada", garanta que os bloqueadores de limite mínimo na interface não estão barrando seu redimensionamento de janela e clique em <em>Salvar Posições</em>. Se os gráficos apresentarem erro de conteúdo, cheque os <em>Logs do Sistema</em>.
      </div>
      </div>
    </div>
  );
}
