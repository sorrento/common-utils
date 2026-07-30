# Common Utils Repo

Librería compartida de utilidades reutilizables organizada por módulos independientes.

## 📦 Mapa de Módulos y Documentación

Cada módulo contiene su propio `README.md` con su guía de uso y ejemplos de código:

- 📄 **[`src/exporters`](./src/exporters/README.md)**: Generación y exportación de archivos PDF y Excel (`exportToPdf`, `exportToExcel`).
- 🔤 **[`src/formatters`](./src/formatters/README.md)**: Formateadores de fechas y moneda (`formatDate`, `formatCurrency`).
- ⚓ **`src/hooks`**: Custom React Hooks compartidos (para futuras utilidades).
- 🛠️ **`src/helpers`**: Funciones auxiliares genéricas y validaciones.

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

### Importación centralizada en tus componentes:
```typescript
import { exportToExcel, exportToPdf, formatDate, formatCurrency } from './common-utils';
```
