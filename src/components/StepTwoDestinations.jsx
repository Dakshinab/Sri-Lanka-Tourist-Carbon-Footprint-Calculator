import React, { useState } from "react";
import { HOTELS, LOCATIONS } from "../data";

function StepTwoDestinations({ destinations, updateDestination, removeDestination, addDestination, allocatedDays, totalDays, errors = {} }) {
  const [collapsedHotels, setCollapsedHotels] = useState({});

  const toggleHotelCollapse = (id) => {
    setCollapsedHotels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const remaining = Number(totalDays) - allocatedDays;
  const progressPct = totalDays > 0 ? Math.min(100, (allocatedDays / Number(totalDays)) * 100) : 0;

  const isDuplicate = (id, location) =>
    destinations.some((d) => d.id !== id && d.location === location);

  return (
    <section className="step active">
      <h2>Destinations & Hotels</h2>
      <p className="muted">Select locations in travel order and assign stay days. Total allocated days must equal trip length.</p>

      {/* ── Sticky Progress Bar ── */}
      <div className="days-progress-sticky">
        <div className="days-progress-header">
          <span>Days Allocated</span>
          <span className={allocatedDays === Number(totalDays) ? "prog-ok" : remaining < 0 ? "prog-over" : "prog-warn"}>
            {allocatedDays} / {totalDays} days
            {remaining > 0 && <span className="prog-remaining"> ({remaining} remaining)</span>}
            {remaining < 0 && <span className="prog-remaining"> ({Math.abs(remaining)} over)</span>}
            {remaining === 0 && totalDays > 0 && <span className="prog-remaining"> ✓ Perfect</span>}
          </span>
        </div>
        <div className="days-progress-bar">
          <div
            className={`days-progress-fill ${allocatedDays === Number(totalDays) ? "ok" : remaining < 0 ? "over" : ""}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Destination Cards ── */}
      {destinations.map((d, idx) => (
        <div className={`destination-item ${isDuplicate(d.id, d.location) ? "dest-duplicate" : ""}`} key={d.id}>
          <div className="destination-head">
            <strong>Destination {idx + 1} — {d.location}</strong>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                if (window.confirm(`Remove "${d.location}" from your itinerary?`)) {
                  removeDestination(d.id);
                }
              }}
            >
              Remove
            </button>
          </div>

          {isDuplicate(d.id, d.location) && (
            <div className="duplicate-warn">
              ⚠ "{d.location}" is already added. Consider merging the stay days.
            </div>
          )}

          <div className="grid two">
            <label>Location
              <select value={d.location} onChange={(e) => updateDestination(d.id, { location: e.target.value })}>
                {LOCATIONS.map((loc) => <option key={loc}>{loc}</option>)}
              </select>
            </label>

            <label>Stay Days in This Location
              <div className="stepper">
                <button className="stepper-btn" type="button"
                  onClick={() => updateDestination(d.id, { days: Math.max(1, d.days - 1) })}>−</button>
                <span className="stepper-val">{d.days} day{d.days > 1 ? "s" : ""}</span>
                <button className="stepper-btn" type="button"
                  onClick={() => updateDestination(d.id, { days: Math.min(14, d.days + 1) })}>+</button>
              </div>
            </label>

            <label>Hotel Category
              <select value={d.hotelStar} onChange={(e) => updateDestination(d.id, { hotelStar: e.target.value })}>
                {["3-star", "4-star", "5-star"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label className="toggle-label" style={{ marginTop: 30 }}>
              <input
                type="checkbox"
                checked={d.sameHotelForAllDays}
                onChange={(e) => updateDestination(d.id, { sameHotelForAllDays: e.target.checked })}
              />
              Use same hotel for all days here
            </label>

            {d.sameHotelForAllDays ? (
              <label>Hotel Name
                <select value={d.hotelName} onChange={(e) => updateDestination(d.id, { hotelName: e.target.value })}>
                  {HOTELS[d.location][d.hotelStar].map((h) => <option key={h}>{h}</option>)}
                </select>
              </label>
            ) : (
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="per-day-hotel-header">
                  <strong>Hotels Per Day in {d.location}</strong>
                  <button
                    className="btn btn-light"
                    type="button"
                    style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                    onClick={() => toggleHotelCollapse(d.id)}
                  >
                    {collapsedHotels[d.id] ? "▼ Show" : "▲ Hide"}
                  </button>
                </div>

                {!collapsedHotels[d.id] && (
                  <div style={{ marginTop: 8 }}>
                    {d.dayHotels.map((dayHotel, dayIndex) => (
                      <div key={`${d.id}-day-${dayIndex}`} className="per-day-hotel-row">
                        <span className="per-day-label">Day {dayIndex + 1}</span>
                        <div className="grid two" style={{ flex: 1 }}>
                          <label>Star Category
                            <select
                              value={dayHotel.star}
                              onChange={(e) => updateDestination(d.id, {
                                dayHotelUpdate: { dayIndex, field: "star", value: e.target.value }
                              })}
                            >
                              {["3-star", "4-star", "5-star"].map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </label>
                          <label>Hotel Name
                            <select
                              value={dayHotel.name}
                              onChange={(e) => updateDestination(d.id, {
                                dayHotelUpdate: { dayIndex, field: "name", value: e.target.value }
                              })}
                            >
                              {HOTELS[d.location][dayHotel.star].map((h) => <option key={h}>{h}</option>)}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <button className="btn btn-light" type="button" onClick={addDestination}>+ Add Destination</button>

      <div className={`status ${allocatedDays === Number(totalDays) ? "ok" : "warn"}`}>
        Allocated {allocatedDays}/{totalDays} days.
        {errors.allocatedDays && (
          <span style={{ display: "block", color: "#c0392b", marginTop: 4, fontWeight: 600 }}>
            ⚠ {errors.allocatedDays}
          </span>
        )}
      </div>
    </section>
  );
}

export default StepTwoDestinations;