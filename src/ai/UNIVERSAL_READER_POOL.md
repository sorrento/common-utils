# Pool de Entrada Universal (`UniversalReaderEngine`)

`UniversalReaderEngine` es una clase **instanciable, reutilizable y 100% agnóstica de dominio** dentro de `@common-utils/ai`. Permite configurar la API Key, el modelo Gemini, el rol del sistema y los esquemas **una sola vez en el constructor**, facilitando su uso en cualquier proyecto (financiero, logístico, marítimo, legal, etc.).

---

## 🏗️ Arquitectura Instanciable con Sesión Multiturno

```typescript
import { UniversalReaderEngine } from '@common-utils';

// Instanciar una sola vez en el servicio o inicio de la aplicación
const readerEngine = new UniversalReaderEngine({
  apiKey: process.env.VITE_GEMINI_API_KEY,
  modelName: 'gemini-1.5-flash',
  systemRole: 'You are an expert AI document classifier and data extractor.',
  destinations: myDestinationsList,
  schemas: mySchemasMap
});

// Procesar cualquier documento (acepta objeto File de navegador o string Base64)
const result = await readerEngine.processUniversalPool({
  file: browserFileObject, // o fileBase64: '...'
  casesList: activeCasesList
});
```

---

## ⚡ Manejo de Archivos y Sesiones

1. **Soporte Flexible de Archivos (`File` o Base64)**:
   - Acepta tanto un objeto `File` nativo de navegador (arrastrado en un `<input type="file">` o zona de dropzone) como una cadena `fileBase64` preprocesada o texto plano (`textContent`).
   - Archivos estándar de hasta 20 MB (PDFs, imágenes PNG/JPG) se transmiten óptimamente en línea (`inlineData`).

2. **Continuación de Sesión Multiturno (Context Caching)**:
   - El motor mantiene la estructura de sesión multiturno (`contents: [Turn 1 User, Turn 1 Model, Turn 2 User]`).
   - El documento Base64 se envía **únicamente en el Turno 1**. En el Turno 2, Gemini reutiliza la memoria de la sesión para extraer los campos del JSON Schema con costo y latencia reducidos.
