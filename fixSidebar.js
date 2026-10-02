const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Sidebar.jsx', 'utf8');

const navItemConfig = `            <div 
              className={\`nav-item \${activeTab === 'configuracoes' ? 'active' : ''}\`}
              onClick={() => setActiveTab('configuracoes')}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </div>`;

const navItemLogs = `            <div 
              className={\`nav-item \${activeTab === 'configuracoes' ? 'active' : ''}\`}
              onClick={() => setActiveTab('configuracoes')}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </div>

            <div 
              className={\`nav-item \${activeTab === 'logs' ? 'active' : ''}\`}
              onClick={() => setActiveTab('logs')}
            >
              <Activity size={20} />
              <span>Logs do Sistema</span>
            </div>`;

// Replace broken characters
code = code.replace(/<span>Usuǭrios<\/span>/, '<span>Usuários</span>');
code = code.replace(/<span>Configuraes<\/span>/, '<span>Configurações</span>');

code = code.replace(`            <div \n              className={\`nav-item \${activeTab === 'configuracoes' ? 'active' : ''}\`}\n              onClick={() => setActiveTab('configuracoes')}\n            >\n              <Settings size={20} />\n              <span>Configurações</span>\n            </div>`, navItemLogs);

fs.writeFileSync('frontend/src/components/Sidebar.jsx', code, 'utf8');
