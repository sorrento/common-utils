# 📚 Guía de Uso del Módulo `common-utils` (Para Humanos e IAs)

Este módulo proporciona utilidades genéricas y reutilizables para exportar datos a **PDF** y **Excel (`.xlsx`)** en aplicaciones web frontend/TypeScript.

---

## 📄 Exportar a PDF (`exportToPdf`)

Soporta desde documentos simples de texto/párrafos hasta informes ejecutivos con KPIs y tablas.

### Ejemplo 1: PDF Simple (Solo Texto y Listas Clave-Valor)
```typescript
import { exportToPdf } from './common-utils';

await exportToPdf({
  title: 'Informe Resumido',
  filename: 'informe_simple',
  blocks: [
    { type: 'heading', text: 'Resumen Ejecutivo', level: 1 },
    { type: 'paragraph', text: 'Este es un párrafo de texto libre explicativo. Se pueden añadir tantos como sea necesario.' },
    { type: 'divider' },
    {
      type: 'kv-list',
      title: 'Datos del Cliente',
      items: [
        { label: 'Empresa', value: 'Empresa Demo S.L.' },
        { label: 'Estado', value: 'Activo' },
        { label: 'Fecha Alta', value: '2026-01-15' }
      ]
    }
  ]
});
```

### Ejemplo 2: PDF de Tabla Simple
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

### Ejemplo 3: PDF Ejecutivo Avanzado (KPIs + Tablas Múltiples + Bloques)
```typescript
await exportToPdf({
  title: 'Reporte Mensual de Ventas',
  subtitle: 'Junio 2026',
  brandName: 'MI EMPRESA',
  brandTagline: 'ANALYTICS OS',
  themeColor: '#16324F', // Color corporativo
  filename: 'reporte_ventas_junio',
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
  ],
  footerNote: 'Confidencial — Generado por la plataforma.'
});
```

---

## 📊 Exportar a Excel (`exportToExcel`)

Soporta exportaciones súper rápidas de una sola tabla o libros multi-pestaña enriquecidos.

### Ejemplo 1: Excel Rápido (Una sola Tabla)
Ideal para exportar cualquier listado/tabla directamente:
```typescript
import { exportToExcel } from './common-utils';

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

### Ejemplo 2: Excel Avanzado con Múltiples Pestañas y Formato
```typescript
await exportToExcel({
  filename: 'informe_financiero_2026',
  brandName: 'FINANCE DEPT',
  themeColor: '#0F2942',
  tabs: [
    {
      name: 'Resumen',
      title: 'KPIs Principales',
      subtitle: 'Visión general del ejercicio',
      kpis: [
        { label: 'Ingresos Totales', value: '1.200.000 €' },
        { label: 'EBITDA', value: '340.000 €' }
      ],
      headers: ['Concepto', 'Trimestre 1', 'Trimestre 2'],
      rows: [
        ['Ingresos', '300.000 €', '350.000 €'],
        ['Gastos', '200.000 €', '210.000 €']
      ]
    },
    {
      name: 'Detalle Transacciones',
      headers: ['ID', 'Fecha', 'Monto', 'Categoría'],
      rows: [
        ['TRX-001', '2026-06-01', '1.500 €', 'Servicios'],
        ['TRX-002', '2026-06-03', '4.200 €', 'Licencias']
      ]
    }
  ]
});
```
