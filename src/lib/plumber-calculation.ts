import { FIXTURE_MAP } from './plumber-fixtures'

export type QDMethod = 'm1' | 'm2'

export type PlumberCalculationInput = {
  counts: Record<string, number | undefined>
  method: QDMethod
  includeHydrantExtra?: boolean
}

export type PlumberCalculationResult = {
  totalLU: number
  totalLps: number
  totalM3PerHour: number
  dn: string | null
}

const HYDRANT_ID = 'hydrant'

const Q3_BY_DN: { dn: string; q3: number }[] = [
  { dn: 'DN15', q3: 2.5 },
  { dn: 'DN20', q3: 4.0 },
  { dn: 'DN25', q3: 6.3 },
  { dn: 'DN32', q3: 10.0 },
  { dn: 'DN40', q3: 16.0 },
  { dn: 'DN50', q3: 25.0 },
]

const EXTRA_HYDRANT_LPS = 0.27
const LU_TO_LPS_FACTOR = 0.1
const LPS_TO_M3_PER_HOUR = 3.6

function calculateTotalLU(counts: Record<string, number | undefined>): number {
  return Object.entries(counts).reduce((sum, [id, count]) => {
    if (!count) return sum
    const fixture = FIXTURE_MAP[id]
    if (!fixture) return sum
    return sum + (fixture.luWarm * count) + (fixture.luKalt * count)
  }, 0)
}

function calculateQDBase(method: QDMethod, qt: number): number {
  if (qt <= 0) return 0
  if (method === 'm1') {
    return Math.pow(qt, 0.353) * 0.459
  }
  return Math.pow(qt, 0.257) * 0.598
}

function ceilTo(value: number, step: number): number {
  if (step <= 0) return value
  return Math.ceil(value / step) * step
}

function determineDN(totalM3PerHour: number): string | null {
  for (const { dn, q3 } of Q3_BY_DN) {
    if (totalM3PerHour <= q3) {
      return dn
    }
  }
  return null
}

export function calculatePlumberValues({
  counts = {},
  method,
  includeHydrantExtra,
}: PlumberCalculationInput): PlumberCalculationResult {
  const totalLU = calculateTotalLU(counts)
  const qt = totalLU * LU_TO_LPS_FACTOR
  const qdBase = calculateQDBase(method, qt)

  const includeHydrant =
    typeof includeHydrantExtra === 'boolean'
      ? includeHydrantExtra
      : (counts[HYDRANT_ID] || 0) > 0

  const extra = includeHydrant ? EXTRA_HYDRANT_LPS : 0
  const qdTotal = qdBase + extra
  const qdRounded = ceilTo(qdTotal, 0.1)
  const totalM3PerHour = qdRounded * LPS_TO_M3_PER_HOUR
  const dn = determineDN(totalM3PerHour)

  return {
    totalLU,
    totalLps: qdRounded,
    totalM3PerHour,
    dn,
  }
}

