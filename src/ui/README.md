# 🧱 Módulo `ui` (Primitivas UI)

Componentes visuales puros y agnósticos en React sin dependencias externas CSS.

---

## 🏷️ Etiqueta de Estado (`Badge`)

```tsx
import { Badge } from '../../common-utils';

<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger" showDot={false}>Error</Badge>
```

---

## 🪟 Ventana Modal (`Modal`)

```tsx
import { useState } from 'react';
import { Modal } from '../../common-utils';

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir Modal</button>
      
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Título del Modal">
        <p>Contenido del modal...</p>
      </Modal>
    </>
  );
}
```
