// Spanish messages for the error codes of the AI suggestion client.
export const SUGGESTION_ERRORS = {
  rate_limited: 'Se alcanzó el límite diario de sugerencias. Probá mañana o cargalas a mano.',
  provider_busy: 'El servicio de IA está ocupado. Probá de nuevo en unos minutos.',
  timeout: 'El servicio de IA tardó demasiado. Probá de nuevo.',
  network: 'No hay conexión con el servicio de IA. Revisá tu conexión y probá de nuevo.',
  invalid_input: 'El texto es demasiado largo o está vacío para pedir sugerencias.',
  not_configured: 'Las sugerencias con IA todavía no están configuradas.',
}
export const DEFAULT_SUGGESTION_ERROR = 'No pudimos obtener sugerencias. Probá de nuevo o cargalas a mano.'
