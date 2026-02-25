export function formatFee(v) {
  const n = Number(v) || 0
  return n.toFixed(2)
}

export function computeTotalFee(item = {}) {
  const a = Number(item.inspectFee) || 0
  const b = Number(item.repairFee) || 0
  const c = Number(item.keepFee) || 0
  const d = Number(item.packingFee) || 0
  const e = Number(item.otherFee) || 0
  return a + b + c + d + e
}

export default { formatFee, computeTotalFee }
