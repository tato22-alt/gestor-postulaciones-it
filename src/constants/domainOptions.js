export const SOURCE_STATUSES = Object.freeze({
  PENDING: { value: 'pending', label: 'Pendiente' },
  APPROVED: { value: 'approved', label: 'Aprobada' },
  REJECTED: { value: 'rejected', label: 'Rechazada' },
  PAUSED: { value: 'paused', label: 'Pausada' },
})

export const OPPORTUNITY_STATUSES = Object.freeze({
  DETECTED: { value: 'detected', label: 'Detectada' },
  SAVED: { value: 'saved', label: 'Guardada' },
  DISMISSED: { value: 'dismissed', label: 'Descartada' },
  ARCHIVED: { value: 'archived', label: 'Archivada' },
})

export const APPLICATION_STATUSES = Object.freeze({
  APPLIED: { value: 'applied', label: 'Postulado' },
  INTERVIEW: { value: 'interview', label: 'Entrevista' },
  TECHNICAL_TEST: { value: 'technical_test', label: 'Prueba técnica' },
  REJECTED: { value: 'rejected', label: 'Rechazado' },
  OFFER: { value: 'offer', label: 'Oferta' },
})

export const MODALITIES = Object.freeze({
  ON_SITE: { value: 'on_site', label: 'Presencial' },
  HYBRID: { value: 'hybrid', label: 'Híbrida' },
  REMOTE: { value: 'remote', label: 'Remota' },
})

export const EMPLOYMENT_TYPES = Object.freeze({
  FULL_TIME: { value: 'full_time', label: 'Tiempo completo' },
  PART_TIME: { value: 'part_time', label: 'Medio tiempo' },
  INTERNSHIP: { value: 'internship', label: 'Pasantía' },
})

export const REQUIREMENT_POLICIES = Object.freeze({
  EXCLUDE: { value: 'exclude', label: 'Excluir' },
  WARN: { value: 'warn', label: 'Advertir' },
  IGNORE: { value: 'ignore', label: 'Ignorar' },
})

export const RECOMMENDATIONS = Object.freeze({
  RECOMMENDED: { value: 'recommended', label: 'Recomendada' },
  REVIEW: { value: 'review', label: 'Revisar' },
  LOW_PRIORITY: { value: 'low_priority', label: 'Prioridad baja' },
})

export const SALARY_PERIODS = Object.freeze({
  HOURLY: { value: 'hourly', label: 'Por hora' },
  MONTHLY: { value: 'monthly', label: 'Mensual' },
  YEARLY: { value: 'yearly', label: 'Anual' },
})

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: { value: 'in_app', label: 'En la aplicación' },
  EMAIL: { value: 'email', label: 'Correo electrónico' },
})
