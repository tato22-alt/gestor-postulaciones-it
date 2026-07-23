import { useState } from 'react'
import './App.css'
import ApplicationList from './components/ApplicationList.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import OpportunityForm from './components/OpportunityForm.jsx'
import OpportunitySection from './components/OpportunitySection.jsx'
import SourceSection from './components/SourceSection.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import WorkspaceTabs from './components/WorkspaceTabs.jsx'
import JobOpportunity from './domain/JobOpportunity.js'

function App() {
  const [opportunities, setOpportunities] = useState([])
  const [isOpportunityFormVisible, setIsOpportunityFormVisible] = useState(false)

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

    setOpportunities((currentOpportunities) => [...currentOpportunities, opportunity])
    closeOpportunityForm()
  }

  return (
    <div className="app-shell">
      <Header onAddOpportunity={openOpportunityForm} />

      <main className="app-main">
        <StatsPanel detectedOpportunityCount={opportunities.length} />
        <WorkspaceTabs />
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
