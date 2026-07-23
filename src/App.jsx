import { useEffect, useState } from 'react'
import './App.css'
import calculateDashboardMetrics from './application/calculateDashboardMetrics.js'
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
    setIsOpportunityFormVisible(true)
  }

  const closeOpportunityForm = () => {
    setIsOpportunityFormVisible(false)
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
  }

  return (
    <div className="app-shell">
      <Header onAddOpportunity={openOpportunityForm} />

      <main className="app-main">
        <StatsPanel metrics={dashboardMetrics} />
        <WorkspaceTabs />
        <PersistenceWarning message={persistenceWarning} />
        {isOpportunityFormVisible && (
          <OpportunityForm onSubmit={createOpportunity} onCancel={closeOpportunityForm} />
        )}
        <OpportunitySection opportunities={opportunities} onAddOpportunity={openOpportunityForm} />
        <SourceSection />
        <ApplicationList />
        <FollowUpPanel />
      </main>
    </div>
  )
}

export default App
