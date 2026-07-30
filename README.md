# Common Utils Repo
Librería independiente de utilidades reutilizables (Exportadores a Excel y PDF enriquecidos).

## Contenido
- `exportService.ts`: Exportaciones con formato elegante para Excel (`ExcelJS`) y PDF (`html2canvas` + `jsPDF`).

## Uso en otros proyectos:
```typescript
import { exportToExcel, exportToPdf } from './common-utils';
```
