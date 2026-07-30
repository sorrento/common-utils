# Common Utils Repo

Librería independiente de utilidades reutilizables (Exportadores a Excel y PDF con diseño enriquecido).

## 📦 Contenido
- `exportService.ts`: Funciones `exportToExcel` y `exportToPdf` con soporte para tarjetas KPI, tablas estilizadas, colores corporativos y descargas automáticas binarias (usando `ExcelJS`, `html2canvas` y `jsPDF`).

---

## 🚀 Cómo incorporarlo a un NUEVO proyecto

Tienes dos alternativas según la forma en la que prefieras trabajar:

### Método A: Como Git Submodule (Recomendado para iterar con IA)

Con este método la carpeta `src/common-utils` vive en tu nuevo proyecto y puedes modificarla con la IA en caliente.

1. **Añadir el submódulo a tu nuevo proyecto:**
   ```bash
   git submodule add https://github.com/tu-usuario/common-utils.git src/common-utils
   ```

2. **Asegurar dependencias en el `package.json` de tu nuevo proyecto:**
   ```bash
   npm install exceljs html2canvas jspdf
   ```

3. **Importar y usar en tus componentes:**
   ```typescript
   import { exportToExcel, exportToPdf } from './common-utils';
   ```

4. **Sincronizar cambios nuevos:**
   - Si haces mejoras dentro de `src/common-utils` en cualquier proyecto:
     ```bash
     cd src/common-utils
     git add .
     git commit -m "Mejora en exportador"
     git push
     ```
   - Para traer las últimas mejoras en otro proyecto:
     ```bash
     git submodule update --remote src/common-utils
     ```

---

### Método B: Instalación directa vía Git (Sin submódulo)

Si prefieres instalarlo como una dependencia de `npm` normal:

1. **En el `package.json` de tu nuevo proyecto:**
   ```json
   "dependencies": {
     "common-utils": "git+https://github.com/tu-usuario/common-utils.git#v1.0.0"
   }
   ```

2. **Instalar dependencias necesarias:**
   ```bash
   npm install exceljs html2canvas jspdf
   ```

3. **Importar y usar:**
   ```typescript
   import { exportToExcel, exportToPdf } from 'common-utils';
   ```
