import { useState } from 'react'
import useSidecarStore from '../../../store/sidecarStore'
import SnapshotButton from './SnapshotButton'
import SnapshotCard from './SnapshotCard'
import ParkButton from './ParkButton'
import ParkingLot from './ParkingLot'
import ReflectionEditor from './ReflectionEditor'

const TABS = ['Snapshots', 'Parking Lot', 'Notes']

export default function Sidecar({ send, getWhiteboardPng }) {
  const [activeTab, setActiveTab] = useState('Snapshots')
  const { snapshots, parkedQuestions } = useSidecarStore()

  return (
    <div className="flex flex-col h-full slide-in-right" style={{ background: 'var(--color-session-panel)' }}>
      {/* Header actions */}
      <div className="p-3 border-b border-slate-700 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Your Workspace</p>
        <SnapshotButton send={send} getWhiteboardPng={getWhiteboardPng} />
        <ParkButton send={send} />
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-slate-700">
        {TABS.map(tab => {
          const badge = tab === 'Snapshots' ? snapshots.length : tab === 'Parking Lot' ? parkedQuestions.length : 0
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {badge > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center leading-none">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'Snapshots' && (
          <div className="space-y-3">
            {snapshots.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl">📸</span>
                <p className="text-sm text-slate-500 mt-2">No snapshots yet.</p>
                <p className="text-xs text-slate-600 mt-1">Click Snapshot to capture a moment.</p>
              </div>
            ) : (
              snapshots.map((s, i) => <SnapshotCard key={s.snapshot_id || i} snapshot={s} index={i} />)
            )}
          </div>
        )}
        {activeTab === 'Parking Lot' && <ParkingLot />}
        {activeTab === 'Notes' && <ReflectionEditor send={send} />}
      </div>
    </div>
  )
}
