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

* crear postulaciones;
* visualizar postulaciones;
* editar postulaciones;
* eliminar postulaciones;
* buscar por empresa o puesto;
* filtrar por estado;
* mostrar estadísticas básicas;
* identificar próximos seguimientos;
* validar formularios;
* persistir datos con `localStorage`;
* diseño responsive;
* publicación online.

## Datos de una postulación

* empresa;
* puesto;
* enlace;
* fecha de postulación;
* estado;
* modalidad;
* fuente;
* fecha de seguimiento;
* próxima acción;
* notas.

## Estados disponibles

* Guardada;
* Postulado;
* Entrevista;
* Prueba técnica;
* Rechazado;
* Oferta.

## Tecnologías utilizadas

* React;
* Vite;
* JavaScript;
* CSS;
* localStorage;
* Git;
* GitHub.

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

La aplicación permite cargar manualmente oportunidades laborales, validar los campos obligatorios y mostrarlas durante la sesión actual. Cada alta crea una instancia de `JobOpportunity` y actualiza los contadores sin convertir la oportunidad en una postulación.

La persistencia todavía no está implementada. Las oportunidades se conservan únicamente en memoria y desaparecen al recargar la página; `localStorage` continúa como una capacidad planificada del MVP.

## Autor

Luciano Dominguez  
Estudiante de la Licenciatura en Gestión de Tecnología de la Información — UADE.
