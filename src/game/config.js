/**
 * Tuning constants. Art units: one tile is TILE units; everything in the
 * world (positions, sprite boxes) is in art units, the camera maps them to
 * CSS pixels with `zoom`.
 */

export const TILE = 32;
export const ZOOM = 1.5; // CSS px per art unit (48 px tiles)
export const ZOOM_MIN = 1.2;
export const ZOOM_MAX = 2.1;
export const MAP_W = 96;
export const MAP_H = 72;
export const CHUNK = 16; // tiles per baked ground chunk side
export const BAKE_PX = 2; // ground bitmap px per art unit

export const TICK_MIN = 10; // game minutes per clock tick
export const TICK_SECONDS = 7; // real seconds per clock tick
export const DAY_START = 6 * 60;
export const DAY_END = 26 * 60; // 2:00 am, pass out
export const DAYS_PER_SEASON = 28;
export const SEASONS = ["spring", "summer", "fall", "winter"];

export const WALK_SPEED = 4.4 * TILE; // units per second
export const RIDE_MULT = 1.8;
export const SPRINT_MULT = 1.45;
export const BIKE_MULT = 1.65;
export const MAX_ENERGY = 270;
export const CAN_CAPACITY = 40;
export const INV_SIZE = 27;
export const HOTBAR = 9;
export const MAX_STACK = 99;
export const START_GOLD = 500;
