export type FixtureItem = {
  id: string
  name: string
  luKalt: number
  luWarm: number
}

export const SANITAER_ITEMS: FixtureItem[] = [
  { id: 'wc', name: 'WC-Spülkasten', luKalt: 1, luWarm: 0 },
  { id: 'waschtisch', name: 'Waschtisch', luKalt: 1, luWarm: 1 },
  { id: 'dusche', name: 'Dusche', luKalt: 2, luWarm: 2 },
  { id: 'badewanne', name: 'Badewanne', luKalt: 3, luWarm: 3 },
  { id: 'bidet', name: 'Bidet', luKalt: 1, luWarm: 1 },
  { id: 'urinoir', name: 'Urinoir Spülung automatisch', luKalt: 3, luWarm: 0 },
]

export const AUSSEN_ITEMS: FixtureItem[] = [
  { id: 'balkon', name: 'Entnahmearmatur für Balkon', luKalt: 2, luWarm: 0 },
  { id: 'garten', name: 'Entnahmearmatur Garten und Garage', luKalt: 5, luWarm: 0 },
  { id: 'waschrinne', name: 'Waschrinne', luKalt: 1, luWarm: 1 },
  { id: 'waschtrog', name: 'Waschtrog', luKalt: 2, luWarm: 2 },
]

export const GEWERBE_ITEMS: FixtureItem[] = [
  { id: 'automat', name: 'Getränkeautomat', luKalt: 1, luWarm: 0 },
  { id: 'coiffeur', name: 'Coiffeurbrause', luKalt: 1, luWarm: 1 },
]

export const SICHERHEIT_ITEMS: FixtureItem[] = [
  { id: 'hydrant', name: 'Wasserlöschposten', luKalt: 0, luWarm: 0 },
]

export const ALL_FIXTURES: FixtureItem[] = [
  ...SANITAER_ITEMS,
  ...AUSSEN_ITEMS,
  ...GEWERBE_ITEMS,
  ...SICHERHEIT_ITEMS,
]

export const FIXTURE_MAP: Record<string, FixtureItem> = ALL_FIXTURES.reduce(
  (acc, fixture) => {
    acc[fixture.id] = fixture
    return acc
  },
  {} as Record<string, FixtureItem>
)

