# Informe: propuesta de desarrollo moderno para el ERP Camaronera

**Nota de uso:** completar los datos entre corchetes en la portada DOCX final. Este archivo es una versión fuente editable.

## Introducción

La pérdida de cambios, la coordinación informal y los errores que llegan a producción reducen la capacidad de un equipo para entregar software confiable. El proyecto ERP Camaronera permite estudiar una alternativa concreta: integrar Git y GitHub para controlar cambios, usar Pull Requests para revisar trabajo, describir funcionalidades antes de programarlas, automatizar comprobaciones con GitHub Actions y aprovechar asistentes de IA con revisión humana. La propuesta responde al problema planteado por la asignatura y toma como caso una aplicación de gestión acuícola con frontend web, API y MongoDB.

## Investigación y análisis

### 1. Git y estrategias de ramas

Git es un sistema distribuido de control de versiones: cada clon conserva historia y permite crear ramas locales para trabajar de manera aislada. Un commit identifica un conjunto de cambios y su relación con commits anteriores. Las ramas facilitan explorar una solución sin modificar inmediatamente la rama estable; merge integra historias y puede requerir resolver conflictos cuando dos cambios afectan la misma zona (Chacon & Straub, 2014).

Git Flow, popularizado por Driessen (2010), organiza el trabajo con ramas de larga duración como `main` y `develop`, ramas `feature`, `release` y `hotfix`. Da estructura a productos con versiones planificadas y mantenimiento paralelo, pero requiere disciplina para integrar y mantener varias líneas activas. Trunk Based Development integra cambios pequeños con frecuencia en una rama principal, usando ramas cortas y automatización; reduce divergencia, aunque exige una integración continua confiable y cambios divisibles (Trunk Based Development, s. f.).

Para este trabajo conviene un flujo ligero: `main` protegida y ramas cortas `feature/<tarea>` o `fix/<tarea>`, Pull Request, revisión, CI y merge. El repositorio ya muestra `main`, `feature/mejora-interfaz` y un PR fusionado. En un equipo de dos personas, mantener `develop` puede añadir trabajo sin una necesidad real de releases paralelos.

### 2. GitHub, Pull Requests y Code Review

GitHub agrega colaboración alrededor de Git: Issues expresan necesidades, Pull Requests (PR) proponen cambios y Actions ejecuta controles. El PR ofrece contexto, archivos modificados, comentarios por línea y decisiones como aprobar o solicitar cambios. La revisión ayuda a descubrir defectos y compartir conocimiento, pero no reemplaza compilación, pruebas ni responsabilidad del autor (GitHub, s. f.-a).

La evidencia revisada en el Word muestra un repositorio público, una rama de mejora, un PR creado y fusionado. Esto demuestra que el equipo ya practicó el ciclo básico. Para completarlo se debe adjuntar el enlace del PR real, capturar su revisión y confirmar en Actions los checks del commit fusionado. También se recomienda proteger `main` para requerir PR y checks exitosos; GitHub permite configurar checks requeridos mediante reglas de rama/rulesets (GitHub, s. f.-b).

### 3. Spec Driven Development y GitHub Spec Kit

Spec Driven Development (SDD) convierte la intención del producto en artefactos revisables antes y durante la implementación. En el ciclo de Spec Kit se define la especificación, se prepara un plan técnico, se desglosan tareas y se implementa; el ciclo puede converger con revisión de la solución contra los artefactos (GitHub, 2026a). El valor no está en producir documentos por sí mismos, sino en aclarar comportamiento esperado, restricciones y criterios de aceptación antes de que el código tome decisiones implícitas.

El ejemplo del proyecto trata el registro de calidad del agua. La especificación define campos, límites de entrada, autorización y casos de aceptación. El plan señala el DTO Zod, la ruta protegida y las pruebas; las tareas distinguen lo completado de lo pendiente. No se fijan umbrales de manejo biológico porque requieren validar especie, etapa del ciclo y criterio técnico acuícola. Esta limitación evita presentar un límite de validación de software como recomendación productiva.

El repositorio incluye artefactos manuales compatibles con SDD. Para afirmar uso de GitHub Spec Kit debe inicializarse la herramienta con una integración de agente y conservarse evidencia de sus comandos/artefactos; el material actual por sí solo acredita un flujo documental inspirado en SDD, no una ejecución de la CLI.

### 4. DevOps y CI/CD con GitHub Actions

DevOps une prácticas de desarrollo y operación para entregar cambios pequeños, verificables y recuperables. La integración continua ejecuta build y pruebas con frecuencia; la entrega continua amplía esa práctica y permite liberar cambios de manera confiable. DORA identifica CI y documentación de calidad como capacidades asociadas con mejores resultados de entrega, pero una herramienta por sí sola no garantiza esos resultados (DORA, s. f.-a, s. f.-b).

El workflow del repositorio corre con `push` y `pull_request`. El trabajo de frontend instala dependencias con `npm ci` y ejecuta `npm run build`; el backend instala dependencias, ejecuta pruebas `node:test` y revisa sintaxis. Las ramas protegidas pueden exigir que ambos trabajos pasen antes del merge. El deploy no está configurado: requiere seleccionar hosting, definir secretos fuera del repositorio, establecer dominios, HTTPS, estrategia de base de datos, monitoreo y rollback. Se presenta como evolución, no como función implementada.

### 5. IA aplicada y prompt engineering

GitHub Copilot puede explicar código, proponer cambios y revisar Pull Requests. La persona desarrolladora sigue siendo responsable de comprender, validar y aceptar cada sugerencia; la disponibilidad de funciones depende del plan y políticas de la cuenta (GitHub, s. f.-c). Un prompt útil define contexto, objetivo, archivos, restricciones y forma de comprobar el resultado. Para este sistema, una buena instrucción pide revisar el DTO de agua contra la especificación y listar riesgos sin modificar código; después se solicita una prueba acotada.

La IA acelera tareas de exploración y borradores, pero puede producir cambios incorrectos, inseguros o incompatibles con reglas del dominio. Por eso el flujo propuesto conserva revisión humana, pruebas automatizadas y cuidado de datos. Nunca se envían claves, URI de MongoDB o información personal a un prompt.

### 6. Calidad de software y TDD

Test Driven Development propone escribir primero una prueba que describa un comportamiento, observar que falle, implementar el mínimo cambio y refactorizar manteniendo la suite en verde. Una prueba automatizada es una comprobación repetible de un contrato; no es garantía de ausencia de errores. La evidencia empírica sobre TDD depende del contexto y la forma de aplicarlo; por eso el equipo debe evaluar cobertura útil y no medir calidad solo por cantidad de pruebas (Ren & Barrett, 2023).

La práctica añadida cubre validación de parámetros de agua: acepta una lectura válida, rechaza pH mayor a 14 y rechaza campos adicionales. Son pruebas unitarias del DTO, no pruebas de integración con MongoDB, autorización o navegador. La siguiente iteración puede añadir casos de endpoint y una base de datos de prueba aislada.

### 7. Gestión del proyecto

Issues registran tareas con un responsable y criterios de aceptación. Milestones agrupan trabajo en una meta con fecha. GitHub Projects permite organizar los Issues en una vista Kanban con estados `Backlog`, `En progreso`, `En revisión` y `Hecho`. Para el parcial conviene vincular cada Issue con especificación y PR, asignar responsables y mover una tarjeta solo cuando exista evidencia. La configuración del tablero ocurre en la cuenta GitHub del grupo y debe capturarse; el repositorio local no puede probar que ese tablero se creó.

## Actividad práctica y propuesta

La solución combina: (a) `main` protegida y ramas breves por Issue; (b) PR con objetivo, especificación, checklist de build/pruebas y evidencia; (c) workflow de CI para compilación, pruebas y revisión sintáctica; (d) artefactos SDD bajo `specs/`; (e) tablero y milestone en GitHub; y (f) uso de Copilot como apoyo sujeto a validación humana.

El sistema del caso es un ERP web con frontend Vite/TypeScript, backend Express/Node.js y persistencia MongoDB/Mongoose. La consigna práctica menciona Angular con base de datos. Esa diferencia debe declararse al docente: la aplicación implementa frontend moderno y base de datos, pero no Angular. Si Angular es una condición literal, el grupo debe obtener autorización para usar el stack actual o preparar una demostración Angular separada y pequeña, sin afirmar que el ERP existente está construido con Angular.

El criterio de deploy se resuelve proponiendo una fase futura, ya que todavía no existe destino de hosting ni secretos de producción autorizados. Para el alcance obligatorio, el CI de GitHub Actions cumple el mínimo de un pipeline una vez que el equipo lo suba, observe un run exitoso y conserve captura.

## Análisis crítico

El repo parte con una arquitectura y módulos amplios para un proyecto académico, y la evidencia indica práctica real de ramas, PR y Actions. Sin embargo, algunos documentos describen características de seguridad como implementadas sin presentar pruebas de penetración ni verificación de despliegue; esas afirmaciones deben tratarse como descripción del código y no como certificación. El workflow existente inicialmente instalaba dependencias y mostraba un mensaje, lo cual no detectaba errores de compilación. La versión de trabajo incorpora build del frontend y validaciones del backend. Añadir CI mejora la detección temprana, aunque todavía falta confirmar el run remoto y exigir sus estados antes del merge.

También hay una brecha entre el framework indicado en la consigna y el usado en el repositorio. Ignorarla podría reducir el puntaje de aplicación práctica. Se recomienda resolverla explícitamente con el docente y no presentar Vite como Angular. De igual forma, no se debe confundir artefactos SDD manuales con una instalación y ejecución de Spec Kit.

## Reflexiones de cierre

**¿Qué problema resuelve Git en el desarrollo real?** Conserva historia recuperable, permite comparar cambios y separar trabajo paralelo en ramas. El equipo puede identificar qué cambió, quién lo propuso y qué versión introdujo una regresión.

**¿Por qué DevOps es importante hoy?** Conecta cambios de código con comprobaciones repetibles y operación. Un pipeline da retroalimentación rápida y un proceso de despliegue/rollback reduce riesgo; el beneficio depende de tests adecuados y configuración segura.

**¿Cómo cambia la IA la programación?** Reduce esfuerzo en tareas como explorar código, generar borradores y explicar errores. Cambia el perfil del trabajo hacia formular problemas y revisar resultados, pero mantiene la necesidad de criterio humano, seguridad y pruebas.

**¿Qué herramienta fue más útil y por qué?** Para este equipo, GitHub Actions es la más demostrable: ejecuta las mismas comprobaciones en cada PR y deja un resultado visible. Git y los PR establecen el flujo; Actions comprueba que el flujo tiene una puerta de calidad.

## Conclusiones

Una práctica moderna no consiste en instalar herramientas aisladas, sino en enlazar necesidad, especificación, cambio, revisión, prueba y evidencia. El ERP Camaronera ya ofrece un caso útil y un primer Pull Request. Con la CI ampliada, pruebas unitarias, plantillas de Issue/PR y especificación versionada, el equipo puede demostrar control de cambios y calidad automatizada. Para cerrar el parcial aún debe confirmar el alcance Angular, ejecutar y capturar Actions en GitHub, crear tablero/milestone y completar los datos académicos. La propuesta de deploy queda documentada como etapa siguiente debido a que depende de infraestructura externa.

## Referencias

Chacon, S., & Straub, B. (2014). *Pro Git* (2.ª ed.). Apress. https://git-scm.com/book/en/v2

DORA. (s. f.-a). *Continuous integration*. https://dora.dev/capabilities/continuous-integration/

DORA. (s. f.-b). *Documentation quality*. https://dora.dev/capabilities/documentation-quality/

Driessen, V. (2010, 5 de enero). *A successful Git branching model*. https://nvie.com/posts/a-successful-git-branching-model/

GitHub. (s. f.-a). *Giving reviews*. GitHub Docs. https://docs.github.com/en/pull-requests/concepts/giving-reviews

GitHub. (s. f.-b). *Available rules for rulesets*. GitHub Docs. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

GitHub. (s. f.-c). *Best practices for using GitHub Copilot*. GitHub Docs. https://docs.github.com/en/enterprise-cloud@latest/copilot/get-started/best-practices

GitHub. (2026, 28 de octubre). *Spec Kit*. GitHub. https://github.com/github/spec-kit

GitHub. (s. f.-d). *Building and testing Node.js*. GitHub Docs. https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs

Ren, W., & Barrett, S. (2023). Test-driven development, engagement in activity, and maintainability: An empirical study. *IET Software, 17*(4), 509–525. https://doi.org/10.1049/sfw2.12135

Trunk Based Development. (s. f.). *Introduction*. https://trunkbaseddevelopment.com/
