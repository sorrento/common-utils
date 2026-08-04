# Pool de Entrada Universal (`UniversalReaderEngine`)

`UniversalReaderEngine` es una clase **instanciable, reutilizable y 100% agnóstica de dominio** dentro de `@common-utils/ai`. Permite configurar la API Key, el modelo Gemini, el rol del sistema y los esquemas **una sola vez en el constructor**, facilitando su uso en cualquier proyecto (financiero, logístico, marítimo, legal, etc.).

---

## 💡 Conceptos Clave: `destinations` y `schemas`

Para que el lector clasifique y extraiga información de forma estructurada, requiere dos elementos fundamentales en su configuración:

### 1. ¿Qué son los `destinations` (Destinaciones / Destinos)?
Son la lista de **categorías o tipos de documentos** a los que el archivo puede ser clasificado (por ejemplo: `voyage_instructions`, `swift_mt103_payment`, `invoice`, `unknown`). 
Cada destino define el ID, nombre, descripción para orientar a la IA, y los campos clave que se esperan de ese tipo de documento.

**Ejemplo de estructura de `destinations`:**
```typescript
import { DocumentDestination } from '@common-utils';

export const myDestinationsList: DocumentDestination[] = [
  {
    id: 'voyage_instructions',
    name: 'Voyage Instructions / Nombramiento',
    category: 'Operations',
    description: 'Documento u orden de nombramiento para atención de buque en puerto con fechas, IMO y carga.',
    expectedFields: ['vessel', 'imo', 'client', 'port', 'eta', 'cargoType', 'cargoQty']
  },
  {
    id: 'swift_mt103_payment',
    name: 'Comprobante SWIFT / Transferencia Bancaria',
    category: 'Financials',
    description: 'Comprobante bancario o confirmación SWIFT MT103 de pago recibido o realizado.',
    expectedFields: ['senderBank', 'receiverBank', 'amount', 'currency', 'valueDate', 'transactionReference']
  }
];
```

### 2. ¿Qué son los `schemas` (Esquemas de JSON / Zod / TypeChat)?
Son los **esquemas de validación y definición de tipos (JSON Schemas)** asociados a cada `id` de destino. Le indican a Gemini la estructura exacta, el tipo de datos (string, number, array, etc.) y la obligatoriedad de los campos que debe devolver al extraer la información en el Turno 2.

**Ejemplo de mapa de `schemas`:**
```typescript
import { SchemaMap } from '@common-utils';

export const mySchemasMap: SchemaMap = {
  // Esquema para el destino "voyage_instructions"
  voyage_instructions: {
    type: 'object',
    properties: {
      vessel: { type: 'string', description: 'Nombre del buque' },
      imo: { type: 'string', description: 'Número IMO de 7 dígitos' },
      client: { type: 'string', description: 'Cliente o armador' },
      port: { type: 'string', description: 'Puerto de operación' },
      eta: { type: 'string', description: 'Fecha/hora estimada de llegada (ISO format o texto)' },
      cargoQty: { type: 'number', description: 'Cantidad de carga en toneladas metricas' }
    },
    required: ['vessel', 'port']
  },

  // Esquema para el destino "swift_mt103_payment"
  swift_mt103_payment: {
    type: 'object',
    properties: {
      senderBank: { type: 'string', description: 'Banco ordenante' },
      receiverBank: { type: 'string', description: 'Banco receptor' },
      amount: { type: 'number', description: 'Monto de la transferencia' },
      currency: { type: 'string', description: 'Moneda (USD, EUR, CLP, etc.)' },
      transactionReference: { type: 'string', description: 'Referencia bancaria o de rastreo' }
    },
    required: ['amount', 'currency']
  }
};
```

---

## 📋 Estructura Exacta de los Archivos `.json`

Para gestionar estas configuraciones mediante archivos `.json` limpios en tu proyecto, la librería soporta los siguientes formatos:

### A. Estructura de `documentDestinations.json`

Puedes definir un **array JSON directo** de destinos o un **objeto wrapper** con la propiedad `"document_destinations"` o `"destinations"`:

```json
{
  "document_destinations": [
    {
      "id": "voyage_instructions",
      "name": "Voyage Instructions / Nombramiento",
      "category": "Operations",
      "description": "Documento u orden de nombramiento para atención de buque en puerto con fechas, IMO y carga.",
      "expected_document_types": ["pdf", "txt", "eml"],
      "key_fields_extracted": ["vessel", "imo", "client", "port", "eta"]
    },
    {
      "id": "swift_mt103_payment",
      "name": "SWIFT MT103 / Transferencia Bancaria",
      "category": "Financials",
      "description": "Comprobante bancario de pago de transferencia recibida o efectuada.",
      "expected_document_types": ["pdf", "png", "jpg"],
      "key_fields_extracted": ["amount", "currency", "valueDate", "transactionReference"]
    }
  ]
}
```

### B. Estructura de `extractionSchemas.json`

Puedes definir un objeto donde las claves sean los `id` de cada destino, o envolverlo en la propiedad `"schemas"`:

```json
{
  "schemas": {
    "voyage_instructions": {
      "type": "object",
      "title": "Esquema de Voyage Instructions",
      "description": "Campos a extraer para instrucciones de viaje",
      "properties": {
        "vessel": { "type": "string", "description": "Nombre del buque" },
        "imo": { "type": "string", "description": "Número IMO de 7 dígitos" },
        "port": { "type": "string", "description": "Puerto de operación" },
        "eta": { "type": "string", "description": "Fecha y hora estimada de llegada" }
      },
      "required": ["vessel", "port"]
    },
    "swift_mt103_payment": {
      "type": "object",
      "title": "Esquema SWIFT MT103",
      "description": "Campos a extraer de comprobantes bancarios",
      "properties": {
        "amount": { "type": "number", "description": "Monto transferido" },
        "currency": { "type": "string", "description": "Moneda (USD, EUR, CLP, etc.)" },
        "transactionReference": { "type": "string", "description": "Referencia bancaria" }
      },
      "required": ["amount", "currency"]
    }
  }
}
```

### 📄 Lectura Directa de Archivos `.json`

La librería acepta **archivos `.json` importados directamente de forma transparente**. `UniversalReaderEngine` normaliza automáticamente tanto arreglos directos como objetos wrapper (ej: `{ "document_destinations": [...] }` o `{ "schemas": { ... } }`).

**La mejor manera de gestionarlo en proyectos (Patrón Recomendado):**
1. Crear una carpeta `/data` o `/config` en el proyecto consumidor (ej: `src/data/`).
2. Guardar los archivos JSON puros:
   - `documentDestinations.json`
   - `extractionSchemas.json`
3. Importarlos y pasarlos directamente al instanciar la clase:

---

## 🏗️ Arquitectura Instanciable con Sesión Multiturno

```typescript
import { UniversalReaderEngine } from '@common-utils';

// Importar directamente los archivos JSON de tu proyecto
import destinationsJson from '@/data/documentDestinations.json';
import schemasJson from '@/data/extractionSchemas.json';

// Instanciar pasando los JSONs tal cual fueron importados
const readerEngine = new UniversalReaderEngine({
  apiKey: process.env.VITE_GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash',
  systemRole: 'You are an expert AI document classifier and data extractor.',
  destinations: destinationsJson, // Se normaliza automáticamente
  schemas: schemasJson             // Se normaliza automáticamente
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

