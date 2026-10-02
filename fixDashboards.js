const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboards.js', 'utf8');

// Include layouts in GET /
code = code.replace("include: { indicador: true }", "include: { indicador: true }\n          },\n          layouts: true");

// Change PUT /api/dashboards/:id/layout to save JSON
code = code.replace(/router\.put\('\/:id\/layout'[\s\S]*?res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{[\s\S]*?\}\n\}\);/, `router.put('/:id/layout', async (req, res) => {
  try {
    const { id } = req.params;
    const { layout, setorId } = req.body;

    const parsedSetorId = setorId === 'ALL' || !setorId ? null : parseInt(setorId);

    await prisma.dashboardLayout.upsert({
      where: {
        dashboardId_setorId: {
          dashboardId: parseInt(id),
          setorId: parsedSetorId || 0, // wait, setorId is Int?, so if null we can't use unique easily in some DBs.
        }
      },
      update: { layout_json: JSON.stringify(layout) },
      create: { dashboardId: parseInt(id), setorId: parsedSetorId, layout_json: JSON.stringify(layout) }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar layout' });
  }
});`);

// Fix unique constraint issue if we pass null to setorId. Prisma allows it but upserting on compound unique with null can be tricky.
// Wait, I will just delete and insert if it's easier, or use a custom field.

code = code.replace(/await prisma\.dashboardLayout\.upsert[\s\S]*?create:[\s\S]*?\}\n    \}\);/, `
    if (parsedSetorId === null) {
      const existing = await prisma.dashboardLayout.findFirst({ where: { dashboardId: parseInt(id), setorId: null } });
      if (existing) {
        await prisma.dashboardLayout.update({ where: { id: existing.id }, data: { layout_json: JSON.stringify(layout) } });
      } else {
        await prisma.dashboardLayout.create({ data: { dashboardId: parseInt(id), setorId: null, layout_json: JSON.stringify(layout) } });
      }
    } else {
      const existing = await prisma.dashboardLayout.findFirst({ where: { dashboardId: parseInt(id), setorId: parsedSetorId } });
      if (existing) {
        await prisma.dashboardLayout.update({ where: { id: existing.id }, data: { layout_json: JSON.stringify(layout) } });
      } else {
        await prisma.dashboardLayout.create({ data: { dashboardId: parseInt(id), setorId: parsedSetorId, layout_json: JSON.stringify(layout) } });
      }
    }`);

fs.writeFileSync('backend/src/routes/dashboards.js', code, 'utf8');
