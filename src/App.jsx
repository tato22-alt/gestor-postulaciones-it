import { useEffect, useRef, useState } from 'react'
import './App.css'
import calculateApplicationMetrics from './application/calculateApplicationMetrics.js'
import calculateDashboardMetrics from './application/calculateDashboardMetrics.js'
import changeApplicationStatus from './application/changeApplicationStatus.js'
import changeOpportunityStatus from './application/changeOpportunityStatus.js'
import completeFollowUp from './application/completeFollowUp.js'
import { buildApplicationsCsv, buildOpportunitiesCsv } from './application/csvExport.js'
import deleteApplication from './application/deleteApplication.js'
import deleteOpportunity from './application/deleteOpportunity.js'
import filterOpportunities from './application/filterOpportunities.js'
import getPendingFollowUps from './application/getPendingFollowUps.js'
import { addProfileSkill, removeProfileSkill } from './application/manageProfile.js'
import { createSource, deleteSource, updateSource } from './application/manageSources.js'
import planBackupImport from './application/planBackupImport.js'
import registerApplication from './application/registerApplication.js'
import updateApplicationDetails from './application/updateApplicationDetails.js'
import updateOpportunity from './application/updateOpportunity.js'
import ApplicationList from './components/ApplicationList.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import CreatedUnderFilterNotice from './components/CreatedUnderFilterNotice.jsx'
import DataPanel from './components/DataPanel.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import OpportunityForm from './components/OpportunityForm.jsx'
import OpportunitySection from './components/OpportunitySection.jsx'
import PersistenceWarning from './components/PersistenceWarning.jsx'
import ProfilePanel from './components/ProfilePanel.jsx'
import SourcesPanel from './components/SourcesPanel.jsx'
import SyncPanel from './components/SyncPanel.jsx'
import DriveSyncPrompt from './components/DriveSyncPrompt.jsx'
import useDriveSync, { DRIVE_SYNC_STATUS } from './components/useDriveSync.js'
import StatsPanel from './components/StatsPanel.jsx'
import SuccessFeedback from './components/SuccessFeedback.jsx'
import WorkspaceTabs from './components/WorkspaceTabs.jsx'
import {
  WORKSPACE_TABS,
  getWorkspacePanelId,
  getWorkspaceTabId,
} from './components/workspaceTabIds.js'
import { APPLICATION_STATUSES } from './constants/domainOptions.js'
import { findApplicationForOpportunity } from './domain/applicationRegistrationPolicy.js'
import { isFinalApplicationStatus } from './domain/applicationStatusPolicy.js'
import { findOpportunityWithSameUrl } from './domain/duplicateOpportunityPolicy.js'
import { FOLLOW_UP_URGENCY } from './domain/followUpPolicy.js'
import JobOpportunity from './domain/JobOpportunity.js'
import {
  BACKUP_MAX_BYTES,
  createBackupText,
  parseBackupText,
} from './infrastructure/backupFile.js'
import { downloadTextFile } from './infrastructure/fileDownload.js'
import LocalStorageApplicationRepository, {
  APPLICATION_STORAGE_KEY,
} from './infrastructure/LocalStorageApplicationRepository.js'
import LocalStorageOpportunityRepository, {
  OPPORTUNITY_STORAGE_KEY,
} from './infrastructure/LocalStorageOpportunityRepository.js'
import LocalStorageDeletionRepository, {
  DELETION_STORAGE_KEY,
} from './infrastructure/LocalStorageDeletionRepository.js'
import LocalStorageProfileRepository, {
  PROFILE_STORAGE_KEY,
} from './infrastructure/LocalStorageProfileRepository.js'
import LocalStorageSourceRepository, {
  SOURCE_STORAGE_KEY,
} from './infrastructure/LocalStorageSourceRepository.js'
import { toLocalDateString } from './utils/date.js'

const LOAD_WARNING =
  'No pudimos recuperar las oportunidades guardadas de forma segura. Los datos almacenados se conservaron sin sobrescribirse. Los cambios de esta sesión no se guardarán permanentemente.'

const SAVE_WARNING =
  'La oportunidad se agregó a esta sesión, pero no pudo guardarse en el navegador. Puede perderse al recargar la página.'

const EDIT_SAVE_WARNING =
  'La oportunidad se actualizó en esta sesión, pero no pudo guardarse en el navegador. La edición puede perderse al recargar la página.'

const EDIT_CONFLICT_WARNING =
  'Esta oportunidad cambió en otra pestaña mientras la editabas. Tus cambios no se guardaron. Cancelá la edición y volvé a abrirla para trabajar con la versión más reciente.'

const EDIT_NOT_FOUND_WARNING =
  'La oportunidad que estabas editando ya no está disponible. Tus cambios no se guardaron. Cancelá la edición para continuar.'

const STATUS_CONFLICT_WARNING =
  'Esta oportunidad cambió en otra pestaña. El cambio de estado no se aplicó.'

const STATUS_SAVE_WARNING =
  'El estado se actualizó en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const DELETE_CONFLICT_WARNING =
  'Esta oportunidad cambió en otra pestaña mientras el diálogo estaba abierto. La eliminación no se aplicó.'

const DELETE_NOT_FOUND_WARNING =
  'La oportunidad que intentabas eliminar ya no está disponible.'

const DELETE_SAVE_WARNING =
  'La oportunidad se eliminó de esta sesión, pero el cambio no pudo guardarse en el navegador. Puede reaparecer al recargar la página.'

const DELETION_SAVE_WARNING =
  'El borrado se aplicó en esta sesión, pero no pudo registrarse en el navegador. Si sincronizás con Google Drive, el dato borrado podría volver a aparecer después de recargar.'

const DELETE_HAS_APPLICATION_WARNING =
  'Esta oportunidad tiene una postulación registrada, por eso no se eliminó.'

const APPLICATIONS_UNAVAILABLE_WARNING =
  'No se pueden eliminar oportunidades ni registrar postulaciones mientras las postulaciones guardadas no puedan leerse de forma segura.'

const APPLICATION_LOAD_WARNING =
  'No pudimos recuperar las postulaciones guardadas de forma segura. Los datos almacenados se conservaron sin sobrescribirse. Las postulaciones de esta sesión no se guardarán permanentemente.'

const APPLICATION_SAVE_WARNING =
  'La postulación se registró en esta sesión, pero no pudo guardarse en el navegador. Puede perderse al recargar la página.'

const APPLICATION_STATUS_SAVE_WARNING =
  'El estado de la postulación se actualizó en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const APPLICATION_REGISTRATION_WARNINGS = {
  conflict:
    'Esta oportunidad cambió en otra pestaña mientras el diálogo estaba abierto. La postulación no se registró.',
  not_found: 'La oportunidad ya no está disponible. La postulación no se registró.',
  already_applied: 'Esta oportunidad ya tiene una postulación registrada.',
  opportunity_status_not_allowed:
    'Solo se puede registrar una postulación para oportunidades detectadas o guardadas.',
}

const APPLICATION_STATUS_WARNINGS = {
  conflict: 'Esta postulación cambió en otra pestaña. El cambio de estado no se aplicó.',
  not_found: 'La postulación ya no está disponible. El cambio de estado no se aplicó.',
  invalid_transition: 'Ese cambio de estado ya no está permitido para esta postulación.',
}

const APPLICATION_EDIT_WARNINGS = {
  conflict:
    'Esta postulación cambió mientras la editabas, por ejemplo en otra pestaña. Tus cambios no se guardaron. Cancelá y volvé a abrirla para trabajar con la versión más reciente.',
  not_found: 'La postulación que estabas editando ya no está disponible. Tus cambios no se guardaron.',
  invalid_input: 'Revisá los datos ingresados. Tus cambios no se guardaron.',
}

const APPLICATION_DELETE_WARNINGS = {
  conflict: 'Esta postulación cambió mientras el diálogo estaba abierto, por ejemplo en otra pestaña. No se eliminó.',
  not_found: 'La postulación que intentabas eliminar ya no está disponible.',
}

const APPLICATION_DELETE_SAVE_WARNING =
  'La postulación se eliminó en esta sesión, pero el cambio no pudo guardarse en el navegador. Puede reaparecer al recargar la página.'

const APPLICATION_EDIT_SAVE_WARNING =
  'La postulación se actualizó en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const FOLLOW_UP_WARNINGS = {
  conflict: 'Esta postulación cambió en otra pestaña. El seguimiento no se marcó como hecho.',
  not_found: 'La postulación ya no está disponible.',
  no_follow_up: 'Este seguimiento ya se había marcado como hecho.',
}

const FOLLOW_UP_SAVE_WARNING =
  'El seguimiento se marcó como hecho en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const UNEXPECTED_APPLICATION_WARNING =
  'No pudimos completar la acción sobre la postulación. Intentá nuevamente.'

const BACKUP_IMPORT_ERRORS = {
  too_large: 'El archivo supera los 5 MB permitidos para un respaldo.',
  invalid_json: 'El archivo no es un respaldo válido: no se pudo leer como JSON.',
  unknown_format: 'El archivo no es un respaldo de Gestor de Postulaciones IT.',
  unsupported_version: 'El respaldo fue creado con una versión no compatible.',
  invalid_records: 'El respaldo contiene datos inválidos. No se importó nada.',
  read_failure: 'No se pudo leer el archivo seleccionado.',
  blocked:
    'No se puede importar mientras los datos guardados no puedan leerse. Descargá primero los datos guardados desde el aviso de almacenamiento.',
}

const BACKUP_NOTHING_NEW_MESSAGE =
  'El respaldo no tiene datos nuevos: todo lo que contiene ya está en este navegador.'

const BACKUP_EXPORT_PARTIAL_MESSAGE =
  'Se exportó un respaldo con los datos de esta sesión, pero no incluye los datos guardados que no se pudieron leer. Descargalos desde el aviso de almacenamiento.'

const CORRUPTED_DOWNLOAD_LABEL = 'Descargar los datos guardados tal como están'

const SOURCE_LOAD_WARNING =
  'No pudimos recuperar las fuentes guardadas de forma segura. Los datos almacenados se conservaron sin sobrescribirse. Las fuentes de esta sesión no se guardarán permanentemente.'

const SOURCE_SAVE_WARNING =
  'La fuente se actualizó en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const SOURCE_EDIT_WARNINGS = {
  conflict:
    'Esta fuente cambió mientras la editabas, por ejemplo en otra pestaña. Tus cambios no se guardaron. Cancelá y volvé a abrirla.',
  not_found: 'La fuente que estabas editando ya no está disponible.',
  invalid_input: 'Revisá los datos ingresados.',
}

const SOURCE_DELETE_WARNINGS = {
  conflict: 'Esta fuente cambió mientras el diálogo estaba abierto. No se eliminó.',
  not_found: 'La fuente que intentabas eliminar ya no está disponible.',
  has_opportunities: 'La fuente tiene oportunidades asociadas, por eso no se eliminó.',
  form_open: 'Hay una oportunidad abierta para cargar desde esta fuente. Guardala o cancelala antes de eliminar la fuente.',
  opportunities_unavailable:
    'No se pueden eliminar fuentes mientras las oportunidades guardadas no puedan leerse.',
}

const PROFILE_LOAD_WARNING =
  'No pudimos recuperar el perfil guardado de forma segura. Los datos almacenados se conservaron sin sobrescribirse. Los cambios del perfil de esta sesión no se guardarán permanentemente.'

const PROFILE_SAVE_WARNING =
  'El perfil se actualizó en esta sesión, pero no pudo guardarse en el navegador. El cambio puede perderse al recargar la página.'

const OPPORTUNITY_SOURCE_MISSING_WARNING =
  'La fuente de esta oportunidad ya no existe. Tus datos no se guardaron: cancelá y cargá la oportunidad otra vez.'

const CREATE_SUCCESS_MESSAGE = 'Oportunidad creada.'
const EDIT_SUCCESS_MESSAGE = 'Oportunidad editada.'
const STATUS_SUCCESS_MESSAGE = 'Estado actualizado.'
const DELETE_SUCCESS_MESSAGE = 'Oportunidad eliminada.'
const APPLICATION_SUCCESS_MESSAGE =
  'Postulación registrada. La encontrás en la pestaña «Postulaciones».'
const APPLICATION_STATUS_SUCCESS_MESSAGE = 'Estado de la postulación actualizado.'
const APPLICATION_EDIT_SUCCESS_MESSAGE = 'Postulación actualizada.'
const APPLICATION_DELETE_SUCCESS_MESSAGE = 'Postulación eliminada.'
const SOURCE_CREATE_SUCCESS_MESSAGE = 'Fuente agregada.'
const SOURCE_EDIT_SUCCESS_MESSAGE = 'Fuente actualizada.'
const SOURCE_DELETE_SUCCESS_MESSAGE = 'Fuente eliminada.'
const SKILL_ADD_SUCCESS_MESSAGE = 'Skill agregada.'
const SKILL_REMOVE_SUCCESS_MESSAGE = 'Skill quitada.'
const BACKUP_EXPORT_SUCCESS_MESSAGE = 'Respaldo exportado.'
const CSV_EXPORT_SUCCESS_MESSAGE = 'Planilla CSV exportada.'
const FOLLOW_UP_SUCCESS_MESSAGE =
  'Seguimiento marcado como hecho. Si necesitás otro, programalo con «Editar postulación».'

// Returns a warning updater: a failed save replaces any older message (for example a stale
// conflict), except the load warning, which must stay visible while persistence is blocked.
function keepLoadWarningOr(loadWarning, nextWarning) {
  return (currentWarning) => (currentWarning === loadWarning ? currentWarning : nextWarning)
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

function describeBackupImport(plan) {
  const sourcesPart =
    plan.sourcesToAdd.length > 0
      ? `${pluralize(plan.sourcesToAdd.length, 'fuente', 'fuentes')}, `
      : ''
  const profilePart = plan.profileToAdd ? 'tu perfil, ' : ''
  const lines = [
    `Se van a agregar ${profilePart}${sourcesPart}${pluralize(plan.opportunitiesToAdd.length, 'oportunidad', 'oportunidades')} y ${pluralize(plan.applicationsToAdd.length, 'postulación', 'postulaciones')}.`,
  ]
  const { skipped } = plan
  const omitted = [
    skipped.existingProfile && 'el perfil, porque ya tenés uno en este navegador',
    skipped.existingSources > 0 &&
      `${pluralize(skipped.existingSources, 'fuente que ya existe', 'fuentes que ya existen')}`,
    skipped.existingOpportunities > 0 &&
      `${pluralize(skipped.existingOpportunities, 'oportunidad que ya existe', 'oportunidades que ya existen')}`,
    skipped.opportunitiesWithoutSource > 0 &&
      `${pluralize(skipped.opportunitiesWithoutSource, 'oportunidad se importa sin su fuente porque la fuente no está', 'oportunidades se importan sin su fuente porque la fuente no está')}`,
    skipped.existingApplications > 0 &&
      `${pluralize(skipped.existingApplications, 'postulación que ya existe', 'postulaciones que ya existen')}`,
    skipped.applicationsAlreadyApplied > 0 &&
      `${pluralize(skipped.applicationsAlreadyApplied, 'postulación para una oportunidad que ya tiene otra', 'postulaciones para oportunidades que ya tienen otra')}`,
    skipped.applicationsWithoutOpportunity > 0 &&
      `${pluralize(skipped.applicationsWithoutOpportunity, 'postulación sin su oportunidad', 'postulaciones sin su oportunidad')}`,
  ].filter(Boolean)

  if (omitted.length > 0) {
    lines.push(`Se omiten: ${omitted.join('; ')}.`)
  }

  lines.push('No se borra ni se reemplaza nada de lo que ya tenés.')
  return lines.join(' ')
}

function getApplicationStatusLabel(status) {
  return Object.values(APPLICATION_STATUSES).find((option) => option.value === status)?.label ?? status
}

// Drives both the removal timer below and the CSS fade duration (passed as a prop),
// so there is a single source of truth for how long the feedback stays visible.
const SUCCESS_FEEDBACK_DURATION_MS = 4000

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const opportunityRepository = new LocalStorageOpportunityRepository(getBrowserStorage())
const initialOpportunityLoad = opportunityRepository.loadAll()
const applicationRepository = new LocalStorageApplicationRepository(getBrowserStorage())
const initialApplicationLoad = applicationRepository.loadAll()
const sourceRepository = new LocalStorageSourceRepository(getBrowserStorage())
const initialSourceLoad = sourceRepository.loadAll()
const deletionRepository = new LocalStorageDeletionRepository(getBrowserStorage())
const initialDeletionLoad = deletionRepository.loadAll()
const profileRepository = new LocalStorageProfileRepository(getBrowserStorage())
const initialProfileLoad = profileRepository.load()

// Public OAuth client identifier for Google Drive synchronization. Without it, the
// synchronization section is not shown.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function App() {
  const [opportunities, setOpportunities] = useState(initialOpportunityLoad.opportunities)
  const [isOpportunityFormVisible, setIsOpportunityFormVisible] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState(
    initialOpportunityLoad.ok ? null : LOAD_WARNING,
  )
  const [applications, setApplications] = useState(initialApplicationLoad.applications)
  const [sources, setSources] = useState(initialSourceLoad.sources)
  // Deletion records: what was deleted and when, so synchronization does not restore it.
  const [deletions, setDeletions] = useState(initialDeletionLoad.deletions)
  const [sourceWarning, setSourceWarning] = useState(initialSourceLoad.ok ? null : SOURCE_LOAD_WARNING)
  // The candidate profile (only skills for now), or null before the first skill is added.
  const [profile, setProfile] = useState(initialProfileLoad.profile)
  const [profileWarning, setProfileWarning] = useState(
    initialProfileLoad.ok ? null : PROFILE_LOAD_WARNING,
  )
  const [sourceEditSession, setSourceEditSession] = useState(null)
  const [sourceEditWarning, setSourceEditWarning] = useState(null)
  const [pendingSourceDeletion, setPendingSourceDeletion] = useState(null)
  // Source that the opportunity form is creating from, if any. Temporary UI state.
  const [opportunityFormSource, setOpportunityFormSource] = useState(null)
  const [applicationWarning, setApplicationWarning] = useState(
    initialApplicationLoad.ok ? null : APPLICATION_LOAD_WARNING,
  )
  // True while stored applications could not be read safely: the app then cannot know which
  // opportunities already have an application, so deleting or registering would be unsafe.
  const [areStoredApplicationsUnavailable, setAreStoredApplicationsUnavailable] = useState(
    !initialApplicationLoad.ok,
  )
  const [pendingApplicationRegistration, setPendingApplicationRegistration] = useState(null)
  const [pendingFinalApplicationStatus, setPendingFinalApplicationStatus] = useState(null)
  const [applicationEditSession, setApplicationEditSession] = useState(null)
  const [pendingApplicationDeletion, setPendingApplicationDeletion] = useState(null)
  const [applicationEditWarning, setApplicationEditWarning] = useState(null)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(WORKSPACE_TABS.OPPORTUNITIES)
  const [opportunitySearchQuery, setOpportunitySearchQuery] = useState('')
  const [opportunityStatusFilter, setOpportunityStatusFilter] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [editWarning, setEditWarning] = useState(null)
  const [pendingDeletion, setPendingDeletion] = useState(null)
  const [successFeedback, setSuccessFeedback] = useState(null)
  const [dataPanelMessage, setDataPanelMessage] = useState(null)
  const [pendingBackupImport, setPendingBackupImport] = useState(null)
  const [isCreatedUnderFilterNoticeVisible, setIsCreatedUnderFilterNoticeVisible] =
    useState(false)
  const addOpportunityButtonRef = useRef(null)
  const formTriggerRef = useRef(null)
  const applicationsHeadingRef = useRef(null)
  const opportunitiesHeadingRef = useRef(null)
  const sourcesHeadingRef = useRef(null)
  const followUpsHeadingRef = useRef(null)
  const successFeedbackIdRef = useRef(0)
  const dataPanelMessageIdRef = useRef(0)
  const successFeedbackTimeoutRef = useRef(null)
  const visibleOpportunities = filterOpportunities(opportunities, {
    searchQuery: opportunitySearchQuery,
    status: opportunityStatusFilter,
  })
  const dashboardMetrics = calculateDashboardMetrics({
    opportunities,
    now: new Date(),
  })
  const applicationMetrics = calculateApplicationMetrics({ applications })
  const pendingFollowUps = getPendingFollowUps({
    applications,
    opportunities,
    now: new Date(),
  })
  const dueFollowUpCount = pendingFollowUps.filter(
    (followUp) => followUp.urgency !== FOLLOW_UP_URGENCY.UPCOMING,
  ).length

  useEffect(() => {
    const synchronizeStoredCollections = (event) => {
      if (event.key === OPPORTUNITY_STORAGE_KEY) {
        const loadResult = opportunityRepository.loadAll()

        if (loadResult.ok) {
          setOpportunities([...loadResult.opportunities])
          setPersistenceWarning(null)
        } else {
          setPersistenceWarning(LOAD_WARNING)
        }
      }

      if (event.key === DELETION_STORAGE_KEY) {
        const loadResult = deletionRepository.loadAll()

        if (loadResult.ok) {
          setDeletions([...loadResult.deletions])
        }
      }

      if (event.key === SOURCE_STORAGE_KEY) {
        const loadResult = sourceRepository.loadAll()

        if (loadResult.ok) {
          setSources([...loadResult.sources])
          setSourceWarning(null)
        } else {
          setSourceWarning(SOURCE_LOAD_WARNING)
        }
      }

      if (event.key === PROFILE_STORAGE_KEY) {
        const loadResult = profileRepository.load()

        if (loadResult.ok) {
          setProfile(loadResult.profile)
          setProfileWarning(null)
        } else {
          setProfileWarning(PROFILE_LOAD_WARNING)
        }
      }

      if (event.key === APPLICATION_STORAGE_KEY) {
        const loadResult = applicationRepository.loadAll()

        if (loadResult.ok) {
          setApplications([...loadResult.applications])
          setApplicationWarning(null)
          setAreStoredApplicationsUnavailable(false)
        } else {
          setApplicationWarning(APPLICATION_LOAD_WARNING)
          setAreStoredApplicationsUnavailable(true)
        }
      }
    }

    window.addEventListener('storage', synchronizeStoredCollections)

    return () => {
      window.removeEventListener('storage', synchronizeStoredCollections)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (successFeedbackTimeoutRef.current) {
        clearTimeout(successFeedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpportunityFormVisible) return

    const trigger = formTriggerRef.current
    if (!trigger) return

    // The trigger may be gone or inside a tab panel that is now hidden.
    if (document.contains(trigger) && trigger.getClientRects().length > 0) {
      trigger.focus()
    } else {
      addOpportunityButtonRef.current?.focus()
    }

    formTriggerRef.current = null
  }, [isOpportunityFormVisible])

  const saveDeletions = (nextDeletions) => {
    setDeletions(nextDeletions)

    if (!deletionRepository.saveAll(nextDeletions).ok) {
      showDataPanelMessage({ type: 'error', text: DELETION_SAVE_WARNING })
    }
  }

  const recordDeletion = (collection, id) => {
    saveDeletions([
      ...deletions.filter((record) => !(record.collection === collection && record.id === id)),
      { collection, id, deletedAt: new Date().toISOString() },
    ])
  }

  const showSuccessFeedback = (message) => {
    if (successFeedbackTimeoutRef.current) {
      clearTimeout(successFeedbackTimeoutRef.current)
    }

    successFeedbackIdRef.current += 1
    setSuccessFeedback({ id: successFeedbackIdRef.current, message })

    successFeedbackTimeoutRef.current = setTimeout(() => {
      setSuccessFeedback(null)
      successFeedbackTimeoutRef.current = null
    }, SUCCESS_FEEDBACK_DURATION_MS)
  }

  const openOpportunityForm = () => {
    setActiveWorkspaceTab(WORKSPACE_TABS.OPPORTUNITIES)
    formTriggerRef.current = document.activeElement
    setOpportunityFormSource(null)
    setEditingSession(null)
    setEditWarning(null)
    setIsOpportunityFormVisible(true)
  }

  const openOpportunityFormFromSource = (source) => {
    openOpportunityForm()
    setOpportunityFormSource({ id: source.id, companyName: source.companyName })
  }

  const closeOpportunityForm = () => {
    setOpportunityFormSource(null)
    setIsOpportunityFormVisible(false)
    setEditingSession(null)
    setEditWarning(null)
  }

  const openOpportunityEditForm = (opportunity) => {
    formTriggerRef.current = document.activeElement
    setEditingSession({
      id: opportunity.id,
      expectedUpdatedAt: opportunity.updatedAt,
      initialValues: opportunity,
    })
    setEditWarning(null)
    setIsOpportunityFormVisible(true)
  }

  const applyStatusChange = (opportunity, nextStatus) => {
    const result = changeOpportunityStatus(opportunity, {
      nextStatus,
      expectedUpdatedAt: opportunity.updatedAt,
    })

    if (!result.ok) {
      if (result.status === 'conflict') {
        setPersistenceWarning(STATUS_CONFLICT_WARNING)
      }
      return
    }

    const nextOpportunities = opportunities.map((opp) =>
      opp.id === result.opportunity.id ? result.opportunity : opp,
    )

    setOpportunities(nextOpportunities)
    showSuccessFeedback(STATUS_SUCCESS_MESSAGE)

    const saveResult = opportunityRepository.saveAll(nextOpportunities)

    if (saveResult.ok) {
      setPersistenceWarning(null)
    } else {
      setPersistenceWarning(keepLoadWarningOr(LOAD_WARNING, STATUS_SAVE_WARNING))
    }
  }

  const opportunityToDelete = pendingDeletion
    ? (opportunities.find((opp) => opp.id === pendingDeletion.id) ?? null)
    : null

  const requestDeleteOpportunity = (opportunity) => {
    if (areStoredApplicationsUnavailable) {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATIONS_UNAVAILABLE_WARNING))
      return
    }

    if (findApplicationForOpportunity(applications, opportunity.id)) {
      setPersistenceWarning(keepLoadWarningOr(LOAD_WARNING, DELETE_HAS_APPLICATION_WARNING))
      return
    }

    setPendingDeletion({ id: opportunity.id, expectedUpdatedAt: opportunity.updatedAt })
  }

  const cancelDelete = () => {
    setPendingDeletion(null)
  }

  const confirmDelete = () => {
    if (!pendingDeletion) return

    const { id, expectedUpdatedAt } = pendingDeletion

    setPendingDeletion(null)

    // Another tab may have registered an application, or broken the stored applications,
    // while the dialog was open.
    if (areStoredApplicationsUnavailable) {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATIONS_UNAVAILABLE_WARNING))
      return
    }

    if (findApplicationForOpportunity(applications, id)) {
      setPersistenceWarning(keepLoadWarningOr(LOAD_WARNING, DELETE_HAS_APPLICATION_WARNING))
      return
    }

    const result = deleteOpportunity(opportunities, { id, expectedUpdatedAt })

    if (!result.ok) {
      setPersistenceWarning(
        result.status === 'conflict' ? DELETE_CONFLICT_WARNING : DELETE_NOT_FOUND_WARNING,
      )
      return
    }

    if (editingSession?.id === id) {
      closeOpportunityForm()
    }

    setOpportunities(result.opportunities)
    recordDeletion('opportunities', id)
    showSuccessFeedback(DELETE_SUCCESS_MESSAGE)

    const saveResult = opportunityRepository.saveAll(result.opportunities)

    if (saveResult.ok) {
      setPersistenceWarning(null)
    } else {
      setPersistenceWarning(keepLoadWarningOr(LOAD_WARNING, DELETE_SAVE_WARNING))
    }
  }

  const opportunityToRegister = pendingApplicationRegistration
    ? (opportunities.find((opp) => opp.id === pendingApplicationRegistration.opportunityId) ?? null)
    : null

  const requestApplicationRegistration = (opportunity) => {
    if (areStoredApplicationsUnavailable) {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATIONS_UNAVAILABLE_WARNING))
      return
    }

    setPendingApplicationRegistration({
      opportunityId: opportunity.id,
      expectedUpdatedAt: opportunity.updatedAt,
    })
  }

  const cancelApplicationRegistration = () => {
    setPendingApplicationRegistration(null)
  }

  const confirmApplicationRegistration = () => {
    if (!pendingApplicationRegistration) return

    if (areStoredApplicationsUnavailable) {
      setPendingApplicationRegistration(null)
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATIONS_UNAVAILABLE_WARNING))
      return
    }

    const result = registerApplication(opportunities, applications, {
      ...pendingApplicationRegistration,
      now: new Date(),
    })

    setPendingApplicationRegistration(null)

    if (!result.ok) {
      setApplicationWarning(
        APPLICATION_REGISTRATION_WARNINGS[result.status] ?? UNEXPECTED_APPLICATION_WARNING,
      )
      return
    }

    setApplications(result.applications)
    showSuccessFeedback(APPLICATION_SUCCESS_MESSAGE)

    const saveResult = applicationRepository.saveAll(result.applications)

    if (saveResult.ok) {
      setApplicationWarning(null)
    } else {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATION_SAVE_WARNING))
    }
  }

  const applyApplicationStatusChange = (application, nextStatus) => {
    const result = changeApplicationStatus(applications, {
      id: application.id,
      nextStatus,
      expectedUpdatedAt: application.updatedAt,
      now: new Date(),
    })

    if (!result.ok) {
      setApplicationWarning(
        APPLICATION_STATUS_WARNINGS[result.status] ?? UNEXPECTED_APPLICATION_WARNING,
      )
      return
    }

    setApplications(result.applications)
    showSuccessFeedback(APPLICATION_STATUS_SUCCESS_MESSAGE)

    const saveResult = applicationRepository.saveAll(result.applications)

    if (saveResult.ok) {
      setApplicationWarning(null)
    } else {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATION_STATUS_SAVE_WARNING))
    }
  }

  // Final statuses cannot be left again, so a misclick would be permanent: ask first.
  const requestApplicationStatusChange = (application, nextStatus) => {
    if (isFinalApplicationStatus(nextStatus)) {
      setPendingFinalApplicationStatus({ application, nextStatus })
      return
    }

    applyApplicationStatusChange(application, nextStatus)
  }

  const cancelFinalApplicationStatus = () => {
    setPendingFinalApplicationStatus(null)
  }

  const confirmFinalApplicationStatus = () => {
    if (!pendingFinalApplicationStatus) return

    const { application, nextStatus } = pendingFinalApplicationStatus

    setPendingFinalApplicationStatus(null)
    applyApplicationStatusChange(application, nextStatus)
  }

  const openApplicationEdit = (application) => {
    setApplicationEditSession({
      id: application.id,
      expectedUpdatedAt: application.updatedAt,
    })
    setApplicationEditWarning(null)
  }

  const cancelApplicationEdit = () => {
    setApplicationEditSession(null)
    setApplicationEditWarning(null)
  }

  const submitApplicationEdit = (changes) => {
    if (!applicationEditSession) return

    const result = updateApplicationDetails(applications, {
      ...applicationEditSession,
      changes,
      now: new Date(),
    })

    if (!result.ok) {
      setApplicationEditWarning(
        APPLICATION_EDIT_WARNINGS[result.status] ?? UNEXPECTED_APPLICATION_WARNING,
      )
      return
    }

    setApplications(result.applications)
    setApplicationEditSession(null)
    setApplicationEditWarning(null)
    showSuccessFeedback(APPLICATION_EDIT_SUCCESS_MESSAGE)

    const saveResult = applicationRepository.saveAll(result.applications)

    if (saveResult.ok) {
      setApplicationWarning(null)
    } else {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATION_EDIT_SAVE_WARNING))
    }
  }

  const requestApplicationDeletion = (application) => {
    setPendingApplicationDeletion({ id: application.id, expectedUpdatedAt: application.updatedAt })
  }

  const cancelApplicationDeletion = () => {
    setPendingApplicationDeletion(null)
  }

  const confirmApplicationDeletion = () => {
    if (!pendingApplicationDeletion) return

    const result = deleteApplication(applications, pendingApplicationDeletion)

    setPendingApplicationDeletion(null)

    if (!result.ok) {
      setApplicationWarning(APPLICATION_DELETE_WARNINGS[result.status] ?? UNEXPECTED_APPLICATION_WARNING)
      return
    }

    setApplications(result.applications)
    recordDeletion('applications', pendingApplicationDeletion.id)
    showSuccessFeedback(APPLICATION_DELETE_SUCCESS_MESSAGE)

    const saveResult = applicationRepository.saveAll(result.applications)

    if (saveResult.ok) {
      setApplicationWarning(null)
    } else {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, APPLICATION_DELETE_SAVE_WARNING))
    }
  }

  const applicationToDelete = pendingApplicationDeletion
    ? (applications.find((application) => application.id === pendingApplicationDeletion.id) ?? null)
    : null
  const opportunityOfApplicationToDelete = applicationToDelete
    ? (opportunities.find((opp) => opp.id === applicationToDelete.opportunityId) ?? null)
    : null

  const completeApplicationFollowUp = (application) => {
    const result = completeFollowUp(applications, {
      id: application.id,
      expectedUpdatedAt: application.updatedAt,
      now: new Date(),
    })

    // The completed item leaves the agenda, so focus moves to the agenda heading.
    followUpsHeadingRef.current?.focus()

    if (!result.ok) {
      setApplicationWarning(FOLLOW_UP_WARNINGS[result.status] ?? UNEXPECTED_APPLICATION_WARNING)
      return
    }

    setApplications(result.applications)
    showSuccessFeedback(FOLLOW_UP_SUCCESS_MESSAGE)

    const saveResult = applicationRepository.saveAll(result.applications)

    if (saveResult.ok) {
      setApplicationWarning(null)
    } else {
      setApplicationWarning(keepLoadWarningOr(APPLICATION_LOAD_WARNING, FOLLOW_UP_SAVE_WARNING))
    }
  }

  const isAnyStorageBlocked = () =>
    opportunityRepository.isPersistenceBlocked ||
    applicationRepository.isPersistenceBlocked ||
    sourceRepository.isPersistenceBlocked ||
    deletionRepository.isPersistenceBlocked ||
    profileRepository.isPersistenceBlocked

  // Each message gets a new id so repeating the same text is announced again.
  const showDataPanelMessage = (message) => {
    dataPanelMessageIdRef.current += 1
    setDataPanelMessage(message ? { ...message, id: dataPanelMessageIdRef.current } : null)
  }

  const todayFileSuffix = () => toLocalDateString(new Date()) ?? 'sin-fecha'

  const exportBackup = () => {
    downloadTextFile({
      filename: `gestor-postulaciones-respaldo-${todayFileSuffix()}.json`,
      content: createBackupText({ opportunities, applications, sources, deletions, profile }),
      mimeType: 'application/json',
    })

    if (isAnyStorageBlocked()) {
      showDataPanelMessage({ type: 'error', text: BACKUP_EXPORT_PARTIAL_MESSAGE })
      return
    }

    showDataPanelMessage(null)
    showSuccessFeedback(BACKUP_EXPORT_SUCCESS_MESSAGE)
  }

  const exportOpportunitiesCsv = () => {
    downloadTextFile({
      filename: `gestor-postulaciones-oportunidades-${todayFileSuffix()}.csv`,
      content: buildOpportunitiesCsv(opportunities, sources),
      mimeType: 'text/csv;charset=utf-8',
    })
    showSuccessFeedback(CSV_EXPORT_SUCCESS_MESSAGE)
  }

  const exportApplicationsCsv = () => {
    downloadTextFile({
      filename: `gestor-postulaciones-postulaciones-${todayFileSuffix()}.csv`,
      content: buildApplicationsCsv(applications, opportunities),
      mimeType: 'text/csv;charset=utf-8',
    })
    showSuccessFeedback(CSV_EXPORT_SUCCESS_MESSAGE)
  }

  const showBackupImportError = (status) => {
    showDataPanelMessage({ type: 'error', text: BACKUP_IMPORT_ERRORS[status] })
  }

  const importBackupFile = async (file) => {
    if (isAnyStorageBlocked()) {
      showBackupImportError('blocked')
      return
    }

    if (file.size > BACKUP_MAX_BYTES) {
      showBackupImportError('too_large')
      return
    }

    let text

    try {
      text = await file.text()
    } catch {
      showBackupImportError('read_failure')
      return
    }

    const parsed = parseBackupText(text)

    if (!parsed.ok) {
      showBackupImportError(parsed.status)
      return
    }

    const plan = planBackupImport({
      currentOpportunities: opportunities,
      currentApplications: applications,
      currentSources: sources,
      backupOpportunities: parsed.opportunities,
      backupApplications: parsed.applications,
      backupSources: parsed.sources,
      currentProfile: profile,
      backupProfile: parsed.profile,
      deletions,
    })

    if (!plan.hasChanges) {
      showDataPanelMessage({ type: 'info', text: BACKUP_NOTHING_NEW_MESSAGE })
      return
    }

    showDataPanelMessage(null)
    setPendingBackupImport({ backup: parsed, preview: describeBackupImport(plan) })
  }

  const cancelBackupImport = () => {
    setPendingBackupImport(null)
  }

  const confirmBackupImport = () => {
    if (!pendingBackupImport) return

    const { backup } = pendingBackupImport

    setPendingBackupImport(null)

    if (isAnyStorageBlocked()) {
      showBackupImportError('blocked')
      return
    }

    // Planned again against the current state: another tab may have changed it while the
    // confirmation dialog was open.
    const plan = planBackupImport({
      currentOpportunities: opportunities,
      currentApplications: applications,
      currentSources: sources,
      backupOpportunities: backup.opportunities,
      backupApplications: backup.applications,
      backupSources: backup.sources,
      currentProfile: profile,
      backupProfile: backup.profile,
      deletions,
      now: new Date(),
    })

    if (!plan.hasChanges) {
      showDataPanelMessage({ type: 'info', text: BACKUP_NOTHING_NEW_MESSAGE })
      return
    }

    setSources(plan.nextSources)
    setOpportunities(plan.nextOpportunities)
    setApplications(plan.nextApplications)
    setProfile(plan.nextProfile)

    // Records brought back by an import must not be removed again by an older deletion.
    const importedKeys = new Set([
      ...plan.sourcesToAdd.map((record) => `sources:${record.id}`),
      ...plan.opportunitiesToAdd.map((record) => `opportunities:${record.id}`),
      ...plan.applicationsToAdd.map((record) => `applications:${record.id}`),
    ])

    if (deletions.some((record) => importedKeys.has(`${record.collection}:${record.id}`))) {
      saveDeletions(deletions.filter((record) => !importedKeys.has(`${record.collection}:${record.id}`)))
    }

    // Collections are saved in dependency order (sources, opportunities, applications) and
    // each only if the previous one succeeded, so a failed write never leaves stored records
    // pointing to records that were not stored.
    const sourceSave = sourceRepository.saveAll(plan.nextSources)
    const opportunitySave = sourceSave.ok
      ? opportunityRepository.saveAll(plan.nextOpportunities)
      : sourceSave
    const applicationSave = opportunitySave.ok
      ? applicationRepository.saveAll(plan.nextApplications)
      : opportunitySave
    // The profile does not reference other records, so its save does not depend on them.
    const profileSave = plan.profileToAdd ? profileRepository.save(plan.nextProfile) : { ok: true }

    if (!opportunitySave.ok || !applicationSave.ok || !profileSave.ok) {
      showDataPanelMessage({
        type: 'error',
        text: 'Los datos se importaron en esta sesión, pero no pudieron guardarse en el navegador. Pueden perderse al recargar la página.',
      })
      return
    }

    setPersistenceWarning(null)
    setApplicationWarning(null)
    setSourceWarning(null)
    setProfileWarning(null)
    showDataPanelMessage({
      type: 'info',
      text: `Respaldo importado: ${plan.profileToAdd ? 'perfil agregado, ' : ''}${pluralize(plan.sourcesToAdd.length, 'fuente agregada', 'fuentes agregadas')}, ${pluralize(plan.opportunitiesToAdd.length, 'oportunidad agregada', 'oportunidades agregadas')} y ${pluralize(plan.applicationsToAdd.length, 'postulación agregada', 'postulaciones agregadas')}.`,
    })
  }

  const downloadStoredRawValue = (repository, name) => {
    const rawValue = repository.readRawValue()

    if (rawValue === null) return

    downloadTextFile({
      filename: `gestor-postulaciones-${name}-datos-guardados-${todayFileSuffix()}.txt`,
      content: rawValue,
      mimeType: 'text/plain;charset=utf-8',
    })
  }

  const opportunityWarningAction =
    persistenceWarning === LOAD_WARNING && opportunityRepository.readRawValue() !== null
      ? {
          label: CORRUPTED_DOWNLOAD_LABEL,
          onClick: () => downloadStoredRawValue(opportunityRepository, 'oportunidades'),
        }
      : null

  const sourceWarningAction =
    sourceWarning === SOURCE_LOAD_WARNING && sourceRepository.readRawValue() !== null
      ? {
          label: CORRUPTED_DOWNLOAD_LABEL,
          onClick: () => downloadStoredRawValue(sourceRepository, 'fuentes'),
        }
      : null

  const profileWarningAction =
    profileWarning === PROFILE_LOAD_WARNING && profileRepository.readRawValue() !== null
      ? {
          label: CORRUPTED_DOWNLOAD_LABEL,
          onClick: () => downloadStoredRawValue(profileRepository, 'perfil'),
        }
      : null

  const saveProfile = (nextProfile) => {
    setProfile(nextProfile)

    if (profileRepository.save(nextProfile).ok) {
      setProfileWarning(null)
    } else {
      setProfileWarning(keepLoadWarningOr(PROFILE_LOAD_WARNING, PROFILE_SAVE_WARNING))
    }
  }

  const addSkill = (skill) => {
    const result = addProfileSkill(profile, { skill, now: new Date() })

    if (!result.ok) return false

    saveProfile(result.profile)
    showSuccessFeedback(SKILL_ADD_SUCCESS_MESSAGE)
    return true
  }

  const removeSkill = (skill) => {
    const result = removeProfileSkill(profile, { skill, now: new Date() })

    if (!result.ok) return false

    saveProfile(result.profile)
    showSuccessFeedback(SKILL_REMOVE_SUCCESS_MESSAGE)
    return true
  }

  const saveSources = (nextSources) => {
    setSources(nextSources)

    const saveResult = sourceRepository.saveAll(nextSources)

    if (saveResult.ok) {
      setSourceWarning(null)
    } else {
      setSourceWarning(keepLoadWarningOr(SOURCE_LOAD_WARNING, SOURCE_SAVE_WARNING))
    }
  }

  const addSource = (changes) => {
    const result = createSource(sources, { changes, now: new Date() })

    if (!result.ok) {
      setSourceWarning(SOURCE_EDIT_WARNINGS.invalid_input)
      return false
    }

    saveSources(result.sources)
    showSuccessFeedback(SOURCE_CREATE_SUCCESS_MESSAGE)
    return true
  }

  const openSourceEdit = (source) => {
    setSourceEditSession({ id: source.id, expectedUpdatedAt: source.updatedAt })
    setSourceEditWarning(null)
  }

  const cancelSourceEdit = () => {
    setSourceEditSession(null)
    setSourceEditWarning(null)
  }

  const submitSourceEdit = (changes) => {
    if (!sourceEditSession) return false

    const result = updateSource(sources, { ...sourceEditSession, changes, now: new Date() })

    if (!result.ok) {
      setSourceEditWarning(SOURCE_EDIT_WARNINGS[result.status] ?? SOURCE_EDIT_WARNINGS.invalid_input)
      return false
    }

    saveSources(result.sources)
    setSourceEditSession(null)
    setSourceEditWarning(null)
    showSuccessFeedback(SOURCE_EDIT_SUCCESS_MESSAGE)
    return true
  }

  const getSourceDeletionBlocker = (sourceId) => {
    if (opportunityRepository.isPersistenceBlocked) return 'opportunities_unavailable'
    if (isOpportunityFormVisible && opportunityFormSource?.id === sourceId) return 'form_open'
    return null
  }

  const requestSourceDeletion = (source) => {
    const blocker = getSourceDeletionBlocker(source.id)

    if (blocker) {
      setSourceWarning(keepLoadWarningOr(SOURCE_LOAD_WARNING, SOURCE_DELETE_WARNINGS[blocker]))
      return
    }

    setPendingSourceDeletion({ id: source.id, expectedUpdatedAt: source.updatedAt })
  }

  const cancelSourceDeletion = () => {
    setPendingSourceDeletion(null)
  }

  const confirmSourceDeletion = () => {
    if (!pendingSourceDeletion) return

    setPendingSourceDeletion(null)

    const blocker = getSourceDeletionBlocker(pendingSourceDeletion.id)

    if (blocker) {
      setSourceWarning(keepLoadWarningOr(SOURCE_LOAD_WARNING, SOURCE_DELETE_WARNINGS[blocker]))
      return
    }

    const result = deleteSource(sources, opportunities, pendingSourceDeletion)

    if (!result.ok) {
      setSourceWarning(SOURCE_DELETE_WARNINGS[result.status] ?? SOURCE_EDIT_WARNINGS.invalid_input)
      return
    }

    saveSources(result.sources)
    recordDeletion('sources', pendingSourceDeletion.id)
    showSuccessFeedback(SOURCE_DELETE_SUCCESS_MESSAGE)
  }

  // Applies the result of a synchronization to this device. Collections are saved in
  // dependency order, and each only if the previous save succeeded.
  const applyMergedSnapshot = (merged) => {
    setSources(merged.sources)
    setOpportunities(merged.opportunities)
    setApplications(merged.applications)
    setDeletions(merged.deletions)
    setProfile(merged.profile)

    const saved =
      sourceRepository.saveAll(merged.sources).ok &&
      opportunityRepository.saveAll(merged.opportunities).ok &&
      applicationRepository.saveAll(merged.applications).ok &&
      deletionRepository.saveAll(merged.deletions).ok &&
      profileRepository.save(merged.profile).ok

    if (!saved) {
      showDataPanelMessage({
        type: 'error',
        text: 'Los datos sincronizados se muestran en esta sesión, pero no pudieron guardarse en el navegador.',
      })
    }
  }

  const driveSync = useDriveSync({
    clientId: GOOGLE_CLIENT_ID,
    storage: getBrowserStorage(),
    snapshot: { opportunities, applications, sources, deletions, profile },
    isStorageBlocked: isAnyStorageBlocked,
    applyMergedSnapshot,
  })

  // Hidden for this visit only; it reappears on the next visit while Drive is not connected.
  const [isDriveSyncPromptDismissed, setIsDriveSyncPromptDismissed] = useState(false)
  const isDriveSyncPromptVisible =
    driveSync.isAvailable &&
    driveSync.status === DRIVE_SYNC_STATUS.DISCONNECTED &&
    !isDriveSyncPromptDismissed

  const dismissDriveSyncPrompt = () => {
    setIsDriveSyncPromptDismissed(true)
    addOpportunityButtonRef.current?.focus()
  }

  const sourceToDelete = pendingSourceDeletion
    ? (sources.find((source) => source.id === pendingSourceDeletion.id) ?? null)
    : null
  const sourceNamesById = new Map(sources.map((source) => [source.id, source.companyName]))

  const applicationWarningAction =
    applicationWarning === APPLICATION_LOAD_WARNING && applicationRepository.readRawValue() !== null
      ? {
          label: CORRUPTED_DOWNLOAD_LABEL,
          onClick: () => downloadStoredRawValue(applicationRepository, 'postulaciones'),
        }
      : null

  const finalStatusOpportunity = pendingFinalApplicationStatus
    ? (opportunities.find(
        (opp) => opp.id === pendingFinalApplicationStatus.application.opportunityId,
      ) ?? null)
    : null

  const clearOpportunitySearch = () => {
    setOpportunitySearchQuery('')
  }

  const resetOpportunityFilters = () => {
    setOpportunitySearchQuery('')
    setOpportunityStatusFilter(null)
    setIsCreatedUnderFilterNoticeVisible(false)
  }

  const createOpportunity = (opportunityData) => {
    // The source may have been deleted (here or in another tab) while the form was open.
    if (opportunityFormSource && !sources.some((source) => source.id === opportunityFormSource.id)) {
      setEditWarning(OPPORTUNITY_SOURCE_MISSING_WARNING)
      return false
    }

    const opportunity = new JobOpportunity({
      ...opportunityData,
      sourceId: opportunityFormSource?.id ?? null,
      requiredExperience: null,
      requiredSkills: [],
      preferredSkills: [],
      languageRequirements: [],
      salary: null,
    })

    const nextOpportunities = [...opportunities, opportunity]

    setOpportunities(nextOpportunities)
    showSuccessFeedback(CREATE_SUCCESS_MESSAGE)

    const isHiddenByCurrentFilters =
      filterOpportunities([opportunity], {
        searchQuery: opportunitySearchQuery,
        status: opportunityStatusFilter,
      }).length === 0

    setIsCreatedUnderFilterNoticeVisible(isHiddenByCurrentFilters)

    const saveResult = opportunityRepository.saveAll(nextOpportunities)

    if (saveResult.ok) {
      setPersistenceWarning(null)
    } else {
      setPersistenceWarning(keepLoadWarningOr(LOAD_WARNING, SAVE_WARNING))
    }

    closeOpportunityForm()
    return true
  }

  const editOpportunity = (opportunityData) => {
    if (!editingSession) {
      return false
    }

    const updateResult = updateOpportunity(opportunities, {
      id: editingSession.id,
      expectedUpdatedAt: editingSession.expectedUpdatedAt,
      changes: opportunityData,
    })

    if (!updateResult.ok) {
      setEditWarning(
        updateResult.status === 'not_found'
          ? EDIT_NOT_FOUND_WARNING
          : EDIT_CONFLICT_WARNING,
      )
      return false
    }

    setOpportunities(updateResult.opportunities)
    showSuccessFeedback(EDIT_SUCCESS_MESSAGE)
    setIsCreatedUnderFilterNoticeVisible(false)

    const saveResult = opportunityRepository.saveAll(
      updateResult.opportunities,
    )

    if (saveResult.ok) {
      setPersistenceWarning(null)
    } else {
      setPersistenceWarning(
        keepLoadWarningOr(LOAD_WARNING, EDIT_SAVE_WARNING),
      )
    }

    closeOpportunityForm()
    return true
  }

  return (
    <div className="app-shell">
      <Header
        addOpportunityButtonRef={addOpportunityButtonRef}
        onAddOpportunity={openOpportunityForm}
      />

      <main className="app-main">
        {isDriveSyncPromptVisible && (
          <DriveSyncPrompt onConnect={driveSync.connect} onDismiss={dismissDriveSyncPrompt} />
        )}
        <StatsPanel
          metrics={dashboardMetrics}
          applicationMetrics={applicationMetrics}
          dueFollowUpCount={dueFollowUpCount}
        />
        <WorkspaceTabs
          activeTab={activeWorkspaceTab}
          applicationCount={applications.length}
          sourceCount={sources.length}
          onChange={setActiveWorkspaceTab}
        />
        <SuccessFeedback
          messageId={successFeedback?.id ?? null}
          message={successFeedback?.message ?? null}
          durationMs={SUCCESS_FEEDBACK_DURATION_MS}
        />
        <CreatedUnderFilterNotice
          isVisible={isCreatedUnderFilterNoticeVisible}
          onResetFilters={resetOpportunityFilters}
        />
        <PersistenceWarning message={persistenceWarning} action={opportunityWarningAction} />
        <PersistenceWarning message={applicationWarning} action={applicationWarningAction} />
        <PersistenceWarning message={sourceWarning} action={sourceWarningAction} />
        <PersistenceWarning message={profileWarning} action={profileWarningAction} />
        <div
          className="workspace-panel"
          role="tabpanel"
          id={getWorkspacePanelId(WORKSPACE_TABS.OPPORTUNITIES)}
          aria-labelledby={getWorkspaceTabId(WORKSPACE_TABS.OPPORTUNITIES)}
          hidden={activeWorkspaceTab !== WORKSPACE_TABS.OPPORTUNITIES}
        >
          {isOpportunityFormVisible && (
            <OpportunityForm
              key={
                editingSession
                  ? `edit-${editingSession.id}-${editingSession.expectedUpdatedAt}`
                  : `create-${opportunityFormSource?.id ?? 'manual'}`
              }
              mode={editingSession ? 'edit' : 'create'}
              initialValues={
                editingSession?.initialValues ??
                (opportunityFormSource ? { company: opportunityFormSource.companyName } : undefined)
              }
              sourceName={editingSession ? null : (opportunityFormSource?.companyName ?? null)}
              submissionWarning={editWarning}
              onSubmit={editingSession ? editOpportunity : createOpportunity}
              findOpportunityWithSameUrl={(url) =>
                findOpportunityWithSameUrl(opportunities, url, editingSession?.id ?? null)
              }
              onCancel={closeOpportunityForm}
            />
          )}
          <OpportunitySection
            opportunities={opportunities}
            visibleOpportunities={visibleOpportunities}
            applications={applications}
            sourceNamesById={sourceNamesById}
            areStoredApplicationsUnavailable={areStoredApplicationsUnavailable}
            searchQuery={opportunitySearchQuery}
            statusFilter={opportunityStatusFilter}
            onSearchChange={setOpportunitySearchQuery}
            onStatusChange={setOpportunityStatusFilter}
            onClearSearch={clearOpportunitySearch}
            onResetFilters={resetOpportunityFilters}
            onAddOpportunity={openOpportunityForm}
            editingOpportunityId={editingSession?.id ?? null}
            isOpportunityFormVisible={isOpportunityFormVisible}
            onEditOpportunity={openOpportunityEditForm}
            onOpportunityStatusChange={applyStatusChange}
            onRequestDelete={requestDeleteOpportunity}
            onRequestApplicationRegistration={requestApplicationRegistration}
            headingRef={opportunitiesHeadingRef}
          />
        </div>
        <div
          className="workspace-panel"
          role="tabpanel"
          id={getWorkspacePanelId(WORKSPACE_TABS.APPLICATIONS)}
          aria-labelledby={getWorkspaceTabId(WORKSPACE_TABS.APPLICATIONS)}
          hidden={activeWorkspaceTab !== WORKSPACE_TABS.APPLICATIONS}
        >
          <ApplicationList
            applications={applications}
            opportunities={opportunities}
            editingApplicationId={applicationEditSession?.id ?? null}
            editWarning={applicationEditWarning}
            onStatusChange={requestApplicationStatusChange}
            onEdit={openApplicationEdit}
            onCancelEdit={cancelApplicationEdit}
            onSubmitEdit={submitApplicationEdit}
            onRequestDelete={requestApplicationDeletion}
            headingRef={applicationsHeadingRef}
          />
          <FollowUpPanel
            followUps={pendingFollowUps}
            onComplete={completeApplicationFollowUp}
            editingApplicationId={applicationEditSession?.id ?? null}
            headingRef={followUpsHeadingRef}
          />
        </div>
        <div
          className="workspace-panel"
          role="tabpanel"
          id={getWorkspacePanelId(WORKSPACE_TABS.SOURCES)}
          aria-labelledby={getWorkspaceTabId(WORKSPACE_TABS.SOURCES)}
          hidden={activeWorkspaceTab !== WORKSPACE_TABS.SOURCES}
        >
          <SourcesPanel
            sources={sources}
            opportunities={opportunities}
            editingSourceId={sourceEditSession?.id ?? null}
            editWarning={sourceEditWarning}
            onCreate={addSource}
            onEdit={openSourceEdit}
            onCancelEdit={cancelSourceEdit}
            onSubmitEdit={submitSourceEdit}
            onRequestDelete={requestSourceDeletion}
            onAddOpportunity={openOpportunityFormFromSource}
            headingRef={sourcesHeadingRef}
          />
        </div>
        <div
          className="workspace-panel"
          role="tabpanel"
          id={getWorkspacePanelId(WORKSPACE_TABS.PROFILE)}
          aria-labelledby={getWorkspaceTabId(WORKSPACE_TABS.PROFILE)}
          hidden={activeWorkspaceTab !== WORKSPACE_TABS.PROFILE}
        >
          <ProfilePanel
            skills={profile?.skills ?? []}
            onAddSkill={addSkill}
            onRemoveSkill={removeSkill}
          />
        </div>
        <SyncPanel sync={driveSync} />
        <DataPanel
          message={dataPanelMessage}
          onExportBackup={exportBackup}
          onImportFile={importBackupFile}
          onExportOpportunitiesCsv={exportOpportunitiesCsv}
          onExportApplicationsCsv={exportApplicationsCsv}
        />
      </main>
      <ConfirmDialog
        isOpen={pendingDeletion !== null}
        title="Eliminar oportunidad"
        message={
          opportunityToDelete
            ? `¿Eliminar "${opportunityToDelete.title}" en ${opportunityToDelete.company}? Esta acción es permanente y no se puede deshacer.`
            : '¿Eliminar esta oportunidad? Esta acción es permanente y no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        fallbackFocusRef={addOpportunityButtonRef}
      />
      <ConfirmDialog
        isOpen={pendingApplicationDeletion !== null}
        title="Eliminar postulación"
        message={
          opportunityOfApplicationToDelete
            ? `¿Eliminar la postulación a "${opportunityOfApplicationToDelete.title}" en ${opportunityOfApplicationToDelete.company}? Se borran su estado, fechas, seguimiento y notas. La oportunidad se conserva. Esta acción no se puede deshacer.`
            : '¿Eliminar esta postulación? Se borran su estado, fechas, seguimiento y notas. Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmApplicationDeletion}
        onCancel={cancelApplicationDeletion}
        fallbackFocusRef={applicationsHeadingRef}
      />
      <ConfirmDialog
        isOpen={pendingSourceDeletion !== null}
        title="Eliminar fuente"
        message={
          sourceToDelete
            ? `¿Eliminar la fuente "${sourceToDelete.companyName}"? Esta acción no se puede deshacer.`
            : '¿Eliminar esta fuente? Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmSourceDeletion}
        onCancel={cancelSourceDeletion}
        fallbackFocusRef={sourcesHeadingRef}
      />
      <ConfirmDialog
        isOpen={pendingBackupImport !== null}
        title="Importar respaldo"
        message={pendingBackupImport?.preview ?? ''}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        onConfirm={confirmBackupImport}
        onCancel={cancelBackupImport}
        fallbackFocusRef={addOpportunityButtonRef}
      />
      <ConfirmDialog
        isOpen={pendingApplicationRegistration !== null}
        title="Registrar postulación"
        message={
          opportunityToRegister
            ? `¿Confirmás que ya te postulaste a "${opportunityToRegister.title}" en ${opportunityToRegister.company}? Esta acción solo registra la postulación en la aplicación: no envía nada a la empresa.`
            : '¿Confirmás que ya te postulaste a esta oportunidad? Esta acción solo registra la postulación en la aplicación: no envía nada a la empresa.'
        }
        confirmLabel="Sí, ya me postulé"
        cancelLabel="Cancelar"
        onConfirm={confirmApplicationRegistration}
        onCancel={cancelApplicationRegistration}
        fallbackFocusRef={opportunitiesHeadingRef}
      />
      <ConfirmDialog
        isOpen={pendingFinalApplicationStatus !== null}
        title="Finalizar postulación"
        message={
          pendingFinalApplicationStatus
            ? `¿Marcar la postulación${
                finalStatusOpportunity
                  ? ` a "${finalStatusOpportunity.title}" en ${finalStatusOpportunity.company}`
                  : ''
              } como "${getApplicationStatusLabel(pendingFinalApplicationStatus.nextStatus)}"? Es un estado final y no se puede cambiar después.`
            : ''
        }
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={confirmFinalApplicationStatus}
        onCancel={cancelFinalApplicationStatus}
        fallbackFocusRef={applicationsHeadingRef}
      />
    </div>
  )
}

export default App
