# Common Utils Repo

Librería compartida de utilidades reutilizables organizada por módulos independientes.

## 📦 Mapa de Módulos y Documentación

Cada módulo contiene su propio `README.md` con su guía de uso y ejemplos de código:

- 📄 **[`src/exporters`](./src/exporters/README.md)**: Generación y exportación de archivos PDF y Excel (`exportToPdf`, `exportToExcel`).
- 📊 **[`src/plots`](./src/plots/README.md)**: Componentes de visualización de datos SVG (`ColumnChart`, `DonutChart`).
- 🎨 **[`src/icons`](./src/icons/README.md)**: Colección de iconos SVG y Logos configurable en React (`Icons`, `LogoSvg`).
- 🪝 **[`src/hooks`](./src/hooks/README.md)**: Custom React Hooks reutilizables (`useLocalStorage`, `useDebounce`).
- 🔤 **[`src/formatters`](./src/formatters/README.md)**: Formateadores de fechas y moneda (`formatDate`, `formatCurrency`).
- 🛠️ **`src/helpers`**: Funciones auxiliares genéricas y validaciones.

---

## 📋 Requisitos / Dependencias necesarias

```bash
npm install exceljs html2canvas jspdf react
```

---

## 🚀 Cómo incorporarlo a un NUEVO proyecto

```bash
git submodule add https://github.com/sorrento/common-utils.git src/common-utils
```

### Importación centralizada en tus componentes:
```typescript
import { 
  exportToExcel, 
  exportToPdf, 
  ColumnChart, 
  DonutChart, 
  Icons, 
  LogoSvg, 
  useLocalStorage, 
  useDebounce, 
  formatDate 
} from './common-utils';
```
