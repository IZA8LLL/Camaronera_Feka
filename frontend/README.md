# 🦐 By Fekas Corp. — Frontend Web (ERP Camaronera)

Aplicación Single Page Application (SPA) moderna, dinámica y reactiva desarrollada con **Vite**, **TypeScript** y un **Design System Vanilla CSS** con estética oceánica, modo oscuro y efecto glassmorphism.

---

## 🎨 Características de Diseño y UX

- **Paleta Oceánica Premium:** Tonos profundos de azul marino (`#0B1121`, `#111A2E`), acentos cian/aqua (`#22D3EE`) y alertas semánticas suaves.
- **Glassmorphism Dinámico:** Efectos de desenfoque de fondo (`backdrop-filter: blur(16px)`), bordes sutiles y micro-sombras.
- **Micro-animaciones Fluidas:** Transiciones suaves de entrada (`fadeSlideIn`, `cardEnter`, `toastIn`) y estados de carga (`spinner`).
- **Responsividad Total:** Navegación optimizada tanto para estaciones de control en escritorio como para registro en dispositivos móviles de campo.
- **Sistema de Alertas Visuales:** Detección inmediata de anomalías en parámetros de agua (oxígeno crítico < 4 mg/L, desbalances de pH, amonio tóxico).

---

## 🧭 Vistas y Módulos de la Aplicación

1. **🔐 Login Corporativo (`#/login`):**
   - Formulario con glassmorphism, validación inline, tenant ID y protección contra bots (Turnstile).
2. **📊 Dashboard Operativo (`#/dashboard`):**
   - Tarjetas de estadísticas en tiempo real (piscinas activas, alertas críticas de agua, biomasa total en kg).
   - Panel de alertas tempranas con indicadores pulsantes.
   - Acceso rápido a las operaciones más frecuentes.
   - Tabla consolidada de estanques y factores de conversión alimenticia (FCA).
3. **🏊 Monitoreo de Piscinas (`#/piscinas`):**
   - Cuadrícula de estanques con tarjetas interactivas que reflejan oxígeno, salinidad, pH, biomasa y estado del ciclo.
   - Acciones directas para registrar muestreo o registrar agua por piscina.
4. **🔬 Muestreo Biométrico (`#/form-muestreo`):**
   - Registro de peso promedio (g), talla promedio (cm), muestra de individuos y cálculo de biomasa estimada.
5. **💧 Parámetros de Calidad de Agua (`#/form-agua`):**
   - Captura de oxígeno disuelto, salinidad, pH, temperatura y amonio con previsualización visual de rangos seguros en tiempo real.
6. **🍤 Registro de Alimentación (`#/form-alimentacion`):**
   - Consumo diario por lote de alimento balanceado con afectación automática del Kardex de bodega.
7. **📦 Compras y Proveedores (`#/compras`):**
   - Directorio de proveedores con cifrado AES-256-GCM y control de órdenes de compra con cálculo de IVA (15%).

---

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con proxy al backend
npm run dev

# 3. Compilar para producción
npm run build
```

El servidor Vite correrá por defecto en `http://localhost:5173`, redirigiendo automáticamente las llamadas `/auth`, `/api` y `/health` al backend en el puerto `3000`.
