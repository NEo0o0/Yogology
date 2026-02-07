// Class level constants matching studio schedule
export const LEVELS = {
  BASIC: 'Basic Level',
  INTERMEDIATE: 'Intermediate Level',
  ADVANCED: 'Advanced Level',
  MULTILEVEL: 'Multilevel',
} as const;

export type Level = typeof LEVELS[keyof typeof LEVELS];

// Legacy mapping for database compatibility
export const LEGACY_LEVEL_MAP: Record<string, Level> = {
  'Beginner': LEVELS.BASIC,
  'Intermediate': LEVELS.INTERMEDIATE,
  'Advanced': LEVELS.ADVANCED,
  'All Levels': LEVELS.MULTILEVEL,
};

// Reverse mapping for database writes (if needed)
export const LEVEL_TO_DB_MAP: Record<Level, string> = {
  [LEVELS.BASIC]: 'Beginner',
  [LEVELS.INTERMEDIATE]: 'Intermediate',
  [LEVELS.ADVANCED]: 'Advanced',
  [LEVELS.MULTILEVEL]: 'All Levels',
};

// Helper function to get display level from database value
export function getDisplayLevel(dbLevel: string | null | undefined): Level {
  if (!dbLevel) return LEVELS.MULTILEVEL;
  return LEGACY_LEVEL_MAP[dbLevel] || (dbLevel as Level);
}

// Helper function to get database value from display level
export function getDbLevel(displayLevel: Level): string {
  return LEVEL_TO_DB_MAP[displayLevel] || displayLevel;
}
