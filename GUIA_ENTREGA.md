# Guía para completar Proyecto Parcial I

Esta guía distingue la evidencia que ya aparece en el Word del trabajo pendiente. El PDF es la consigna académica; esta guía es un plan de ejecución aplicado al ERP Camaronera.

## Estado observado

- El repositorio existe y tiene ramas `main` y `feature/mejora-interfaz`.
- El historial local registra cambios de interfaz y un commit de GitHub Actions.
- Las capturas del Word muestran un Pull Request creado y fusionado, además de una pantalla de configuración de Actions.
- El workflow local actual compila el frontend, revisa sintaxis del backend y ejecuta pruebas unitarias del DTO de calidad de agua.
- El proyecto implementado usa Vite + TypeScript + JavaScript/Express + MongoDB. No es Angular. El requisito del PDF dice “simular un proyecto en Angular con Base de datos”. Confirma con el docente si acepta una aplicación web equivalente o si espera específicamente Angular.
- No se puede demostrar que el pipeline pase en GitHub hasta subir el workflow actualizado y revisar la pestaña Actions.

## Orden de trabajo recomendado

### 1. Confirmar equipo y alcance

Completa en la portada del informe nombres, carrera/institución, asignatura, docente y fecha. Usa el mismo proyecto y stack en el informe y la exposición. Si el docente exige Angular, pregunta antes de migrar: una migración cambia el alcance y no aporta por sí sola a la evaluación de Git, SDD o CI.

### 2. Revisar y subir el pipeline

Desde la raíz del repositorio, revisa los cambios con `git status` y `git diff`. Verifica que no se incluyan archivos `.env`, credenciales, contraseñas, URI de MongoDB ni claves. Luego:

```bash
git add .github backend/package.json backend/test specs docs entregables GUIA_ENTREGA.md
git commit -m "ci: add validation tests and contribution templates"
git push origin feature/mejora-interfaz
```

Abre o actualiza el Pull Request hacia `main`. En GitHub, entra a **Actions** y confirma que terminen los trabajos **Frontend build** y **Backend validation** en verde. Guarda una captura del resumen del run y otra de los detalles de las pruebas.

### 3. Completar revisión en Pull Request

Asigna al otro integrante como revisor. Revisa **Files changed**, deja al menos un comentario útil cuando corresponda y registra una decisión de revisión. Antes de fusionar, comprueba que Actions termine correctamente. Fusiona el PR y elimina la rama remota cuando GitHub lo sugiera.

Capturas recomendadas: vista del PR abierto, lista de archivos cambiados, revisión/aprobación y Actions exitoso. Las capturas actuales sirven como evidencia del flujo previo, pero no sustituyen la evidencia del workflow actualizado.

### 4. Activar protección de `main`

En GitHub abre **Settings → Rules → Rulesets** (el nombre exacto puede variar según la interfaz). Crea una regla para `main` que requiera Pull Request antes de fusionar, al menos una aprobación si el plan y tamaño del equipo lo permiten, y checks obligatorios. Selecciona los checks que aparezcan luego del primer run: `Frontend build` y `Backend validation`. Guarda la regla y toma captura. Una regla es efectiva solo cuando la configuración se guarda y coincide con los nombres reales de los checks.

### 5. Crear gestión visual del trabajo

En **Issues**, crea tareas con la plantilla de funcionalidad. Incluye necesidad, criterios de aceptación, prioridad y responsable. Crea un **Milestone** llamado `Proyecto Parcial I` con la fecha acordada por el equipo, y vincula los Issues. En **Projects**, crea una vista tipo Board con columnas `Backlog`, `En progreso`, `En revisión` y `Hecho`; añade los Issues y actualiza su estado durante el trabajo. No marques como terminadas las tareas que aún no tienen evidencia.

### 6. Documentar Spec Driven Development

El ejemplo incluido en `specs/001-registro-calidad-agua/` sigue el ciclo de especificación, plan, tareas e implementación. Con Spec Kit instalado, inicializa la integración elegida y ejecuta su flujo para una mejora acotada. Revisa el resultado humano antes de aceptar cambios. Guarda los artefactos en el repositorio y relaciona la especificación con un Issue y con el PR. El proyecto ya tiene artefactos manuales equivalentes; no afirmes que ejecutaste la CLI si no la instalaste y ejecutaste.

### 7. Presentar la evidencia y reflexionar

Usa la presentación como guion. En la exposición explica una historia concreta: requerimiento de lectura de agua → especificación → pruebas de validación → rama → PR/revisión → Actions → decisión de merge. Responde las cuatro preguntas de cierre con ejemplos del proyecto. Anexa al informe las capturas útiles del Word y las nuevas de Actions, reglas, tablero y milestone.

## Prompts útiles para Copilot

Pide una tarea acotada y aporta archivo, contexto, restricciones y criterios. Ejemplo:

> Revisa `backend/src/middlewares/validate.middleware.js` y `specs/001-registro-calidad-agua/spec.md`. Identifica casos límite que el DTO no valida. No cambies código todavía. Devuelve una tabla con requisito, riesgo, prueba propuesta y archivo afectado. No inventes rangos biológicos.

Después de revisar la respuesta, pide una prueba específica y verifica el cambio. No pegues secretos o datos personales en el prompt, y no aceptes código sin entenderlo.

## Alcance del despliegue

El PDF pide investigar automatización de build, test y deploy, pero la práctica obligatoria solo exige al menos un pipeline. El workflow de este repositorio es CI: compila y prueba. El despliegue continuo requiere elegir hosting para frontend y backend, configurar secretos y variables del entorno, MongoDB de producción, dominios/HTTPS, migraciones y rollback. No se activa sin una cuenta/plataforma de destino y una revisión de seguridad. En el informe se propone un despliegue como fase siguiente, sin declarar que ya está realizado.

## Lista final antes de entregar

- [ ] Portada APA completada con datos reales del grupo.
- [ ] Informe contrastado con el docente si Angular es requisito literal.
- [ ] Cambios subidos en una rama y PR revisado.
- [ ] Actions exitoso visible en GitHub.
- [ ] Reglas de `main` guardadas y capturadas.
- [ ] Issues, Project Kanban y Milestone vinculados.
- [ ] Capturas añadidas a anexos con pie descriptivo.
- [ ] Fuentes consultadas verificadas y referencias APA completas.
- [ ] Ningún secreto aparece en el repositorio o en las capturas.
