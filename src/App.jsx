import { useEffect, useRef, useState } from 'react'
import './App.css'
import calculateApplicationMetrics from './application/calculateApplicationMetrics.js'
import calculateDashboardMetrics from './application/calculateDashboardMetrics.js'
import changeApplicationStatus from './application/changeApplicationStatus.js'
import changeOpportunityStatus from './application/changeOpportunityStatus.js'
import deleteOpportunity from './application/deleteOpportunity.js'
import filterOpportunities from './application/filterOpportunities.js'
import registerApplication from './application/registerApplication.js'
import updateOpportunity from './application/updateOpportunity.js'
import ApplicationList from './components/ApplicationList.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import CreatedUnderFilterNotice from './components/CreatedUnderFilterNotice.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import OpportunityForm from './components/OpportunityForm.jsx'
import OpportunitySection from './components/OpportunitySection.jsx'
import PersistenceWarning from './components/PersistenceWarning.jsx'
import SourceSection from './components/SourceSection.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import SuccessFeedback from './components/SuccessFeedback.jsx'
import WorkspaceTabs from './components/WorkspaceTabs.jsx'
import { APPLICATION_STATUSES } from './constants/domainOptions.js'
import { findApplicationForOpportunity } from './domain/applicationRegistrationPolicy.js'
import { isFinalApplicationStatus } from './domain/applicationStatusPolicy.js'
import JobOpportunity from './domain/JobOpportunity.js'
import LocalStorageApplicationRepository, {
  APPLICATION_STORAGE_KEY,
} from './infrastructure/LocalStorageApplicationRepository.js'
import LocalStorageOpportunityRepository, {
  OPPORTUNITY_STORAGE_KEY,
} from './infrastructure/LocalStorageOpportunityRepository.js'

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

const DELETE_HAS_APPLICATION_WARNING =
  'Esta oportunidad tiene una postulación registrada, por eso no se eliminó.'

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

const UNEXPECTED_APPLICATION_WARNING =
  'No pudimos completar la acción sobre la postulación. Intentá nuevamente.'

const CREATE_SUCCESS_MESSAGE = 'Oportunidad creada.'
const EDIT_SUCCESS_MESSAGE = 'Oportunidad editada.'
const STATUS_SUCCESS_MESSAGE = 'Estado actualizado.'
const DELETE_SUCCESS_MESSAGE = 'Oportunidad eliminada.'
const APPLICATION_SUCCESS_MESSAGE = 'Postulación registrada.'
const APPLICATION_STATUS_SUCCESS_MESSAGE = 'Estado de la postulación actualizado.'

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

function App() {
  const [opportunities, setOpportunities] = useState(initialOpportunityLoad.opportunities)
  const [isOpportunityFormVisible, setIsOpportunityFormVisible] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState(
    initialOpportunityLoad.ok ? null : LOAD_WARNING,
  )
  const [applications, setApplications] = useState(initialApplicationLoad.applications)
  const [applicationWarning, setApplicationWarning] = useState(
    initialApplicationLoad.ok ? null : APPLICATION_LOAD_WARNING,
  )
  const [pendingApplicationRegistration, setPendingApplicationRegistration] = useState(null)
  const [pendingFinalApplicationStatus, setPendingFinalApplicationStatus] = useState(null)
  const [opportunitySearchQuery, setOpportunitySearchQuery] = useState('')
  const [opportunityStatusFilter, setOpportunityStatusFilter] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [editWarning, setEditWarning] = useState(null)
  const [pendingDeletion, setPendingDeletion] = useState(null)
  const [successFeedback, setSuccessFeedback] = useState(null)
  const [isCreatedUnderFilterNoticeVisible, setIsCreatedUnderFilterNoticeVisible] =
    useState(false)
  const addOpportunityButtonRef = useRef(null)
  const formTriggerRef = useRef(null)
  const applicationsHeadingRef = useRef(null)
  const successFeedbackIdRef = useRef(0)
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

      if (event.key === APPLICATION_STORAGE_KEY) {
        const loadResult = applicationRepository.loadAll()

        if (loadResult.ok) {
          setApplications([...loadResult.applications])
          setApplicationWarning(null)
        } else {
          setApplicationWarning(APPLICATION_LOAD_WARNING)
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

    if (document.contains(trigger)) {
      trigger.focus()
    } else {
      addOpportunityButtonRef.current?.focus()
    }

    formTriggerRef.current = null
  }, [isOpportunityFormVisible])

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
    formTriggerRef.current = document.activeElement
    setEditingSession(null)
    setEditWarning(null)
    setIsOpportunityFormVisible(true)
  }

  const closeOpportunityForm = () => {
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
      setPersistenceWarning((current) => current ?? STATUS_SAVE_WARNING)
    }
  }

  const opportunityToDelete = pendingDeletion
    ? (opportunities.find((opp) => opp.id === pendingDeletion.id) ?? null)
    : null

  const requestDeleteOpportunity = (opportunity) => {
    if (findApplicationForOpportunity(applications, opportunity.id)) {
      setPersistenceWarning(DELETE_HAS_APPLICATION_WARNING)
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

    // Another tab may have registered an application while the dialog was open.
    if (findApplicationForOpportunity(applications, id)) {
      setPersistenceWarning(DELETE_HAS_APPLICATION_WARNING)
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
    showSuccessFeedback(DELETE_SUCCESS_MESSAGE)

    const saveResult = opportunityRepository.saveAll(result.opportunities)

    if (saveResult.ok) {
      setPersistenceWarning(null)
    } else {
      setPersistenceWarning((current) => current ?? DELETE_SAVE_WARNING)
    }
  }

  const opportunityToRegister = pendingApplicationRegistration
    ? (opportunities.find((opp) => opp.id === pendingApplicationRegistration.opportunityId) ?? null)
    : null

  const requestApplicationRegistration = (opportunity) => {
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
      setApplicationWarning((current) => current ?? APPLICATION_SAVE_WARNING)
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
      setApplicationWarning((current) => current ?? APPLICATION_STATUS_SAVE_WARNING)
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
    const opportunity = new JobOpportunity({
      ...opportunityData,
      sourceId: null,
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
      setPersistenceWarning((currentWarning) => currentWarning ?? SAVE_WARNING)
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
        (currentWarning) => currentWarning ?? EDIT_SAVE_WARNING,
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
        <StatsPanel metrics={dashboardMetrics} applicationMetrics={applicationMetrics} />
        <WorkspaceTabs />
        <SuccessFeedback
          key={successFeedback?.id ?? 'none'}
          message={successFeedback?.message ?? null}
          durationMs={SUCCESS_FEEDBACK_DURATION_MS}
        />
        <CreatedUnderFilterNotice
          isVisible={isCreatedUnderFilterNoticeVisible}
          onResetFilters={resetOpportunityFilters}
        />
        <PersistenceWarning message={persistenceWarning} />
        <PersistenceWarning message={applicationWarning} />
        {isOpportunityFormVisible && (
          <OpportunityForm
            key={
              editingSession
                ? `edit-${editingSession.id}-${editingSession.expectedUpdatedAt}`
                : 'create'
            }
            mode={editingSession ? 'edit' : 'create'}
            initialValues={editingSession?.initialValues}
            submissionWarning={editWarning}
            onSubmit={editingSession ? editOpportunity : createOpportunity}
            onCancel={closeOpportunityForm}
          />
        )}
        <OpportunitySection
          opportunities={opportunities}
          visibleOpportunities={visibleOpportunities}
          applications={applications}
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
        />
        <SourceSection />
        <ApplicationList
          applications={applications}
          opportunities={opportunities}
          onStatusChange={requestApplicationStatusChange}
          headingRef={applicationsHeadingRef}
        />
        <FollowUpPanel />
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
        fallbackFocusRef={applicationsHeadingRef}
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
