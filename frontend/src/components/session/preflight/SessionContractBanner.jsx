export default function SessionContractBanner({ contract }) {
  if (!contract) return null
  return (
    <div className="px-4 py-3 bg-blue-900/50 border-b border-blue-700/50 flex items-center gap-3">
      <span className="text-blue-300 text-sm">📋</span>
      <p className="text-sm text-blue-200 flex-1">
        <span className="font-semibold text-blue-100">Session Contract: </span>
        {contract}
      </p>
    </div>
  )
}
