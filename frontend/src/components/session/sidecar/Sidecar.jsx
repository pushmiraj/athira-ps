import { useState } from 'react'
import { Camera, HelpCircle, StickyNote } from 'lucide-react'
import useSidecarStore from '../../../store/sidecarStore'
import SnapshotButton from './SnapshotButton'
import SnapshotCard from './SnapshotCard'
import ParkButton from './ParkButton'
import ParkingLot from './ParkingLot'
import ReflectionEditor from './ReflectionEditor'

const TABS = [
  { name: 'Snapshots', icon: Camera },
  { name: 'Parking Lot', icon: HelpCircle },
  { name: 'Notes', icon: StickyNote },
]

export default function Sidecar({ send, getWhiteboardPng }) {
  const [activeTab, setActiveTab] = useState('Snapshots')
  const { snapshots, parkedQuestions } = useSidecarStore()

  return (
    <div className="flex h-full bg-white rounded-r-2xl overflow-hidden shadow-none">
      {/* Left Icon Rail */}
      <div className="w-[68px] flex flex-col items-center py-4 bg-slate-50 border-r border-slate-200 gap-6 shrink-0 z-10">
        {TABS.map(tab => {
          const badge = tab.name === 'Snapshots' ? snapshots.length : tab.name === 'Parking Lot' ? parkedQuestions.length : 0
          const isActive = activeTab === tab.name
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              title={tab.name}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header Actions */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-100 shrink-0">
          <div className="flex-1">
            <SnapshotButton send={send} getWhiteboardPng={getWhiteboardPng} />
          </div>
          <div className="flex-1">
            <ParkButton send={send} />
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'Snapshots' && (
            <div className="space-y-4">
              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Camera size={28} className="text-slate-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-slate-700 font-medium text-sm">No snapshots yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[180px]">Capture important whiteboard moments.</p>
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
    </div>
  )
}
