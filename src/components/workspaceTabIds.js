// Presentation-only values: which workspace panel is visible. Not persisted.
export const WORKSPACE_TABS = Object.freeze({
  OPPORTUNITIES: 'opportunities',
  APPLICATIONS: 'applications',
  SOURCES: 'sources',
})

export function getWorkspaceTabId(tab) {
  return `workspace-tab-${tab}`
}

export function getWorkspacePanelId(tab) {
  return `workspace-panel-${tab}`
}
