const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "carbon.db"));

// ── Create Tables ──
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tourist_name TEXT NOT NULL,
    tourist_email TEXT NOT NULL,
    age INTEGER,
    country TEXT,
    travel_mode TEXT,
    group_size INTEGER,
    total_days INTEGER,
    arrival_airport TEXT,
    arrival_datetime TEXT,
    departure_airport TEXT,
    departure_datetime TEXT,
    is_rental INTEGER DEFAULT 0,
    rental_vehicle_type TEXT,
    rental_power_source TEXT,
    with_driver INTEGER DEFAULT 0,
    trip_notes TEXT,
    activity_emission REAL DEFAULT 0,
    hotel_emission REAL DEFAULT 0,
    total_emission REAL DEFAULT 0,
    per_person_emission REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trip_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    days INTEGER NOT NULL,
    hotel_star TEXT,
    hotel_name TEXT,
    same_hotel_for_all_days INTEGER DEFAULT 1,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trip_legs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    leg_order INTEGER,
    from_location TEXT,
    to_location TEXT,
    timing TEXT,
    transport_mode TEXT,
    fuel_type TEXT,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trip_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    day_number INTEGER,
    location TEXT,
    hotel_name TEXT,
    hotel_star TEXT,
    hotel_arrival_time TEXT,
    is_checked_in INTEGER DEFAULT 0,
    notes TEXT,
    hotel_hours REAL DEFAULT 0,
    hotel_emission REAL DEFAULT 0,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trip_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_day_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration_hours REAL,
    label TEXT,
    activity_type TEXT,
    emission REAL DEFAULT 0,
    FOREIGN KEY (trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE
  );
`);

console.log("Database initialized — carbon.db");

module.exports = db;