const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/config.js', 'utf8');

// Strip all exports and previously appended code
let cleanCode = code.replace(/module\.exports = router;[\s\S]*/, '');

cleanCode += `
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.logSincronizacao.findMany({
      orderBy: { data: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch(e) {
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

module.exports = router;
`;

fs.writeFileSync('backend/src/routes/config.js', cleanCode, 'utf8');
