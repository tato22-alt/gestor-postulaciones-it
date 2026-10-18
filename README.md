# Gestor de Postulaciones IT

## Descripción

Aplicación web para registrar, organizar y realizar el seguimiento de oportunidades laborales relacionadas con tecnología.

## Problema que resuelve

Las oportunidades laborales pueden quedar distribuidas entre LinkedIn, portales, correos y notas. Esto dificulta saber:

* dónde se registró cada oportunidad;
* en qué estado se encuentra;
* qué acción corresponde realizar;
* cuándo debe realizarse un seguimiento.

## Usuario principal

Estudiante o candidato trainee que busca pasantías o puestos relacionados con:

* desarrollo;
* soporte funcional;
* análisis de procesos;
* SQL;
* tecnología de la información.

## Funcionalidades del MVP

### Implementado

* crear oportunidades;
* visualizar oportunidades;
* editar oportunidades;
* cambiar el estado de una oportunidad con reglas de transición explícitas;
* eliminar oportunidades de forma permanente con confirmación explícita;
* registrar una postulación a partir de una oportunidad, con confirmación explícita;
* gestionar el estado de cada postulación con reglas de transición explícitas;
* editar la fecha de postulación, el próximo seguimiento, la próxima acción y las notas;
* identificar próximos seguimientos (vencidos, para hoy y próximos) y marcarlos como hechos;
* buscar por empresa o puesto;
* filtrar por estado;
* mostrar estadísticas básicas;
* validar formularios;
* persistir datos con `localStorage`;
* diseño responsive.

### Planificado
* compatibilidad entre oportunidades y perfil basada en reglas explicables (sin costo).

## Datos de una oportunidad

* identificador;
* empresa;
* puesto;
* descripción;
* enlace a la publicación;
* ubicación;
* modalidad;
* tipo de jornada;
* experiencia requerida;
* habilidades requeridas;
* habilidades preferidas;
* requisitos de idioma;
* salario;
* fecha de publicación;
* fecha de detección;
* estado;
* fecha de creación;
* fecha de última modificación;
* fuente (referencia a la empresa que originó la oportunidad).

## Estados de una oportunidad

* Detectada;
* Guardada;
* Descartada;
* Archivada.

## Estados de una postulación

* Postulado;
* Entrevista;
* Prueba técnica;
* Oferta (final);
* Rechazado (final).

Desde Postulado se puede avanzar a Entrevista, Prueba técnica o Rechazado. Entrevista y Prueba técnica pueden alternarse entre sí y avanzar a Oferta o Rechazado. Oferta y Rechazado son estados finales: no se pueden cambiar y la aplicación pide confirmación antes de aplicarlos.

## Tecnologías utilizadas

* React;
* Vite;
* JavaScript;
* CSS;
* localStorage;
* Git;
* GitHub.

## Ejecución local

Después de instalar las dependencias con `npm install`, iniciá Vite con:

```bash
npm run dev -- --host 127.0.0.1
```

Abrí siempre la URL canónica informada por Vite:

```text
http://127.0.0.1:5173/
```

`localStorage` está aislado por origen, es decir, por la combinación de protocolo, nombre del host y puerto. Por eso `http://127.0.0.1:5173` y `http://localhost:5173` almacenan colecciones independientes, aunque muestren la misma aplicación. Tampoco comparten datos dos puertos diferentes.

### Verificación

```bash
npm run lint
npm test
npm run build
```

`npm test` ejecuta las pruebas unitarias de la carpeta `tests/` con el ejecutor nativo de Node.js (`node:test`), sin dependencias adicionales. Cubren las reglas de dominio de oportunidades y postulaciones, la validación de formularios, la búsqueda, las métricas, la edición, los cambios de estado, la eliminación, el registro de postulaciones y los repositorios de `localStorage`, incluidos los datos corruptos.

## Publicación

La aplicación se publica en GitHub Pages:

```text
https://tato22-alt.github.io/gestor-postulaciones-it/
```

Cada push a `main` ejecuta el workflow `.github/workflows/deploy.yml`, que instala dependencias con `npm ci`, corre `npm run lint` y `npm test`, compila con `npm run build` y publica la carpeta `dist`. Si el lint o las pruebas fallan, no se publica nada.

Solo se publica código estático. No hay variables de entorno, secretos ni servidor. Los datos que cargues en la versión publicada quedan en el `localStorage` de tu navegador para ese sitio; no se envían a ningún lado y no se comparten con la versión local (`http://127.0.0.1:5173`), porque son orígenes distintos.

Requisito de una sola vez: en GitHub, *Settings → Pages → Build and deployment → Source* debe estar en **GitHub Actions**.

## Funcionalidades fuera del alcance actual

* TypeScript;
* Next.js;
* Tailwind;
* Bootstrap;
* Redux;
* React Router;
* backend;
* autenticación;
* base de datos remota;
* InsForge;
* inteligencia artificial;
* librerías grandes de componentes.

## Evolución futura hacia InsForge

En una segunda etapa se estudiará la incorporación de:

* InsForge;
* PostgreSQL;
* CRUD remoto;
* APIs;
* autenticación;
* sesiones;
* variables de entorno;
* Edge Functions;
* estados de carga;
* manejo de errores.

## Evolución futura con inteligencia artificial

En una tercera etapa se estudiarán funcionalidades como:

* análisis de descripciones laborales;
* extracción de requisitos;
* comparación con el perfil;
* preguntas de entrevista;
* borradores de seguimiento.

Las API keys secretas nunca deben exponerse en React.

## Método de trabajo educativo

Cada decisión técnica importante debe explicar:

1. qué problema resuelve;
2. por qué se eligió;
3. qué alternativas existen;
4. qué concepto permite aprender;
5. cómo se puede defender en una entrevista.

## Estado actual del proyecto

La aplicación permite cargar manualmente oportunidades laborales, validar los campos obligatorios y conservarlas entre recargas del navegador. Cada alta crea una instancia de `JobOpportunity`, actualiza el dashboard a partir de la colección real y guarda la colección completa mediante un repositorio aislado de `localStorage`, sin convertir la oportunidad en una postulación.

Los datos persistidos usan una clave propia y un formato versionado. Al iniciar, el repositorio valida la estructura antes de reconstruir instancias reales de `JobOpportunity`. Si encuentra datos corruptos o una versión no compatible, no los sobrescribe: inicia una sesión sin persistencia y muestra una advertencia recuperable.

Las métricas no se persisten por separado: se recalculan desde las oportunidades cada vez que cambia el estado de React. Otras pestañas abiertas con el mismo origen reciben los cambios mediante el evento `storage`; las pestañas con otro host o puerto no se sincronizan.

La vista de oportunidades permite buscar por empresa o puesto y filtrar por cualquiera de los estados controlados. La búsqueda y el filtro pueden combinarse, no modifican la colección persistida y vuelven a su estado inicial al recargar la página. El dashboard continúa mostrando métricas de la colección completa, aunque la vista esté filtrada.

Las oportunidades existentes pueden editarse sin cambiar su identidad ni su fecha de creación. El formulario de edición incluye un selector de estado que muestra únicamente el estado actual y las transiciones permitidas por la política del dominio. La edición reutiliza las mismas reglas de validación del alta, actualiza `updatedAt`, persiste la colección completa y recalcula automáticamente la búsqueda, los filtros y el dashboard. Si otra pestaña modifica la misma oportunidad mientras el formulario está abierto, el guardado se bloquea para evitar sobrescribir silenciosamente datos más recientes.

El estado de una oportunidad también puede cambiarse directamente desde los botones de acción de la tarjeta, sin abrir el formulario. Las transiciones permitidas son: desde detectada se puede guardar, descartar o archivar; desde guardada o descartada se puede mover entre sí o archivar; desde archivada se puede restaurar a cualquier otro estado. Las auto-transiciones y los retrocesos de guardada o descartada a detectada siempre se rechazan. Las tarjetas descartadas y archivadas tienen tratamiento visual diferenciado para identificarlas rápidamente.

Una oportunidad puede eliminarse permanentemente desde su tarjeta, independientemente del estado en que se encuentre. La eliminación requiere confirmación explícita en un diálogo y no puede deshacerse. Si otra pestaña modificó la oportunidad mientras el diálogo estaba abierto, la eliminación se bloquea para evitar perder cambios más recientes.

El formulario de oportunidad se cierra con la tecla Escape, con el mismo efecto que el botón Cancelar: el borrador se descarta sin guardarse. Al cerrar el formulario o el diálogo de confirmación, el foco del teclado vuelve al botón que los abrió o, si ese botón ya no existe, al botón «Agregar oportunidad». Mientras el diálogo de confirmación está abierto, el foco del teclado queda contenido dentro de él. La búsqueda ignora los acentos, cada acción exitosa muestra una confirmación breve y, si una oportunidad nueva queda oculta por la búsqueda o el filtro activos, se muestra un aviso con la opción de restablecerlos.

Cada oportunidad detectada o guardada ofrece el botón «Registrar postulación». Al presionarlo, la aplicación pregunta si ya te postulaste; solo después de confirmar crea una `Application` vinculada a la oportunidad. La aplicación no envía nada a la empresa: únicamente registra una acción que ya realizaste. Cada oportunidad puede tener como máximo una postulación, y registrarla no cambia el estado de la oportunidad. Una oportunidad con postulación registrada no puede eliminarse. Las postulaciones se guardan con una clave propia de `localStorage`, con el mismo formato versionado y la misma validación estricta que las oportunidades.

Cada postulación puede tener un próximo seguimiento. Al registrarla, la aplicación sugiere una fecha 7 días después; al pasar a Entrevista, 3 días después; y al pasar a Prueba técnica, 5 días después. Oferta y Rechazado no tienen seguimiento. La fecha sugerida siempre puede cambiarse o borrarse con «Editar postulación», donde también se corrigen la fecha de postulación (que no puede ser futura), la próxima acción y las notas. El panel «Próximos seguimientos» ordena los seguimientos por fecha y los marca como «Vencido», «Hoy» o «Próximo» con texto, no solo con color. «Marcar como hecho» quita el seguimiento; si necesitás otro, lo programás editando la postulación.

Esta persistencia es exclusivamente local al navegador, origen y dispositivo actuales. Todavía no existen sincronización remota ni cuentas de usuario.

## Autor

Luciano Dominguez  
Estudiante de la Licenciatura en Gestión de Tecnología de la Información — UADE.
