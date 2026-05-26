import React from "react";
import { AIRPORTS, COUNTRIES, VEHICLES } from "../data";

function StepOneTripDetails({ base, updateBase, errors = {} }) {
  const inputCls = (key) => ({
    borderColor: errors[key] ? "#c0392b" : undefined,
    boxShadow: errors[key] ? "0 0 0 3px rgba(192,57,43,0.15)" : undefined,
  });

  const Err = ({ k }) => errors[k]
    ? <span style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: 2 }}>{errors[k]}</span>
    : null;

  return (
    <section className="step active">
      <h2>Basic Trip Details</h2>

      {/* ── Tourist Info ── */}
      <div className="section-group">
        <h3>Tourist Information</h3>
        <div className="grid two">
          <label>Tourist Name
            <input value={base.touristName} style={inputCls("touristName")} onChange={(e) => updateBase("touristName", e.target.value)} placeholder="Full name" />
            <Err k="touristName" />
          </label>

          <label>Tourist Email
            <input type="email" value={base.touristEmail} style={inputCls("touristEmail")} onChange={(e) => updateBase("touristEmail", e.target.value)} placeholder="email@example.com" />
            <Err k="touristEmail" />
          </label>

          <label>Age
            <input type="number" min="1" max="75" value={base.age} onChange={(e) => updateBase("age", Math.max(1, Math.min(75, Number(e.target.value) || 1)))} />
          </label>

          <label>Country of Origin
            <select value={base.country} onChange={(e) => updateBase("country", e.target.value)}>
              {COUNTRIES.filter((c) => c !== "Sri Lanka").map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* ── Group Info ── */}
      <div className="section-group">
        <h3>Travel Group</h3>
        <div className="grid two">
          <label>Travel Type
            <select value={base.travelMode} onChange={(e) => updateBase("travelMode", e.target.value)}>
              <option value="solo">Traveling Alone</option>
              <option value="group">Traveling in a Group</option>
            </select>
          </label>

          <label>Number of Tourists
            <input
              type="number" min="1" max="45"
              value={base.groupSize}
              style={inputCls("groupSize")}
              onChange={(e) => updateBase("groupSize", Math.max(1, Number(e.target.value) || 1))}
              disabled={base.travelMode === "solo"}
            />
            <Err k="groupSize" />
          </label>
        </div>
      </div>

      {/* ── Trip Dates ── */}
      <div className="section-group">
        <h3>Trip Dates & Airports</h3>
        <div className="grid two">
          <label>Arrival Airport
            <select value={base.arrivalAirport} onChange={(e) => updateBase("arrivalAirport", e.target.value)}>
              {AIRPORTS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>

          <label>Arrival Date & Time
            <input type="datetime-local" value={base.arrivalDateTime} style={inputCls("arrivalDateTime")} onChange={(e) => updateBase("arrivalDateTime", e.target.value)} />
            <Err k="arrivalDateTime" />
          </label>

          <label>Departure Airport
            <select value={base.departureAirport} onChange={(e) => updateBase("departureAirport", e.target.value)}>
              {AIRPORTS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>

          <label>Planned Departure Date & Time
            <input type="datetime-local" value={base.departureDateTime} style={inputCls("departureDateTime")} onChange={(e) => updateBase("departureDateTime", e.target.value)} />
            <Err k="departureDateTime" />
          </label>
        </div>

        {/* Total Stay Badge */}
        <div className={`total-stay-badge ${errors.totalDays ? "error" : base.totalDays > 0 ? "ok" : ""}`}>
          <span className="stay-label">Total Stay</span>
          <span className="stay-value">{base.totalDays > 0 ? `${base.totalDays} Day${base.totalDays > 1 ? "s" : ""}` : "—"}</span>
          <span className="stay-sub">Auto calculated from dates</span>
          {errors.totalDays && <span className="stay-error">{errors.totalDays}</span>}
        </div>
      </div>

      {/* ── Rental Vehicle ── */}
      <div className="section-group">
        <h3>Vehicle for Entire Trip</h3>
        <label className="toggle-label" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={base.isRental} onChange={(e) => updateBase("isRental", e.target.checked)} />
          Renting a vehicle for the entire trip?
        </label>

        {base.isRental && (
          <div className="rental-details">
            <div className="grid two">
              <label>Vehicle Type
                <select value={base.rentalVehicleType} onChange={(e) => updateBase("rentalVehicleType", e.target.value)}>
                  {VEHICLES.filter((v) => !v.name.toLowerCase().includes("public transport")).map((v) => <option key={v.name}>{v.name}</option>)}
                </select>
              </label>

              <label>Power Source
                <select value={base.rentalPowerSource} onChange={(e) => updateBase("rentalPowerSource", e.target.value)}>
                  {["EV", "Hybrid", "Petrol", "Diesel"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <label className="toggle-label" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={base.withDriver} onChange={(e) => updateBase("withDriver", e.target.checked)} />
              Driver included with rental?
            </label>
          </div>
        )}
      </div>

      {/* ── Trip Notes ── */}
      <div className="section-group">
        <h3>Additional Notes</h3>
        <label>Trip Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          <textarea value={base.tripNotes || ""} onChange={(e) => updateBase("tripNotes", e.target.value)} placeholder="Any special notes about this trip..." />
        </label>
      </div>

    </section>
  );
}

export default StepOneTripDetails;