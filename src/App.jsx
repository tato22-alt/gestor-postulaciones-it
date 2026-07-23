import { useEffect, useState } from 'react'
import './App.css'
import calculateDashboardMetrics from './application/calculateDashboardMetrics.js'
import filterOpportunities from './application/filterOpportunities.js'
import updateOpportunity from './application/updateOpportunity.js'
import ApplicationList from './components/ApplicationList.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import OpportunityForm from './components/OpportunityForm.jsx'
import OpportunitySection from './components/OpportunitySection.jsx'
import PersistenceWarning from './components/PersistenceWarning.jsx'
import SourceSection from './components/SourceSection.jsx'
import StatsPanel from './components/StatsPanel.jsx'
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

  const openOpportunityForm = () => {
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
    setEditingSession({
      id: opportunity.id,
      expectedUpdatedAt: opportunity.updatedAt,
      initialValues: opportunity,
    })
    setEditWarning(null)
    setIsOpportunityFormVisible(true)
  }

  const clearOpportunitySearch = () => {
    setOpportunitySearchQuery('')
  }

  const resetOpportunityFilters = () => {
    setOpportunitySearchQuery('')
    setOpportunityStatusFilter(null)
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
      <Header onAddOpportunity={openOpportunityForm} />

      <main className="app-main">
        <StatsPanel metrics={dashboardMetrics} />
        <WorkspaceTabs />
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
        />
        <SourceSection />
        <ApplicationList />
        <FollowUpPanel />
      </main>
    </div>
  )
}

export default App
