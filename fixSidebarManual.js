const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Sidebar.jsx', 'utf8');

const navItemManual = `            <div 
              className={\`nav-item \${activeTab === 'manual' ? 'active' : ''}\`}
              onClick={() => setActiveTab('manual')}
            >
              <FileText size={20} />
              <span>Manual do Sistema</span>
            </div>
            </>`;

code = code.replace("</>", navItemManual);

fs.writeFileSync('frontend/src/components/Sidebar.jsx', code, 'utf8');
