import { useRef } from 'react'
import { WORKSPACE_TABS, getWorkspacePanelId, getWorkspaceTabId } from './workspaceTabIds.js'

const TAB_ORDER = [WORKSPACE_TABS.OPPORTUNITIES, WORKSPACE_TABS.APPLICATIONS, WORKSPACE_TABS.SOURCES]

function WorkspaceTabs({ activeTab, applicationCount, sourceCount, onChange }) {
  const tabRefs = useRef({})
  const labels = {
    [WORKSPACE_TABS.OPPORTUNITIES]: 'Oportunidades',
    [WORKSPACE_TABS.APPLICATIONS]: `Postulaciones (${applicationCount})`,
    [WORKSPACE_TABS.SOURCES]: `Fuentes (${sourceCount})`,
  }

  // Arrow keys, Home, and End move between tabs, following the WAI-ARIA tabs pattern.
  const handleKeyDown = (event) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    const nextIndexByKey = {
      ArrowRight: (currentIndex + 1) % TAB_ORDER.length,
      ArrowLeft: (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length,
      Home: 0,
      End: TAB_ORDER.length - 1,
    }

    if (!Object.hasOwn(nextIndexByKey, event.key)) return

    event.preventDefault()
    const nextTab = TAB_ORDER[nextIndexByKey[event.key]]

    onChange(nextTab)
    tabRefs.current[nextTab]?.focus()
  }

  return (
    <div
      className="workspace-tabs"
      role="tablist"
      aria-label="Secciones principales"
      onKeyDown={handleKeyDown}
    >
      {TAB_ORDER.map((tab) => {
        const isActive = tab === activeTab

        return (
          <button
            key={tab}
            ref={(element) => {
              tabRefs.current[tab] = element
            }}
            id={getWorkspaceTabId(tab)}
            className={`workspace-tab${isActive ? ' workspace-tab-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={getWorkspacePanelId(tab)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab)}
          >
            {labels[tab]}
          </button>
        )
      })}
    </div>
  )
}

export default WorkspaceTabs
