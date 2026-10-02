const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

if (!code.includes('DashboardLayout')) {
    code += `
model DashboardLayout {
  id          Int       @id @default(autoincrement())
  dashboardId Int
  setorId     Int?      
  layout_json String    
  
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  setor       Setor?    @relation(fields: [setorId], references: [id], onDelete: Cascade)
  
  @@unique([dashboardId, setorId])
}
`;

    code = code.replace('indicadores DashboardIndicador[]', 'indicadores DashboardIndicador[]\n  layouts     DashboardLayout[]');
    code = code.replace('dashboards Dashboard[] @relation("DashboardSetor")', 'dashboards Dashboard[] @relation("DashboardSetor")\n  layouts DashboardLayout[]');

    fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
}
