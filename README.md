# Common Utils Repo

Librería compartida de utilidades reutilizables organizada por módulos independientes.

## 📦 Mapa de Módulos y Documentación

Cada módulo contiene su propio `README.md` con su guía de uso y ejemplos de código:

- 🤖 **[`src/ai`](./src/ai/UNIVERSAL_READER_POOL.md)**: Motor de clasificación multimodal y extracción estructurada multiturno con Gemini (`UniversalReaderEngine`, `geminiParser`).
- 📄 **[`src/exporters`](./src/exporters/README.md)**: Generación y exportación de archivos PDF y Excel (`exportToPdf`, `exportToExcel`).
- 📊 **[`src/plots`](./src/plots/README.md)**: Componentes de visualización de datos SVG (`ColumnChart`, `DonutChart`).
- 🎨 **[`src/icons`](./src/icons/README.md)**: Colección de iconos SVG y Logos configurable en React (`Icons`, `LogoSvg`).
- 🪝 **[`src/hooks`](./src/hooks/README.md)**: Custom React Hooks reutilizables (`useLocalStorage`, `useDebounce`).
- 🧱 **[`src/ui`](./src/ui/README.md)**: Componentes primitivos de UI (`Badge`, `Modal`).
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
  UniversalReaderEngine,
  exportToExcel, 
  exportToPdf, 
  ColumnChart, 
  DonutChart, 
  Icons, 
  LogoSvg, 
  Badge,
  Modal,
  useLocalStorage, 
  useDebounce, 
  formatDate 
} from './common-utils';

// Ejemplo: Instanciar Lector Universal leyendo JSONs locales de tu proyecto
import destinationsJson from '@/data/documentDestinations.json';
import schemasJson from '@/data/extractionSchemas.json';

const readerEngine = new UniversalReaderEngine({
  apiKey: process.env.VITE_GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash',
  destinations: destinationsJson,
  schemas: schemasJson
});
```
