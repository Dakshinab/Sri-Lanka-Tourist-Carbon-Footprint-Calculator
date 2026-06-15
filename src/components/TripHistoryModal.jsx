import React from "react";

function TripHistoryModal({ isOpen, onClose, trips, loading, onSelectTrip, onDeleteTrip, selectedTrip, onCloseTrip }) {
  if (!isOpen) return null;

  const formatDate = (dt) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
              <button className="btn btn-light" type="button" style={{ marginBottom: 14, fontSize: "0.82rem" }} onClick={onCloseTrip}>
                Back to list
              </button>

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
                    <li key={i}>Leg {l.leg_order}: {l.from_location} → {l.to_location} via {l.transport_mode} ({l.fuel_type})</li>
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