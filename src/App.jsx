import './App.css'
import ApplicationForm from './components/ApplicationForm.jsx'
import ApplicationList from './components/ApplicationList.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import Header from './components/Header.jsx'
import StatsPanel from './components/StatsPanel.jsx'

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <StatsPanel />
        <FollowUpPanel />
        <ApplicationForm />
        <ApplicationList />
      </main>
    </div>
  )
}

export default App
