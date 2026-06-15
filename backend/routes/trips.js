const express = require("express");
const router = express.Router();
const db = require("../database");

// ── Helper: normalize time range ──
const toDayMinutes = (t) => {
  if (!t || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const normalizedRange = (start, end) => {
  const s = toDayMinutes(start);
  const eRaw = toDayMinutes(end);
  const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
  return { s, e };
};

// ── Emission Factors ──
const ACTIVITY_EMISSION_FACTORS = {
  "Meal": 1.500, "Resting": 0.050, "Walking": 0.008,
  "Jogging": 0.025, "Hiking": 0.030, "Bicycle Ride": 0.010,
  "Swimming / Snorkeling": 0.050, "Surfing": 0.050, "Boat Ride": 0.240,
  "Beach Leisure": 0.050, "Wildlife Safari": 0.800,
  "Cultural / Temple Visit": 0.100, "Sightseeing": 0.100,
  "Shopping": 0.300, "Spa / Ayurveda": 0.400,
  "Public Transport": 0.080, "Private / Hired Vehicle": 0.550,
  "Airport Transfer": 0.550, "Medical / Hospital Visit": 0.500, "Other": 0.100
};

const HOTEL_EMISSION_FACTORS = { "3-star": 20, "4-star": 35, "5-star": 60 };

// ── GET /api/emission-factors ──
router.get("/emission-factors", (req, res) => {
  res.json({
    activity: ACTIVITY_EMISSION_FACTORS,
    hotel: HOTEL_EMISSION_FACTORS
  });
});

// ── POST /api/trips ── Save + Calculate
router.post("/", (req, res) => {
  try {
    const { base, destinations, legPlans, dayPlans } = req.body;

    // Activity emissions
    let activityEmission = 0;
    const activityRows = [];

    dayPlans.forEach((day) => {
      const totalActivityMinutes = day.timeline.reduce((sum, row) => {
        const { s, e } = normalizedRange(row.start, row.end);
        return sum + Math.max(0, e - s);
      }, 0);
      const hotelMinutes = Math.max(0, 1440 - totalActivityMinutes);
      const hotelHours = Math.round((hotelMinutes / 60) * 10) / 10;
      const hotelFactor = HOTEL_EMISSION_FACTORS[day.hotelStar] ?? 20;
      const dayHotelEmission = hotelFactor * (hotelHours / 24) * base.groupSize;

      day.timeline.forEach((entry) => {
        const { s, e } = normalizedRange(entry.start, entry.end);
        const hours = (e - s) / 60;
        const factor = ACTIVITY_EMISSION_FACTORS[entry.type] ?? 0.1;
        const emission = hours * factor * base.groupSize;
        activityEmission += emission;
        activityRows.push({
          day,
          entry,
          hours,
          emission,
          hotelHours,
          dayHotelEmission
        });
      });
    });

    // Hotel emissions
    let hotelEmission = 0;
    const dayRows = dayPlans.map((day) => {
      const totalActivityMinutes = day.timeline.reduce((sum, row) => {
        const { s, e } = normalizedRange(row.start, row.end);
        return sum + Math.max(0, e - s);
      }, 0);
      const hotelMinutes = Math.max(0, 1440 - totalActivityMinutes);
      const hotelHours = Math.round((hotelMinutes / 60) * 10) / 10;
      const hotelFactor = HOTEL_EMISSION_FACTORS[day.hotelStar] ?? 20;
      const dayHotelEmission = hotelFactor * (hotelHours / 24) * base.groupSize;
      hotelEmission += dayHotelEmission;
      return { ...day, hotelHours, dayHotelEmission };
    });

    const totalEmission = activityEmission + hotelEmission;
    const perPersonEmission = totalEmission / base.groupSize;

    // ── Insert trip ──
    const insertTrip = db.prepare(`
      INSERT INTO trips (
        tourist_name, tourist_email, age, country, travel_mode, group_size,
        total_days, arrival_airport, arrival_datetime, departure_airport,
        departure_datetime, is_rental, rental_vehicle_type, rental_power_source,
        with_driver, trip_notes, activity_emission, hotel_emission,
        total_emission, per_person_emission
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tripResult = insertTrip.run(
      base.touristName, base.touristEmail, base.age, base.country,
      base.travelMode, base.groupSize, base.totalDays,
      base.arrivalAirport, base.arrivalDateTime,
      base.departureAirport, base.departureDateTime,
      base.isRental ? 1 : 0, base.rentalVehicleType,
      base.rentalPowerSource, base.withDriver ? 1 : 0,
      base.tripNotes || "",
      activityEmission, hotelEmission, totalEmission, perPersonEmission
    );

    const tripId = tripResult.lastInsertRowid;

    // ── Insert destinations ──
    const insertDest = db.prepare(`
      INSERT INTO trip_destinations (trip_id, location, days, hotel_star, hotel_name, same_hotel_for_all_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    destinations.forEach((d) => {
      insertDest.run(tripId, d.location, d.days, d.hotelStar, d.hotelName, d.sameHotelForAllDays ? 1 : 0);
    });

    // ── Insert legs ──
    const insertLeg = db.prepare(`
      INSERT INTO trip_legs (trip_id, leg_order, from_location, to_location, timing, transport_mode, fuel_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    legPlans.forEach((leg, idx) => {
      insertLeg.run(tripId, idx + 1, leg.from, leg.to, leg.when, leg.transportMode, leg.fuelType || "");
    });

    // ── Insert days + activities ──
    const insertDay = db.prepare(`
      INSERT INTO trip_days (trip_id, day_number, location, hotel_name, hotel_star, hotel_arrival_time, is_checked_in, notes, hotel_hours, hotel_emission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertActivity = db.prepare(`
      INSERT INTO trip_activities (trip_day_id, trip_id, start_time, end_time, duration_hours, label, activity_type, emission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    dayRows.forEach((day) => {
      const dayResult = insertDay.run(
        tripId, day.day, day.location, day.hotelName, day.hotelStar,
        day.hotelArrivalTime || "", day.isCheckedIn ? 1 : 0,
        day.activities?.notes || "", day.hotelHours, day.dayHotelEmission
      );
      const dayDbId = dayResult.lastInsertRowid;

      day.timeline.forEach((entry) => {
        const { s, e } = normalizedRange(entry.start, entry.end);
        const hours = (e - s) / 60;
        const factor = ACTIVITY_EMISSION_FACTORS[entry.type] ?? 0.1;
        const emission = hours * factor * base.groupSize;
        insertActivity.run(dayDbId, tripId, entry.start, entry.end, hours, entry.label, entry.type, emission);
      });
    });

    res.status(201).json({
      success: true,
      tripId,
      summary: {
        activityEmission: Math.round(activityEmission * 100) / 100,
        hotelEmission: Math.round(hotelEmission * 100) / 100,
        totalEmission: Math.round(totalEmission * 100) / 100,
        perPersonEmission: Math.round(perPersonEmission * 100) / 100
      }
    });

  } catch (err) {
    console.error("POST /api/trips error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/trips ── All trips
router.get("/", (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT id, tourist_name, tourist_email, country, travel_mode, group_size,
             total_days, total_emission, per_person_emission, created_at
      FROM trips
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, trips });
  } catch (err) {
    console.error("GET /api/trips error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/trips/:id ── Single trip
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(id);
    if (!trip) return res.status(404).json({ success: false, error: "Trip not found." });

    const destinations = db.prepare("SELECT * FROM trip_destinations WHERE trip_id = ?").all(id);
    const legs = db.prepare("SELECT * FROM trip_legs WHERE trip_id = ? ORDER BY leg_order").all(id);
    const days = db.prepare("SELECT * FROM trip_days WHERE trip_id = ? ORDER BY day_number").all(id);

    const daysWithActivities = days.map((day) => {
      const activities = db.prepare("SELECT * FROM trip_activities WHERE trip_day_id = ?").all(day.id);
      return { ...day, activities };
    });

    res.json({ success: true, trip, destinations, legs, days: daysWithActivities });
  } catch (err) {
    console.error("GET /api/trips/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/trips/:id ── Delete trip
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM trips WHERE id = ?").run(id);
    res.json({ success: true, message: "Trip deleted." });
  } catch (err) {
    console.error("DELETE /api/trips/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;