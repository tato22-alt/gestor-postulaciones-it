import { useEffect, useRef, useState } from 'react'
import './App.css'
import calculateDashboardMetrics from './application/calculateDashboardMetrics.js'
import changeOpportunityStatus from './application/changeOpportunityStatus.js'
import deleteOpportunity from './application/deleteOpportunity.js'
import filterOpportunities from './application/filterOpportunities.js'
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
import JobOpportunity from './domain/JobOpportunity.js'
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

const CREATE_SUCCESS_MESSAGE = 'Oportunidad creada.'
const EDIT_SUCCESS_MESSAGE = 'Oportunidad editada.'
const STATUS_SUCCESS_MESSAGE = 'Estado actualizado.'
const DELETE_SUCCESS_MESSAGE = 'Oportunidad eliminada.'

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

function App() {
  const [opportunities, setOpportunities] = useState(initialOpportunityLoad.opportunities)
  const [isOpportunityFormVisible, setIsOpportunityFormVisible] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState(
    initialOpportunityLoad.ok ? null : LOAD_WARNING,
  )
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

  useEffect(() => {
    const synchronizeOpportunities = (event) => {
      if (event.key !== OPPORTUNITY_STORAGE_KEY) {
        return
      }

      const loadResult = opportunityRepository.loadAll()

      if (loadResult.ok) {
        setOpportunities([...loadResult.opportunities])
        setPersistenceWarning(null)
      } else {
        setPersistenceWarning(LOAD_WARNING)
      }
    }

    window.addEventListener('storage', synchronizeOpportunities)

    return () => {
      window.removeEventListener('storage', synchronizeOpportunities)
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
    setPendingDeletion({ id: opportunity.id, expectedUpdatedAt: opportunity.updatedAt })
  }

  const cancelDelete = () => {
    setPendingDeletion(null)
  }

  const confirmDelete = () => {
    if (!pendingDeletion) return

    const { id, expectedUpdatedAt } = pendingDeletion
    const result = deleteOpportunity(opportunities, { id, expectedUpdatedAt })

    setPendingDeletion(null)

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
      <Header ref={addOpportunityButtonRef} onAddOpportunity={openOpportunityForm} />

      <main className="app-main">
        <StatsPanel metrics={dashboardMetrics} />
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
        />
        <SourceSection />
        <ApplicationList />
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
    </div>
  )
}

export default App
