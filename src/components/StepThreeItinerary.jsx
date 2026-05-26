import React, { useState } from "react";
import { ACTIVITY_TYPES } from "../data";

function StepThreeItinerary({
  base, legPlans, setLegPlans, dayPlans, setDayPlans,
  availableVehicles, addTimelineEntry, removeTimelineEntry, errors = {}
}) {
  const [collapsedDays, setCollapsedDays] = useState({});
  const [entryErrors, setEntryErrors] = useState({});

  const toggleDay = (i) => setCollapsedDays((prev) => ({ ...prev, [i]: !prev[i] }));

  const timeToMinutes = (value) => {
    if (!value || !value.includes(":")) return 0;
    const [hh, mm] = value.split(":").map(Number);
    return (hh * 60) + mm;
  };

  const errStyle = {
    borderColor: "#c0392b",
    boxShadow: "0 0 0 3px rgba(192,57,43,0.15)",
  };

  const handleAddEntry = (i) => {
    const day = dayPlans[i];
    const errs = {};
    if (!day.hotelArrivalTime) errs.hotelTime = "Please enter hotel arrival time first.";
    if (!day.newEntryLabel?.trim()) errs.label = "Activity description is required.";
    if (!day.newEntryStart) errs.start = "Start time is required.";
    if (!day.newEntryEnd) errs.end = "End time is required.";
    if (day.newEntryStart && day.newEntryEnd) {
      if (day.newEntryStart === day.newEntryEnd) errs.end = "Start and end time cannot be the same.";
      else {
        const s = timeToMinutes(day.newEntryStart);
        const eRaw = timeToMinutes(day.newEntryEnd);
        const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
        if (e <= s) errs.end = "End time must be later than start time.";
      }
    }
    if (Object.keys(errs).length > 0) {
      setEntryErrors((prev) => ({ ...prev, [i]: errs }));
      return;
    }
    setEntryErrors((prev) => ({ ...prev, [i]: {} }));
    addTimelineEntry(i);
  };

  const getBarStyle = (start, end) => {
    const s = timeToMinutes(start);
    const eRaw = timeToMinutes(end);
    const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
    const left = (s / 1440) * 100;
    const width = ((e - s) / 1440) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const typeColors = {
    "Meal": "#f59e0b",
    "Resting": "#94a3b8",
    "Walking": "#10b981",
    "Jogging": "#06b6d4",
    "Hiking": "#16a34a",
    "Bicycle Ride": "#84cc16",
    "Swimming / Snorkeling": "#0ea5e9",
    "Surfing": "#3b82f6",
    "Boat Ride": "#6366f1",
    "Beach Leisure": "#f97316",
    "Wildlife Safari": "#a16207",
    "Cultural / Temple Visit": "#7c3aed",
    "Sightseeing": "#ec4899",
    "Shopping": "#f43f5e",
    "Spa / Ayurveda": "#8b5cf6",
    "Public Transport": "#64748b",
    "Private / Hired Vehicle": "#475569",
    "Airport Transfer": "#0f172a",
    "Medical / Hospital Visit": "#dc2626",
    "Other": "#6b7280",
  };

  return (
    <section className="step active">
      <h2>Travel Legs & Day-by-Day Activities</h2>

      {errors.itinerary && <div className="status warn">⚠ {errors.itinerary}</div>}

      {/* ── Sticky Travel Legs Header ── */}
      <div className="legs-sticky">
        <div className="legs-sticky-header">
          <h3 style={{ margin: 0 }}>Travel Legs</h3>
          <span className="legs-info">{base.isRental ? "Rental mode — transport auto-set for all legs" : "Set transport for each leg"}</span>
        </div>
        <div className="legs-list">
          {legPlans.map((leg, i) => (
            <div className="leg-card" key={`${leg.from}-${leg.to}-${i}`}>
              <div className="leg-route">
                <strong>Leg {i + 1}</strong>
                <span className="leg-arrow">{leg.from} → {leg.to}</span>
              </div>
              <div className="grid two" style={{ marginTop: 10 }}>
                <label>Timing
                  <input
                    value={leg.when}
                    onChange={(e) => setLegPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, when: e.target.value } : x))}
                    readOnly={base.isRental}
                  />
                </label>
                <label>Transport
                  <select
                    value={leg.transportMode}
                    disabled={base.isRental}
                    onChange={(e) => setLegPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, transportMode: e.target.value } : x))}
                  >
                    {base.isRental
                      ? <option>Rental Vehicle</option>
                      : availableVehicles.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.type})</option>)
                    }
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Activity Cards ── */}
      <h3 style={{ marginTop: 24 }}>Day-by-Day Activities</h3>
      {dayPlans.map((day, i) => {
        const hotelTimeError = Array.isArray(errors.hotelArrivalTime) && errors.hotelArrivalTime.includes(i);
        const eErrs = entryErrors[i] || {};
        const isCollapsed = collapsedDays[i];
        const totalScheduled = Math.round(day.timeline.reduce((sum, x) => {
          const s = timeToMinutes(x.start);
          const eRaw = timeToMinutes(x.end);
          const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
          return sum + (e - s);
        }, 0) / 60 * 10) / 10;

        return (
          <div className="day-card" key={`${day.day}-${day.location}`}>
            {/* ── Day Header ── */}
            <div className="day-head" onClick={() => toggleDay(i)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="day-badge">Day {day.day} of {dayPlans.length}</span>
                <strong>{day.location}</strong>
                <span className="muted" style={{ fontSize: "0.8rem" }}>| {day.hotelName}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {day.timeline.length > 0 && (
                  <span className="activity-count">{day.timeline.length} activit{day.timeline.length > 1 ? "ies" : "y"} · {totalScheduled}h</span>
                )}
                {hotelTimeError && <span style={{ color: "#c0392b", fontSize: "0.8rem" }}>⚠ Hotel time missing</span>}
                <span className="collapse-btn">{isCollapsed ? "▼ Expand" : "▲ Collapse"}</span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="day-body">
                {/* Hotel Arrival Time */}
                <div className="grid two" style={{ marginBottom: 14 }}>
                  <label>
                    Hotel Arrival Time <span style={{ color: "#c0392b" }}>*</span>
                    <input
                      type="time"
                      value={day.hotelArrivalTime || ""}
                      style={hotelTimeError ? errStyle : undefined}
                      onChange={(e) =>
                        setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, hotelArrivalTime: e.target.value } : x))
                      }
                    />
                    {hotelTimeError && (
                      <span style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: 2 }}>
                        Hotel arrival time is required.
                      </span>
                    )}
                  </label>
                </div>

                {/* ── Add Activity ── */}
                <div className="card inset">
                  <h3>Add Activity</h3>
                  <div className="grid two" style={{ marginBottom: 10 }}>
                    <label>Activity Description
                      <input
                        value={day.newEntryLabel || ""}
                        style={eErrs.label ? errStyle : undefined}
                        onChange={(e) => setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, newEntryLabel: e.target.value } : x))}
                        placeholder="e.g. Visit Sigiriya Rock"
                      />
                      {eErrs.label && <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{eErrs.label}</span>}
                    </label>
                    <label>Activity Type
                      <select
                        value={day.newEntryType || "Other"}
                        onChange={(e) => setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, newEntryType: e.target.value } : x))}
                      >
                        {ACTIVITY_TYPES.map((typeName) => <option key={typeName} value={typeName}>{typeName}</option>)}
                      </select>
                    </label>
                    <label>Start Time
                      <input
                        type="time"
                        value={day.newEntryStart || ""}
                        style={eErrs.start ? errStyle : undefined}
                        onChange={(e) => setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, newEntryStart: e.target.value } : x))}
                      />
                      {eErrs.start && <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{eErrs.start}</span>}
                    </label>
                    <label>End Time
                      <input
                        type="time"
                        value={day.newEntryEnd || ""}
                        style={eErrs.end ? errStyle : undefined}
                        onChange={(e) => setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, newEntryEnd: e.target.value } : x))}
                      />
                      {eErrs.end && <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{eErrs.end}</span>}
                    </label>
                  </div>
                  {eErrs.hotelTime && <div style={{ color: "#c0392b", fontSize: "0.82rem", marginBottom: 8 }}>⚠ {eErrs.hotelTime}</div>}
                  <button className="btn btn-primary" type="button" onClick={() => handleAddEntry(i)}>+ Add Activity</button>
                  <p className="muted" style={{ marginTop: 8 }}>Tip: For midnight end, use 12:00 AM (treated as 24:00).</p>
                </div>

                {/* ── Timeline Visual ── */}
                {day.timeline.length > 0 && (
                  <div className="timeline-visual-wrap">
                    <div className="timeline-track-label">
                      <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
                    </div>
                    <div className="timeline-track">
                      {day.timeline.map((entry, ei) => (
                        <div
                          key={ei}
                          className="timeline-block"
                          style={{
                            ...getBarStyle(entry.start, entry.end),
                            background: typeColors[entry.type] || "#6b7280"
                          }}
                          title={`${entry.start}–${entry.end} | ${entry.label} [${entry.type}]`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Activity List ── */}
                <div style={{ marginTop: 12 }}>
                  {day.timeline.length === 0 && <p className="muted">No activities added yet.</p>}
                  {day.timeline.map((entry, entryIdx) => {
                    const s = timeToMinutes(entry.start);
                    const eRaw = timeToMinutes(entry.end);
                    const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
                    const hrs = Math.round(((e - s) / 60) * 10) / 10;
                    return (
                      <div key={`${day.day}-entry-${entryIdx}`} className="timeline-row">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="type-dot" style={{ background: typeColors[entry.type] || "#6b7280" }} />
                          <span className="timeline-time">{entry.start} – {entry.end}</span>
                          <span className="timeline-label">{entry.label}</span>
                          <span className="timeline-type">[{entry.type}]</span>
                          <span className="timeline-dur">{hrs}h</span>
                        </div>
                        <button className="btn btn-danger" type="button" onClick={() => removeTimelineEntry(i, entryIdx)}>Remove</button>
                      </div>
                    );
                  })}
                  {day.timeline.length > 0 && (
                    <p className="muted" style={{ marginTop: 6 }}>Total scheduled: {totalScheduled} hour(s)</p>
                  )}
                </div>

                {/* Notes */}
                <label style={{ marginTop: 14 }}>
                  Other Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                  <textarea
                    value={day.activities.notes}
                    onChange={(e) => setDayPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, activities: { ...x.activities, notes: e.target.value } } : x))}
                    placeholder="Any additional notes for this day..."
                  />
                </label>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default StepThreeItinerary;