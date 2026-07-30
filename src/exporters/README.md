# 📄 Módulo `exporters` (PDF y Excel)

Utilidades avanzadas y flexibles para la generación y descarga automática de archivos **PDF** y **Excel (`.xlsx`)** en aplicaciones web.

---

## 📄 Exportar a PDF (`exportToPdf`)

### 1. PDF Simple (Texto y Listas Clave-Valor)
```typescript
import { exportToPdf } from '../../common-utils';

await exportToPdf({
  title: 'Informe Resumido',
  filename: 'informe_simple',
  blocks: [
    { type: 'heading', text: 'Resumen Ejecutivo', level: 1 },
    { type: 'paragraph', text: 'Este es un párrafo de texto libre explicativo.' },
    { type: 'divider' },
    {
      type: 'kv-list',
      title: 'Datos del Cliente',
      items: [
        { label: 'Empresa', value: 'Empresa Demo S.L.' },
        { label: 'Estado', value: 'Activo' }
      ]
    }
  ]
});
```

### 2. PDF de Tabla Simple
```typescript
await exportToPdf({
  title: 'Listado de Usuarios',
  filename: 'usuarios',
  sections: [
    {
      headers: ['ID', 'Nombre', 'Email', 'Rol'],
      rows: [
        [1, 'Ana López', 'ana@example.com', 'Admin'],
        [2, 'Carlos Ruiz', 'carlos@example.com', 'User']
      ]
    }
  ]
});
```

### 3. PDF Ejecutivo Avanzado (KPIs + Tablas + Estilos Corporativos)
```typescript
await exportToPdf({
  title: 'Reporte Mensual de Ventas',
  subtitle: 'Junio 2026',
  brandName: 'MI EMPRESA',
  brandTagline: 'ANALYTICS OS',
  themeColor: '#16324F',
  filename: 'reporte_ventas',
  kpis: [
    { label: 'Facturación', value: '145.200 €', trend: '+12%', accentColor: '#2B73E0' },
    { label: 'Nuevos Clientes', value: '34', accentColor: '#057A55' }
  ],
  sections: [
    {
      title: 'Ventas por Región',
      headers: ['Región', 'Ventas', 'Crecimiento'],
      rows: [
        ['Norte', '45.000 €', '+8%'],
        ['Sur', '32.000 €', '+15%']
      ]
    }
  ]
});
```

---

## 📊 Exportar a Excel (`exportToExcel`)

### 1. Excel Rápido (Una sola Tabla)
```typescript
import { exportToExcel } from '../../common-utils';

await exportToExcel({
  filename: 'contactos',
  quickTable: {
    sheetName: 'Contactos',
    headers: ['Nombre', 'Teléfono', 'Ciudad'],
    rows: [
      ['Juan Pérez', '600112233', 'Madrid'],
      ['Laura Gómez', '677889900', 'Barcelona']
    ]
  }
});
```

### 2. Excel Avanzado Multi-Pestaña
```typescript
await exportToExcel({
  filename: 'informe_financiero',
  brandName: 'FINANCE DEPT',
  themeColor: '#0F2942',
  tabs: [
    {
      name: 'Resumen',
      title: 'KPIs Principales',
      headers: ['Concepto', 'Trimestre 1', 'Trimestre 2'],
      rows: [
        ['Ingresos', '300.000 €', '350.000 €']
      ]
    },
    {
      name: 'Detalle',
      headers: ['ID', 'Fecha', 'Monto'],
      rows: [
        ['TRX-001', '2026-06-01', '1.500 €']
      ]
    }
  ]
});
```
