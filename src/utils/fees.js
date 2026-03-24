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

export function computeConsignmentTotal(item = {}) {
  const inspect = Number(item.inspectFee) || 0
  const repair = Number(item.repairFee) || 0
  const keep = Number(item.keepFee) || 0
  const packing = Number(item.packingFee) || 0
  const other = Number(item.otherFee) || 0
  const feesSum = inspect + repair + keep + packing + other
  const sale = Number(item.salePrice) || 0
  const model = Number(item.commissionModel) || 0
  const set = Number(item.commissionSet) || 0

  if (model === 1) {
    // commission by proportion:
    // total = -(sale - feesSum - (sale - feesSum) * (set / 100))
    const base = sale - feesSum
    const commissionPortion = base * (set / 100)
    return -(base - commissionPortion)
  }

  if (model === 2) {
    // commission fixed: total = 0 - (sale - ((sale - feesSum) - set))
    const inner = (sale - feesSum) - set
    return 0 - (sale - inner)
  }

  // fallback: sum of fees (negated to match formula style?) — keep consistent with existing total as positive
  return -(feesSum)
}

export function computeCommissionFee(item = {}) {
  const inspect = Number(item.inspectFee) || 0
  const repair = Number(item.repairFee) || 0
  const keep = Number(item.keepFee) || 0
  const packing = Number(item.packingFee) || 0
  const other = Number(item.otherFee) || 0
  const feesSum = inspect + repair + keep + packing + other
  const sale = Number(item.salePrice) || 0
  const model = Number(item.commissionModel) || 0
  const set = Number(item.commissionSet) || 0

  if (model === 1) {
    const base = sale - feesSum
    return base * (set / 100)
  }

  if (model === 2) {
    return set
  }

  return 0
}

export default { formatFee, computeTotalFee }
