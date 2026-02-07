/**
 * Default room/location options for class scheduling
 * These are used as fallback when no rooms are found in the database
 */
export const DEFAULT_ROOMS = [
  'Studio A',
  'Studio B',
  'Studio C',
  'Outdoor Space',
  'Private Room',
  'Main Hall',
] as const;

export type RoomType = typeof DEFAULT_ROOMS[number];
