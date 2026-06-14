import React, { useState } from "react";
import { ACTIVITY_TYPES, DAY_TEMPLATES, VEHICLES } from "../data";
import ConfirmModal from "./ConfirmModal";

function StepThreeItinerary({
  base, legPlans, setLegPlans, dayPlans, setDayPlans,
  availableVehicles, addTimelineEntry, removeTimelineEntry, applyTemplate, errors = {}
}) {
  const [collapsedDays, setCollapsedDays] = useState({});
  const [collapsedLegs, setCollapsedLegs] = useState(false);
  const [entryErrors, setEntryErrors] = useState({});
  const [editingEntry, setEditingEntry] = useState({});
  const [templateModal, setTemplateModal] = useState({ isOpen: false, dayIdx: null, template: null });

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
    if (!day.hotelArrivalTime && !day.isCheckedIn) errs.hotelTime = "Please enter hotel arrival time first.";
    if (!day.newEntryLabel?.trim()) errs.label = "Activity description is required.";
    if (!day.newEntryStart) errs.start = "Start time is required.";
    if (!day.newEntryEnd) errs.end = "End time is required.";
    if (day.newEntryStart && day.newEntryEnd) {
      if (day.newEntryStart === day.newEntryEnd) {
        errs.end = "Start and end time cannot be the same.";
      } else {
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

  const startEdit = (dayIdx, entryIdx) => {
    const entry = dayPlans[dayIdx].timeline[entryIdx];
    setEditingEntry({ dayIdx, entryIdx, ...entry, errors: {} });
  };

  const cancelEdit = () => setEditingEntry({});

  const saveEdit = () => {
    const { dayIdx, entryIdx, start, end, label, type } = editingEntry;
    const errs = {};
    if (!label?.trim()) errs.label = "Activity description is required.";
    if (!start) errs.start = "Start time is required.";
    if (!end) errs.end = "End time is required.";
    if (start && end) {
      if (start === end) {
        errs.end = "Start and end time cannot be the same.";
      } else {
        const s = timeToMinutes(start);
        const eRaw = timeToMinutes(end);
        const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
        if (e <= s) {
          errs.end = "End time must be later than start time.";
        } else {
          const others = dayPlans[dayIdx].timeline.filter((_, i) => i !== entryIdx);
          const hasOverlap = others.some((row) => {
            const rs = timeToMinutes(row.start);
            const reRaw = timeToMinutes(row.end);
            const re = reRaw === 0 && rs > 0 ? 1440 : reRaw;
            return s < re && e > rs;
          });
          if (hasOverlap) errs.end = "This time slot overlaps with another activity.";
        }
      }
    }
    if (Object.keys(errs).length > 0) {
      setEditingEntry((prev) => ({ ...prev, errors: errs }));
      return;
    }
    setDayPlans((prev) => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      const newTimeline = d.timeline
        .map((entry, ei) => ei === entryIdx ? { start, end, label: label.trim(), type } : entry)
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      return { ...d, timeline: newTimeline };
    }));
    setEditingEntry({});
  };

  const handleApplyTemplate = (dayIdx, template) => {
  if (dayPlans[dayIdx].timeline.length > 0) {
    setTemplateModal({ isOpen: true, dayIdx, template });
  } else {
    applyTemplate(dayIdx, template.activities);
  }
};

  const getBarStyle = (start, end) => {
    const s = timeToMinutes(start);
    const eRaw = timeToMinutes(end);
    const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
    return { left: `${(s / 1440) * 100}%`, width: `${((e - s) / 1440) * 100}%` };
  };

  const getGaps = (timeline) => {
    const gaps = [];
    for (let i = 0; i < timeline.length - 1; i++) {
      const endCurrent = timeToMinutes(timeline[i].end) === 0 && timeToMinutes(timeline[i].start) > 0
        ? 1440 : timeToMinutes(timeline[i].end);
      const startNext = timeToMinutes(timeline[i + 1].start);
      const gapMins = startNext - endCurrent;
      if (gapMins > 0) {
        const endH = Math.floor(endCurrent / 60).toString().padStart(2, "0");
        const endM = (endCurrent % 60).toString().padStart(2, "0");
        const startH = Math.floor(startNext / 60).toString().padStart(2, "0");
        const startM = (startNext % 60).toString().padStart(2, "0");
        gaps.push({ afterIndex: i, minutes: gapMins, from: `${endH}:${endM}`, to: `${startH}:${startM}` });
      }
    }
    return gaps;
  };

  // Icon SVGs
  const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const RemoveIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );

 const typeColors = {
    "Meal": "#f59e0b", "Resting": "#94a3b8", "Walking": "#10b981",
    "Jogging": "#06b6d4", "Hiking": "#16a34a", "Bicycle Ride": "#84cc16",
    "Swimming / Snorkeling": "#0ea5e9", "Surfing": "#3b82f6", "Boat Ride": "#6366f1",
    "Beach Leisure": "#f97316", "Wildlife Safari": "#a16207", "Cultural / Temple Visit": "#7c3aed",
    "Sightseeing": "#ec4899", "Shopping": "#f43f5e", "Spa / Ayurveda": "#8b5cf6",
    "Public Transport": "#64748b", "Private / Hired Vehicle": "#475569",
    "Airport Transfer": "#0f172a", "Medical / Hospital Visit": "#dc2626", "Other": "#6b7280",
  };

  return (
    <>
      <ConfirmModal
        isOpen={templateModal.isOpen}
        title="Replace Activities"
        message={`Replace all existing activities with the "${templateModal.template?.name}" template? This cannot be undone.`}
        confirmLabel="Replace"
        cancelLabel="Keep Existing"
        danger={false}
        onConfirm={() => {
          applyTemplate(templateModal.dayIdx, templateModal.template.activities);
          setTemplateModal({ isOpen: false, dayIdx: null, template: null });
        }}
        onCancel={() => setTemplateModal({ isOpen: false, dayIdx: null, template: null })}
      />
      <section className="step active">
        <h2>Travel Legs & Day-by-Day Activities</h2>

        {errors.itinerary && <div className="status warn">{errors.itinerary}</div>}

        {/* ── Travel Legs — Collapsible ── */}
        <div className="legs-sticky">
          <div className="legs-sticky-header" onClick={() => setCollapsedLegs((p) => !p)} style={{ cursor: "pointer" }}>
            <h3 style={{ margin: 0 }}>Travel Legs</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="legs-info">
                {base.isRental ? "Rental mode — transport auto-set" : "Set transport for each leg"}
              </span>
              <span className="collapse-btn">{collapsedLegs ? "Expand" : "Collapse"}</span>
            </div>
          </div>

          {!collapsedLegs && (
            <div className="legs-list">
              {legPlans.map((leg, i) => {
                const vehicle = VEHICLES.find((v) => v.name === leg.transportMode);
                const fuels = vehicle?.allowedFuels || ["Petrol"];
                return (
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
                      <label>Vehicle Type
                        <select
                          value={leg.transportMode}
                          disabled={base.isRental}
                          onChange={(e) => {
                            const newVehicle = VEHICLES.find((v) => v.name === e.target.value);
                            const newFuel = newVehicle?.allowedFuels[0] || "Petrol";
                            setLegPlans((prev) => prev.map((x, idx) => idx === i
                              ? { ...x, transportMode: e.target.value, fuelType: newFuel }
                              : x));
                          }}
                        >
                          {base.isRental
                            ? <option>Rental Vehicle</option>
                            : availableVehicles.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)
                          }
                        </select>
                      </label>
                      {!base.isRental && fuels.length > 0 && fuels[0] !== "Human-powered" && fuels[0] !== "Public" && (
                        <label>Fuel / Power Type
                          <select
                            value={leg.fuelType || fuels[0]}
                            onChange={(e) => setLegPlans((prev) => prev.map((x, idx) => idx === i ? { ...x, fuelType: e.target.value } : x))}
                          >
                            {fuels.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </label>
                      )}
                      {base.isRental && (
                        <label>Power Source
                          <input value={base.rentalPowerSource} readOnly />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

        const locationTemplates = DAY_TEMPLATES[day.location] || [];
        const gaps = getGaps(day.timeline);

        return (
          <div className="day-card" key={`${day.day}-${day.location}`}>
            <div className="day-head" onClick={() => toggleDay(i)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="day-badge">Day {day.day} of {dayPlans.length}</span>
                <strong>{day.location}</strong>
                <span className="muted" style={{ fontSize: "0.8rem" }}>| {day.hotelName}</span>
                {day.isCheckedIn && (
                  <span className="checked-in-badge">Already Checked In</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {day.timeline.length > 0 && (
                  <span className="activity-count">
                    {day.timeline.length} activit{day.timeline.length > 1 ? "ies" : "y"} · {totalScheduled}h
                  </span>
                )}
                {hotelTimeError && (
                  <span style={{ color: "#c0392b", fontSize: "0.8rem" }}>Hotel time missing</span>
                )}
                <span className="collapse-btn">{isCollapsed ? "Expand" : "Collapse"}</span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="day-body">

                {/* Hotel Arrival Time */}
                {day.isCheckedIn ? (
                  <div className="checked-in-notice">
                    Already checked in — continuing stay at {day.hotelName}
                  </div>
                ) : (
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
                )}

                {/* Templates */}
                {locationTemplates.length > 0 && (
                  <div className="template-section">
                    <div className="template-header">
                      <span className="template-title">Quick Templates for {day.location}</span>
                      <span className="template-sub">One click to fill the day — you can still edit after</span>
                    </div>
                    <div className="template-buttons">
                      {locationTemplates.map((template) => (
                        <button
                          key={template.name}
                          className="btn-template"
                          type="button"
                          onClick={() => handleApplyTemplate(i, template)}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline Visual */}
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
                          style={{ ...getBarStyle(entry.start, entry.end), background: typeColors[entry.type] || "#6b7280" }}
                          title={`${entry.start}–${entry.end} | ${entry.label} [${entry.type}]`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity List */}
                <div style={{ marginTop: 12 }}>
                  {day.timeline.length === 0 && (
                    <p className="muted">No activities added yet. Use a template above or add manually below.</p>
                  )}

                  {day.timeline.map((entry, entryIdx) => {
                    const s = timeToMinutes(entry.start);
                    const eRaw = timeToMinutes(entry.end);
                    const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
                    const hrs = Math.round(((e - s) / 60) * 10) / 10;
                    const isEditing = editingEntry.dayIdx === i && editingEntry.entryIdx === entryIdx;
                    const gap = gaps.find((g) => g.afterIndex === entryIdx);

                    return (
                      <React.Fragment key={`${day.day}-entry-${entryIdx}`}>
                        {isEditing ? (
                          <div className="edit-entry-card">
                            <div className="grid two" style={{ marginBottom: 8 }}>
                              <label>Activity Description
                                <input
                                  value={editingEntry.label || ""}
                                  style={editingEntry.errors?.label ? errStyle : undefined}
                                  onChange={(e) => setEditingEntry((prev) => ({ ...prev, label: e.target.value }))}
                                />
                                {editingEntry.errors?.label && (
                                  <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{editingEntry.errors.label}</span>
                                )}
                              </label>
                              <label>Activity Type
                                <select
                                  value={editingEntry.type || "Other"}
                                  onChange={(e) => setEditingEntry((prev) => ({ ...prev, type: e.target.value }))}
                                >
                                  {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </label>
                              <label>Start Time
                                <input
                                  type="time"
                                  value={editingEntry.start || ""}
                                  style={editingEntry.errors?.start ? errStyle : undefined}
                                  onChange={(e) => setEditingEntry((prev) => ({ ...prev, start: e.target.value }))}
                                />
                                {editingEntry.errors?.start && (
                                  <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{editingEntry.errors.start}</span>
                                )}
                              </label>
                              <label>End Time
                                <input
                                  type="time"
                                  value={editingEntry.end || ""}
                                  style={editingEntry.errors?.end ? errStyle : undefined}
                                  onChange={(e) => setEditingEntry((prev) => ({ ...prev, end: e.target.value }))}
                                />
                                {editingEntry.errors?.end && (
                                  <span style={{ color: "#c0392b", fontSize: "0.78rem" }}>{editingEntry.errors.end}</span>
                                )}
                              </label>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-primary" type="button" onClick={saveEdit}>Save Changes</button>
                              <button className="btn btn-light" type="button" onClick={cancelEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="timeline-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="type-dot" style={{ background: typeColors[entry.type] || "#6b7280" }} />
                              <span className="timeline-time">{entry.start} – {entry.end}</span>
                              <span className="timeline-label">{entry.label}</span>
                              <span className="timeline-type">[{entry.type}]</span>
                              <span className="timeline-dur">{hrs}h</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="btn-icon btn-icon-edit"
                                type="button"
                                title="Edit activity"
                                onClick={() => startEdit(i, entryIdx)}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="btn-icon btn-icon-remove"
                                type="button"
                                title="Remove activity"
                                onClick={() => removeTimelineEntry(i, entryIdx)}
                              >
                                <RemoveIcon />
                              </button>
                            </div>
                          </div>
                        )}

                        {gap && (
                          <div className="gap-indicator">
                            <span className="gap-line" />
                            <span className="gap-label">{gap.from} – {gap.to} | {gap.minutes} min unscheduled</span>
                            <span className="gap-line" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {day.timeline.length > 0 && (
                    <p className="muted" style={{ marginTop: 6 }}>
                      Total scheduled: {totalScheduled} hour(s) | Unscheduled: {Math.round((24 - totalScheduled) * 10) / 10} hour(s)
                    </p>
                  )}
                </div>

                {/* Add Activity */}
                <div className="card inset" style={{ marginTop: 14 }}>
                  <h3>Add Activity Manually</h3>
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
                  {eErrs.hotelTime && (
                    <div style={{ color: "#c0392b", fontSize: "0.82rem", marginBottom: 8 }}>{eErrs.hotelTime}</div>
                  )}
                  <button className="btn btn-primary" type="button" onClick={() => handleAddEntry(i)}>+ Add Activity</button>
                  <p className="muted" style={{ marginTop: 8 }}>Tip: For midnight end, use 12:00 AM (treated as 24:00).</p>
                </div>

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
    </>
  );
}

export default StepThreeItinerary;