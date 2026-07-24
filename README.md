# Gestor de Postulaciones IT

## Descripción

Aplicación web para registrar, organizar y realizar el seguimiento de postulaciones laborales relacionadas con tecnología.

## Problema que resuelve

Las oportunidades laborales pueden quedar distribuidas entre LinkedIn, portales, correos y notas. Esto dificulta saber:

* dónde se realizó cada postulación;
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

* crear postulaciones;
* visualizar postulaciones;
* editar postulaciones;
* buscar por empresa o puesto;
* filtrar por estado;
* mostrar estadísticas básicas;
* validar formularios;
* persistir datos con `localStorage`;
* diseño responsive.

### Planificado

* eliminar postulaciones;
* identificar próximos seguimientos;
* publicación online.

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

Los estados de postulación (Postulado, Entrevista, Prueba técnica, Rechazado, Oferta) existen en el modelo de dominio dentro de la clase `Application`, pero todavía no tienen un flujo de trabajo implementado en la interfaz.

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

Las oportunidades existentes pueden editarse sin cambiar su identidad ni su fecha de creación. La edición reutiliza las mismas reglas de validación del alta, actualiza `updatedAt`, persiste la colección completa y recalcula automáticamente la búsqueda, los filtros y el dashboard. Si otra pestaña modifica la misma oportunidad mientras el formulario está abierto, el guardado se bloquea para evitar sobrescribir silenciosamente datos más recientes.

Esta persistencia es exclusivamente local al navegador, origen y dispositivo actuales. Todavía no existen eliminación, sincronización remota, postulaciones funcionales, seguimientos funcionales ni cuentas de usuario.

## Autor

Luciano Dominguez  
Estudiante de la Licenciatura en Gestión de Tecnología de la Información — UADE.
