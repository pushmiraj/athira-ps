export default function DualPane({ left, right }) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left pane: 60% — video + whiteboard */}
      <div className="flex flex-col" style={{ width: '60%', borderRight: '1px solid var(--color-session-border)' }}>
        {left}
      </div>
      {/* Right pane: 40% — sidecar or tutor panel */}
      <div className="flex flex-col overflow-hidden" style={{ width: '40%' }}>
        {right}
      </div>
    </div>
  )
}
