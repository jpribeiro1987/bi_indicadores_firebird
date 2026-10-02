const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const replacement = `  const getDefaultStartDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };
  const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());`;

code = code.replace("  const [startDate, setStartDate] = useState('');\n  const [endDate, setEndDate] = useState('');", replacement);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
