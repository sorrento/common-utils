# Common Utils Repo

Librería independiente de utilidades reutilizables organizada por dominios.

## 📦 Estructura de Carpetas

```text
common-utils/
├── src/
│   ├── exporters/      <-- PDF, Excel, CSV, etc. (`exportToPdf`, `exportToExcel`)
│   ├── formatters/     <-- Fechas, números, monedas (`formatDate`, `formatCurrency`)
│   ├── hooks/          <-- React Hooks compartidos
│   └── helpers/        <-- Utilidades de validación y transformaciones
├── index.ts            <-- Re-exportador global único (Barrel Export)
├── package.json
├── README.md
└── USAGE.md
```

---

## 📖 Guía Rápida de Uso
Consulta el archivo **[`USAGE.md`](./USAGE.md)** para ver todos los ejemplos de código listos para copiar y pegar.

---

## 📋 Requisitos / Dependencias necesarias

```bash
npm install exceljs html2canvas jspdf
```

---

## 🚀 Cómo incorporarlo a un NUEVO proyecto

```bash
git submodule add https://github.com/sorrento/common-utils.git src/common-utils
```

### Importación única en tus componentes:
```typescript
import { exportToExcel, exportToPdf, formatDate, formatCurrency } from './common-utils';
```
