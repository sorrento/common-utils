# Common Utils Repo

Librería independiente de utilidades reutilizables (Exportadores a Excel y PDF con diseño enriquecido y modular).

## 📦 Contenido
- `exportService.ts`: Funciones `exportToExcel` y `exportToPdf` con arquitectura modular (soporta desde párrafos de texto simple y listas clave-valor hasta informes ejecutivos con KPIs, tablas y colores de marca personalizados).
- `package.json`: Especifica en `peerDependencies` las librerías requeridas.
- `USAGE.md`: **Guía rápida con ejemplos de código (para Humanos e IAs)** sobre cómo exportar texto, tablas simples o informes avanzados.

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

### Método A: Como Git Submodule (Recomendado para iterar con IA)

1. **Añadir el submódulo a tu nuevo proyecto:**
   ```bash
   git submodule add https://github.com/tu-usuario/common-utils.git src/common-utils
   ```

2. **Instalar las dependencias que indica el `package.json` de `common-utils`:**
   ```bash
   npm install exceljs html2canvas jspdf
   ```

3. **Importar y usar en tus componentes:**
   ```typescript
   import { exportToExcel, exportToPdf } from './common-utils';
   ```

4. **Sincronizar cambios nuevos:**
   ```bash
   cd src/common-utils
   git add .
   git commit -m "Mejora en exportador"
   git push
   ```
