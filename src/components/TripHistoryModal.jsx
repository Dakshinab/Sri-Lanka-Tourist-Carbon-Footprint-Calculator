import React from "react";

function TripHistoryModal({ isOpen, onClose, trips, loading, onSelectTrip, onDeleteTrip, selectedTrip, onCloseTrip }) {
  if (!isOpen) return null;

  const formatDate = (dt) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handlePrintTrip = (data) => {
    const { trip, destinations, legs, days } = data;

    const destinationRows = destinations
      .map((d, i) => `<li>${i + 1}. ${d.location} — ${d.days} day(s), ${d.hotel_star}, ${d.hotel_name}</li>`)
      .join("");

    const legRows = legs
      .map((l) => `<li>Leg ${l.leg_order}: ${l.from_location} → ${l.to_location} via ${l.transport_mode} (${l.fuel_type || "N/A"})</li>`)
      .join("");

    const dayRows = days.map((day) => {
      const activityRows = day.activities.length === 0
        ? `<tr><td colspan="5">No activities recorded.</td></tr>`
        : day.activities.map((a) => `
            <tr>
              <td>${a.start_time}</td>
              <td>${a.end_time}</td>
              <td>${a.label}</td>
              <td>${a.activity_type}</td>
              <td>${a.emission?.toFixed(2)}</td>
            </tr>`).join("");

      return `
        <div class="report-section">
          <h3>Day ${day.day_number}: ${day.location} (${day.hotel_name} — ${day.hotel_star})</h3>
          <ul>
            <li>Hotel Arrival Time: ${day.hotel_arrival_time || (day.is_checked_in ? "Already Checked In" : "-")}</li>
            <li>Hotel Emission: ${day.hotel_emission?.toFixed(2)} kg CO₂</li>
            ${day.notes ? `<li>Notes: ${day.notes}</li>` : ""}
          </ul>
          <h4>Activities</h4>
          <table class="report-table">
            <thead>
              <tr><th>Start</th><th>End</th><th>Activity</th><th>Type</th><th>Emission (kg CO₂)</th></tr>
            </thead>
            <tbody>${activityRows}</tbody>
          </table>
        </div>`;
    }).join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Carbon Footprint Report — ${trip.tourist_name}</title>
        <style>
          @page { size: A4; margin: 20mm 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a2318; background: #fff; }
          .report-header { text-align: center; padding-bottom: 14px; margin-bottom: 20px; border-bottom: 2px solid #2d6a4f; }
          .report-header h1 { font-size: 18pt; color: #2d6a4f; margin-bottom: 4px; }
          .report-header p { font-size: 9pt; color: #6b7c69; }
          .report-section { border: 1px solid #dde9e2; border-radius: 6px; padding: 10px 13px; margin-bottom: 12px; background: #fff; border-left: 3px solid #74c69d; page-break-inside: avoid; }
          h3 { font-size: 11pt; font-weight: 700; color: #2d6a4f; margin-bottom: 8px; }
          h4 { font-size: 9.5pt; font-weight: 600; color: #6b7c69; margin: 10px 0 5px; text-transform: uppercase; letter-spacing: 0.05em; }
          ul { padding-left: 16px; margin: 0 0 8px; font-size: 10pt; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9.5pt; }
          th { background: #e8f5ee; color: #2d6a4f; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 9pt; }
          td { padding: 5px 8px; border-bottom: 1px solid #dde5db; color: #1a2318; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) td { background: #f7faf7; }
          .report-table { width: 100%; border-collapse: collapse; }
          .summary-table { width: 100%; border-collapse: collapse; }
          .report-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #dde5db; font-size: 8.5pt; color: #6b7c69; text-align: center; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Sri Lanka Carbon Footprint Report</h1>
          <p>Trip #${trip.id} &nbsp;|&nbsp; Generated on ${formatDate(new Date().toISOString())} &nbsp;|&nbsp; Travel Agent Carbon Intake System</p>
        </div>

        <div class="report-section">
          <h3>Tourist Profile</h3>
          <ul>
            <li>Tourist Name: ${trip.tourist_name}</li>
            <li>Email: ${trip.tourist_email}</li>
            <li>Age: ${trip.age}</li>
            <li>Country: ${trip.country}</li>
            <li>Travel Type: ${trip.travel_mode === "solo" ? "Solo" : "Group"} | Group Size: ${trip.group_size}</li>
            <li>Total Days: ${trip.total_days}</li>
            ${trip.trip_notes ? `<li>Trip Notes: ${trip.trip_notes}</li>` : ""}
          </ul>
        </div>

        <div class="report-section">
          <h3>Trip Movement</h3>
          <ul>
            <li>Arrival: ${trip.arrival_airport} at ${trip.arrival_datetime || "-"}</li>
            <li>Departure: ${trip.departure_airport} at ${trip.departure_datetime || "-"}</li>
            <li>Rental Vehicle: ${trip.is_rental ? `Yes (${trip.rental_vehicle_type}, ${trip.rental_power_source}, Driver: ${trip.with_driver ? "Yes" : "No"})` : "No"}</li>
          </ul>
        </div>

        <div class="report-section">
          <h3>Destination Plan</h3>
          <ul>${destinationRows}</ul>
        </div>

        <div class="report-section">
          <h3>Travel Legs</h3>
          <ul>${legRows}</ul>
        </div>

        ${dayRows}

        <div class="report-section">
          <h3>Carbon Emission Summary</h3>
          <p style="font-size:0.82rem; color:#6b7c69; margin-bottom:12px;">
            Transport emissions calculated separately by IoT GPS module.
          </p>
          <table class="summary-table">
            <thead>
              <tr><th>Category</th><th>Emission (kg CO₂)</th></tr>
            </thead>
            <tbody>
              <tr><td>Activity Emissions</td><td>${trip.activity_emission?.toFixed(2)}</td></tr>
              <tr><td>Hotel Emissions</td><td>${trip.hotel_emission?.toFixed(2)}</td></tr>
              <tr style="font-weight:600; background:#eaf7f0;">
                <td>Total (excl. transport)</td>
                <td>${trip.total_emission?.toFixed(2)} kg CO₂</td>
              </tr>
              <tr style="font-weight:600;">
                <td>Per Person (excl. transport)</td>
                <td>${trip.per_person_emission?.toFixed(2)} kg CO₂</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-footer">
          This report was generated by the Sri Lanka Tourist Carbon Footprint Calculator.
          Transport emissions are calculated separately and not included above.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <h3>Trip History</h3>
          <button className="btn-icon btn-icon-remove" type="button" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="history-modal-body">
          {loading && <p className="muted">Loading trips...</p>}

          {!loading && trips.length === 0 && (
            <p className="muted">No trips saved yet.</p>
          )}

          {!loading && !selectedTrip && trips.length > 0 && (
            <div className="trip-list">
              {trips.map((trip) => (
                <div className="trip-list-item" key={trip.id}>
                  <div className="trip-list-info" onClick={() => onSelectTrip(trip.id)}>
                    <div className="trip-list-name">#{trip.id} — {trip.tourist_name}</div>
                    <div className="trip-list-meta">
                      {trip.country} | {trip.travel_mode === "solo" ? "Solo" : `Group (${trip.group_size})`} | {trip.total_days} days
                    </div>
                    <div className="trip-list-emission">
                      Total: <strong>{trip.total_emission?.toFixed(2)} kg CO₂</strong>
                      &nbsp;|&nbsp; Per Person: <strong>{trip.per_person_emission?.toFixed(2)} kg CO₂</strong>
                    </div>
                    <div className="trip-list-date">{formatDate(trip.created_at)}</div>
                  </div>
                  <button
                    className="btn-icon btn-icon-remove"
                    type="button"
                    title="Delete trip"
                    onClick={() => onDeleteTrip(trip.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Single Trip Detail View ── */}
          {selectedTrip && (
            <div className="trip-detail">
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <button
                  className="btn btn-light"
                  type="button"
                  style={{ fontSize: "0.82rem" }}
                  onClick={onCloseTrip}
                >
                  Back to list
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ fontSize: "0.82rem" }}
                  onClick={() => handlePrintTrip(selectedTrip)}
                >
                  Download PDF
                </button>
              </div>

              <div className="trip-detail-section">
                <h4>Tourist Profile</h4>
                <ul>
                  <li>Name: {selectedTrip.trip.tourist_name}</li>
                  <li>Email: {selectedTrip.trip.tourist_email}</li>
                  <li>Country: {selectedTrip.trip.country}</li>
                  <li>Age: {selectedTrip.trip.age}</li>
                  <li>Travel Type: {selectedTrip.trip.travel_mode === "solo" ? "Solo" : "Group"} | Group Size: {selectedTrip.trip.group_size}</li>
                  <li>Total Days: {selectedTrip.trip.total_days}</li>
                  <li>Saved on: {formatDate(selectedTrip.trip.created_at)}</li>
                </ul>
              </div>

              <div className="trip-detail-section">
                <h4>Destinations</h4>
                <ul>
                  {selectedTrip.destinations.map((d, i) => (
                    <li key={i}>{d.location} — {d.days} day(s), {d.hotel_star}, {d.hotel_name}</li>
                  ))}
                </ul>
              </div>

              <div className="trip-detail-section">
                <h4>Travel Legs</h4>
                <ul>
                  {selectedTrip.legs.map((l, i) => (
                    <li key={i}>Leg {l.leg_order}: {l.from_location} → {l.to_location} via {l.transport_mode} ({l.fuel_type || "N/A"})</li>
                  ))}
                </ul>
              </div>

              <div className="trip-detail-section">
                <h4>Carbon Emission Summary</h4>
                <ul>
                  <li>Activity Emissions: <strong>{selectedTrip.trip.activity_emission?.toFixed(2)} kg CO₂</strong></li>
                  <li>Hotel Emissions: <strong>{selectedTrip.trip.hotel_emission?.toFixed(2)} kg CO₂</strong></li>
                  <li>Total (excl. transport): <strong>{selectedTrip.trip.total_emission?.toFixed(2)} kg CO₂</strong></li>
                  <li>Per Person: <strong>{selectedTrip.trip.per_person_emission?.toFixed(2)} kg CO₂</strong></li>
                </ul>
              </div>

              <div className="trip-detail-section">
                <h4>Daily Activities</h4>
                {selectedTrip.days.map((day) => (
                  <div key={day.id} style={{ marginBottom: 12 }}>
                    <strong>Day {day.day_number} — {day.location} ({day.hotel_name})</strong>
                    {day.activities.length === 0
                      ? <p className="muted" style={{ fontSize: "0.82rem" }}>No activities recorded.</p>
                      : (
                        <table className="history-table">
                          <thead>
                            <tr><th>Start</th><th>End</th><th>Activity</th><th>Type</th><th>Emission (kg CO₂)</th></tr>
                          </thead>
                          <tbody>
                            {day.activities.map((a, ai) => (
                              <tr key={ai}>
                                <td>{a.start_time}</td>
                                <td>{a.end_time}</td>
                                <td>{a.label}</td>
                                <td>{a.activity_type}</td>
                                <td>{a.emission?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripHistoryModal;