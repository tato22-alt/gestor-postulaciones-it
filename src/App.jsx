import './App.css'
import ApplicationList from './components/ApplicationList.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import OpportunitySection from './components/OpportunitySection.jsx'
import SourceSection from './components/SourceSection.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import WorkspaceTabs from './components/WorkspaceTabs.jsx'

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <StatsPanel />
        <WorkspaceTabs />
        <OpportunitySection />
        <SourceSection />
        <ApplicationList />
        <FollowUpPanel />
      </main>
    </div>
  )
}

export default App
