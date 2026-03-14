const ENTRY_FEE = 20

export default function PotSummary({ totalBrackets = 0 }) {
  const potSize = totalBrackets * ENTRY_FEE
  const first = Math.round(potSize * 0.6)
  const second = Math.round(potSize * 0.25)
  const third = Math.round(potSize * 0.15)

  return (
    <div className="card bg-gradient-to-br from-mocha to-[#5a3f38] text-cream">
      <h3 className="font-headline font-bold text-xl mb-4">The Pot</h3>
      <div className="flex items-end gap-2 mb-6">
        <span className="font-headline font-bold text-4xl text-orange">${potSize}</span>
        <span className="text-cream/60 mb-1 text-sm">total</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-cream/70">Entries</span>
          <span className="font-semibold">{totalBrackets}</span>
        </div>
        <div className="border-t border-white/10 pt-2 mt-2 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gold font-semibold">1st Place</span>
            <span className="font-bold">${first}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300 font-semibold">2nd Place</span>
            <span className="font-bold">${second}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-caramel font-semibold">3rd Place</span>
            <span className="font-bold">${third}</span>
          </div>
        </div>
        <p className="text-cream/40 text-xs pt-1">Payouts based on total entries. 60/25/15% split.</p>
      </div>
    </div>
  )
}
