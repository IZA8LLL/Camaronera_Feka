# Especificación: registro de calidad de agua

## Contexto
Los técnicos registran parámetros de agua por piscina y ciclo. Datos fuera de rango pueden generar decisiones operativas incorrectas.

## Historia de usuario
Como técnico de campo, quiero registrar oxígeno, salinidad, pH, temperatura y amonio con fecha y piscina, para conservar una lectura validable y poder revisar alertas.

## Requisitos funcionales
- RF-1: el registro incluye identificadores válidos de granja, piscina y ciclo, y una fecha ISO válida.
- RF-2: oxígeno es mayor que 0 y no supera 30 mg/L.
- RF-3: salinidad está entre 0 y 60 ppt; pH entre 0 y 14; temperatura entre 0 y 45 °C; amonio entre 0 y 50 mg/L.
- RF-4: el servidor rechaza campos desconocidos y responde con error de validación sin guardar el registro.
- RF-5: solo usuarios autenticados con permiso `agua:crear` pueden registrar lecturas.

## Requisitos no funcionales
- RNF-1: validar la entrada en el servidor, aunque la interfaz también valide.
- RNF-2: no devolver datos de otros tenants.
- RNF-3: la operación debe responder con un error comprensible y no filtrar trazas internas.

## Criterios de aceptación
- Una lectura con datos válidos pasa el esquema de validación.
- Una lectura con pH mayor a 14 falla.
- Un campo adicional como `tenant_id` falla.
- Una solicitud sin autenticación no accede al endpoint protegido.

## Fuera de alcance
La definición de umbrales biológicos por especie, edad y salinidad requiere validación de un especialista acuícola y no se infiere de esta validación técnica.
