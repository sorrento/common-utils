# 🔤 Módulo `formatters` (Formateadores)

Utilidades comunes para formatear fechas, monedas y números en aplicaciones TypeScript / React.

---

## 📅 Formatear Fechas (`formatDate`)

```typescript
import { formatDate } from '../../common-utils';

formatDate('2026-06-25T14:30:00'); 
// Retorna: "25/06/2026" (por defecto en es-ES)

formatDate(new Date(), 'en-US');
// Retorna: "06/25/2026"
```

---

## 💶 Formatear Moneda (`formatCurrency`)

```typescript
import { formatCurrency } from '../../common-utils';

formatCurrency(1250.5); 
// Retorna: "1.250,50 €"

formatCurrency(4500, 'USD', 'en-US'); 
// Retorna: "$4,500.00"
```
