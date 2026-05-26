import React, { useMemo, useState } from "react";
import StepOneTripDetails from "./components/StepOneTripDetails";
import StepTwoDestinations from "./components/StepTwoDestinations";
import StepThreeItinerary from "./components/StepThreeItinerary";
import StepFourReport from "./components/StepFourReport";
import { defaultBase, defaultDestination, HOTELS, VEHICLES, ACTIVITY_EMISSION_FACTORS, HOTEL_EMISSION_FACTORS } from "./data";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [base, setBase] = useState(defaultBase);
  const [destinations, setDestinations] = useState([defaultDestination()]);
  const [legPlans, setLegPlans] = useState([]);
  const [dayPlans, setDayPlans] = useState([]);
  const [errors, setErrors] = useState({});

  const allocatedDays = useMemo(
    () => destinations.reduce((sum, d) => sum + Number(d.days || 0), 0),
    [destinations]
  );

  const availableVehicles = useMemo(
    () => VEHICLES.filter((v) => base.groupSize >= v.min && base.groupSize <= v.max),
    [base.groupSize]
  );

  const updateBase = (key, value) => {
    setBase((prev) => {
      let next = { ...prev, [key]: value };
      if (key === "isRental" && !value) next = { ...next, withDriver: false };
      if (key === "travelMode" && value === "solo") next = { ...next, groupSize: 1 };

      const arrival = new Date(key === "arrivalDateTime" ? value : next.arrivalDateTime);
      const departure = new Date(key === "departureDateTime" ? value : next.departureDateTime);
      if (!Number.isNaN(arrival.getTime()) && !Number.isNaN(departure.getTime()) && departure > arrival) {
        const ms = departure.getTime() - arrival.getTime();
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        next.totalDays = Math.max(1, Math.min(14, days));
      } else {
        next.totalDays = 0;
      }
      return next;
    });
  };

  const addDestination = () => setDestinations((prev) => [...prev, defaultDestination()]);
  const removeDestination = (id) => setDestinations((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.id !== id)));

  const updateDestination = (id, patch) => {
    setDestinations((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        if (patch.location) {
          next.hotelName = HOTELS[patch.location][next.hotelStar][0];
          next.dayHotels = Array.from({ length: next.days }, () => ({
            star: next.hotelStar,
            name: HOTELS[patch.location][next.hotelStar][0]
          }));
        }
        if (patch.hotelStar) {
          next.hotelName = HOTELS[next.location][patch.hotelStar][0];
          next.dayHotels = Array.from({ length: next.days }, () => ({
            star: patch.hotelStar,
            name: HOTELS[next.location][patch.hotelStar][0]
          }));
        }
        if (patch.days) {
          const fallback = { star: next.hotelStar, name: HOTELS[next.location][next.hotelStar][0] };
          const existing = next.dayHotels || [];
          next.dayHotels = Array.from({ length: patch.days }, (_, idx) => existing[idx] || fallback);
        }
        if (patch.sameHotelForAllDays === true) {
          next.dayHotels = Array.from({ length: next.days }, () => ({
            star: next.hotelStar,
            name: next.hotelName
          }));
        }
        if (patch.dayHotelUpdate) {
          const { dayIndex, field, value } = patch.dayHotelUpdate;
          next.dayHotels = next.dayHotels.map((h, i) => {
            if (i !== dayIndex) return h;
            const updated = { ...h, [field]: value };
            if (field === "star") updated.name = HOTELS[next.location][value][0];
            return updated;
          });
        }
        return next;
      })
    );
  };

  const buildItinerary = () => {
    if (allocatedDays !== Number(base.totalDays)) return { ok: false, message: "Destination day allocation must match total stay days." };
    const nextDays = [];
    let day = 1;
    destinations.forEach((d) => {
      for (let i = 0; i < d.days; i += 1) {
        const hotelNameForDay = d.sameHotelForAllDays ? d.hotelName : (d.dayHotels?.[i]?.name || d.hotelName);
        nextDays.push({
          day,
          location: d.location,
          hotelName: hotelNameForDay,
          hotelStar: d.sameHotelForAllDays ? d.hotelStar : (d.dayHotels?.[i]?.star || d.hotelStar),
          hotelArrivalTime: "",
          timeline: [],
          newEntryStart: "",
          newEntryEnd: "",
          newEntryLabel: "",
          newEntryType: "Other",
          activities: { notes: "" }
        });
        day += 1;
      }
    });

    const choice = availableVehicles[0]?.name || "Public Bus / Train";
    const nextLegs = [];
    nextLegs.push({
      from: base.arrivalAirport,
      to: destinations[0].location,
      when: "Day 1 - after arrival",
      transportMode: base.isRental ? "Rental Vehicle" : choice
    });
    for (let i = 0; i < destinations.length - 1; i += 1) {
      const fromDay = destinations.slice(0, i + 1).reduce((sum, d) => sum + Number(d.days), 0);
      nextLegs.push({
        from: destinations[i].location,
        to: destinations[i + 1].location,
        when: `End of Day ${fromDay} / Start of Day ${fromDay + 1}`,
        transportMode: base.isRental ? "Rental Vehicle" : choice
      });
    }
    nextLegs.push({
      from: destinations[destinations.length - 1].location,
      to: base.departureAirport,
      when: `Day ${base.totalDays} - before departure`,
      transportMode: base.isRental ? "Rental Vehicle" : choice
    });

    setDayPlans(nextDays);
    setLegPlans(nextLegs);
    return { ok: true };
  };

  const getStepErrors = (step) => {
    const errs = {};
    if (step === 1) {
      if (!base.touristName.trim()) errs.touristName = "Tourist name is required.";
      if (!base.touristEmail.trim()) errs.touristEmail = "Tourist email is required.";
      if (base.totalDays < 1 || base.totalDays > 14) errs.totalDays = "Total stay must be between 1 and 14 days.";
      if (base.groupSize < 1) errs.groupSize = "Group size must be at least 1.";
      if (base.travelMode === "group" && base.groupSize < 2) errs.groupSize = "Group travel requires at least 2.";
      if (!base.arrivalDateTime) errs.arrivalDateTime = "Arrival date & time required.";
      if (!base.departureDateTime) errs.departureDateTime = "Departure date & time required.";
    }
    if (step === 2) {
      if (allocatedDays !== Number(base.totalDays)) errs.allocatedDays = "Destination day allocation must match total stay days.";
    }
    if (step === 3) {
      if (!dayPlans.length || !legPlans.length) errs.itinerary = "Please generate itinerary details first.";
      const missingHotel = dayPlans.reduce((acc, d, i) => {
        if (!d.hotelArrivalTime) acc.push(i);
        return acc;
      }, []);
      if (missingHotel.length > 0) errs.hotelArrivalTime = missingHotel;
    }
    return errs;
  };

  const formatDateTime = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
};

  const toDayMinutes = (timeValue) => {
    const [h, m] = timeValue.split(":").map(Number);
    return (h * 60) + m;
  };

  const normalizedRange = (start, end) => {
    const s = toDayMinutes(start);
    const eRaw = toDayMinutes(end);
    const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
    return { s, e };
  };

  const hasOverlap = (timeline, start, end) => {
    const { s, e } = normalizedRange(start, end);
    return timeline.some((row) => {
      const { s: rs, e: re } = normalizedRange(row.start, row.end);
      return s < re && e > rs;
    });
  };

  const getDayHotelHours = (dayObj) => {
    const minutes = dayObj.timeline.reduce((sum, row) => {
      if (!row.label.toLowerCase().includes("hotel")) return sum;
      const { s, e } = normalizedRange(row.start, row.end);
      return sum + Math.max(0, e - s);
    }, 0);
    return Math.round((minutes / 60) * 10) / 10;
  };

  const addTimelineEntry = (dayIdx) => {
    setDayPlans((prev) => {
      const target = prev[dayIdx];
      const start = target.newEntryStart;
      const end = target.newEntryEnd;
      const label = (target.newEntryLabel || "").trim();
      const type = target.newEntryType || "Other";

      if (!start || !end || !label) return prev;

      const s = toDayMinutes(start);
      const eRaw = toDayMinutes(end);
      const e = eRaw === 0 && s > 0 ? 1440 : eRaw;

      if (e <= s) return prev;
      if (hasOverlap(target.timeline, start, end)) return prev;

      const sortedTimeline = [...target.timeline, { start, end, label, type }]
        .sort((a, b) => toDayMinutes(a.start) - toDayMinutes(b.start));

      const updated = [...prev];
      updated[dayIdx] = {
        ...target,
        timeline: sortedTimeline,
        newEntryStart: "",
        newEntryEnd: "",
        newEntryLabel: "",
        newEntryType: "Other"
      };
      return updated;
    });
  };

  const removeTimelineEntry = (dayIdx, entryIdx) => {
    setDayPlans((prev) => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, timeline: d.timeline.filter((_, j) => j !== entryIdx) };
    }));
  };

  const nextStep = () => {
    const stepErrors = getStepErrors(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (currentStep === 2) {
      const built = buildItinerary();
      if (!built.ok) {
        setErrors({ allocatedDays: built.message });
        return;
      }
    }
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const resetAll = () => {
    setBase(defaultBase);
    setDestinations([defaultDestination()]);
    setLegPlans([]);
    setDayPlans([]);
    setCurrentStep(1);
    setErrors({});
  };

  const reportMarkup = useMemo(() => {
    if (!dayPlans.length || !legPlans.length) return "<p>Please complete previous steps first.</p>";

    const destinationSummary = destinations
      .map((d, i) => `<li>${i + 1}. ${d.location} - ${d.days} day(s), ${d.hotelStar}, ${d.sameHotelForAllDays ? d.hotelName : d.dayHotels.map(h => h.name).join(" | ")}</li>`)
      .join("");

    const legSummary = legPlans
      .map((l, i) => `<li>${i + 1}. ${l.from} -> ${l.to} (${l.when}) via ${l.transportMode}</li>`)
      .join("");

    const dailySummary = dayPlans
      .map((d) => {
        return `<li><strong>Day ${d.day} (${d.location})</strong>: Hotel ${d.hotelName} (${d.hotelStar}), arrival ${d.hotelArrivalTime || "-"}, notes: ${d.activities.notes || "-"}</li>`;
      })
      .join("");

    // ── Activity Emissions ──
    const activityEmission = dayPlans.reduce((total, day) => {
      return total + day.timeline.reduce((sum, entry) => {
        const s = toDayMinutes(entry.start);
        const eRaw = toDayMinutes(entry.end);
        const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
        const hours = (e - s) / 60;
        const factor = ACTIVITY_EMISSION_FACTORS[entry.type] ?? 0.1;
        return sum + (hours * factor * base.groupSize);
      }, 0);
    }, 0);

    // ── Hotel Emissions ──
    const hotelEmission = dayPlans.reduce((total, day) => {
      const factor = HOTEL_EMISSION_FACTORS[day.hotelStar] ?? 20;
      return total + (factor * base.groupSize);
    }, 0);

    // ── Activity Type Breakdown ──
    const activityTypeBreakdown = {};
    dayPlans.forEach((day) => {
      day.timeline.forEach((entry) => {
        const s = toDayMinutes(entry.start);
        const eRaw = toDayMinutes(entry.end);
        const e = eRaw === 0 && s > 0 ? 1440 : eRaw;
        const hours = (e - s) / 60;
        const factor = ACTIVITY_EMISSION_FACTORS[entry.type] ?? 0.1;
        const emission = hours * factor * base.groupSize;
        activityTypeBreakdown[entry.type] = (activityTypeBreakdown[entry.type] || 0) + emission;
      });
    });

    const totalExclTransport = activityEmission + hotelEmission;
    const perPerson = totalExclTransport / base.groupSize;

    return `
      <div class="report-section">
        <h3>Tourist Profile</h3>
        <ul>
          <li>Tourist Name: ${base.touristName || "-"}</li>
          <li>Email: ${base.touristEmail || "-"}</li>
          <li>Age: ${base.age}</li>
          <li>Country: ${base.country}</li>
          <li>Travel Type: ${base.travelMode === "solo" ? "Solo" : "Group"} | Group Size: ${base.groupSize}</li>
          <li>Total Days: ${base.totalDays}</li>
          ${base.tripNotes ? `<li>Trip Notes: ${base.tripNotes}</li>` : ""}
        </ul>
      </div>

      <div class="report-section">
        <h3>Trip Movement</h3>
        <ul>
          <li>Arrival: ${base.arrivalAirport} at ${formatDateTime(base.arrivalDateTime)}</li>
    <li>Departure: ${base.departureAirport} at ${formatDateTime(base.departureDateTime)}</li>
          <li>Rental Vehicle: ${base.isRental ? "Yes" : "No"} ${base.isRental ? `(${base.rentalVehicleType}, ${base.rentalPowerSource}, Driver: ${base.withDriver ? "Yes" : "No"})` : ""}</li>
        </ul>
      </div>

      <div class="report-section">
        <h3>Destination Plan</h3>
        <ul>${destinationSummary}</ul>
      </div>

      <div class="report-section">
        <h3>Travel Legs</h3>
        <ul>${legSummary}</ul>
      </div>

      <div class="report-section">
        <h3>Daily Summary</h3>
        <ul>${dailySummary}</ul>
      </div>

      ${dayPlans.map((d) => {
        const typeTotals = {};
        d.timeline.forEach((t) => {
          const { s, e } = normalizedRange(t.start, t.end);
          const hrs = (e - s) / 60;
          typeTotals[t.type] = (typeTotals[t.type] || 0) + hrs;
        });
        const summaryRows = Object.entries(typeTotals)
          .map(([type, hrs]) => `<tr><td>${type}</td><td>${Math.round(hrs * 10) / 10} hour(s)</td></tr>`)
          .join("");
        return `
          <div class="report-section">
            <h3>Day ${d.day}: ${d.location} (${d.hotelName} — ${d.hotelStar})</h3>
            <ul>
              <li>Hotel Arrival Time: ${d.hotelArrivalTime || "-"}</li>
              <li>Hotel Emission: ${(HOTEL_EMISSION_FACTORS[d.hotelStar] * base.groupSize).toFixed(2)} kg CO₂ (${d.hotelStar}, ${base.groupSize} person(s))</li>
              ${d.activities.notes ? `<li>Notes: ${d.activities.notes}</li>` : ""}
            </ul>
            <h4>Activities</h4>
            <table class="report-table">
              <thead><tr><th>Start</th><th>End</th><th>Duration</th><th>Activity</th><th>Type</th><th>Emission (kg CO₂)</th></tr></thead>
              <tbody>
                ${d.timeline.map((t) => {
                  const { s, e } = normalizedRange(t.start, t.end);
                  const hrs = Math.round(((e - s) / 60) * 10) / 10;
                  const factor = ACTIVITY_EMISSION_FACTORS[t.type] ?? 0.1;
                  const em = ((e - s) / 60 * factor * base.groupSize).toFixed(2);
                  return `<tr><td>${t.start}</td><td>${t.end}</td><td>${hrs}h</td><td>${t.label}</td><td>${t.type}</td><td>${em}</td></tr>`;
                }).join("") || `<tr><td colspan="6">No activities entered.</td></tr>`}
              </tbody>
            </table>
            <h4>Activity Type Summary</h4>
            <table class="report-table" style="max-width:300px">
              <thead><tr><th>Type</th><th>Total Hours</th></tr></thead>
              <tbody>${summaryRows || '<tr><td colspan="2">No activities.</td></tr>'}</tbody>
            </table>
          </div>`;
      }).join("")}

      <div class="report-section">
        <h3>Carbon Emission Summary</h3>
        <p style="font-size:0.82rem; color:#6b7c69; margin-bottom:12px;">
          Transport emissions calculated separately. Values below exclude travel legs.
        </p>
        <table class="report-table">
          <thead>
            <tr><th>Category</th><th>Emission (kg CO₂)</th></tr>
          </thead>
          <tbody>
            <tr><td>Activity Emissions (all days)</td><td>${activityEmission.toFixed(2)}</td></tr>
            <tr><td>Hotel Emissions (all nights)</td><td>${hotelEmission.toFixed(2)}</td></tr>
            <tr style="font-weight:600; background:#eaf7f0;">
              <td>Total (excl. transport)</td>
              <td>${totalExclTransport.toFixed(2)} kg CO₂</td>
            </tr>
            <tr style="font-weight:600;">
              <td>Per Person (excl. transport)</td>
              <td>${perPerson.toFixed(2)} kg CO₂</td>
            </tr>
          </tbody>
        </table>

        <h4 style="margin-top:14px;">Activity Type Emission Breakdown</h4>
        <table class="report-table" style="max-width:420px">
          <thead>
            <tr><th>Activity Type</th><th>Total Emission (kg CO₂)</th></tr>
          </thead>
          <tbody>
            ${Object.entries(activityTypeBreakdown).length > 0
              ? Object.entries(activityTypeBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, em]) => `<tr><td>${type}</td><td>${em.toFixed(2)}</td></tr>`)
                  .join("")
              : '<tr><td colspan="2">No activities recorded.</td></tr>'
            }
          </tbody>
        </table>
      </div>`;
  }, [base, dayPlans, destinations, legPlans]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-icon">C</div>
          <div>
            <h1>Carbon Footprint Calculator</h1>
            <p>Frontend intake system for travel agents (max 14 days)</p>
          </div>
        </div>
        <button className="btn btn-light" type="button" onClick={resetAll}>Reset Plan</button>
      </header>

      <main className="layout">
        <aside className="sidebar card">
          <h2>Trip Steps</h2>
          <ol id="step-indicator">
            {["Basic Trip Details", "Destinations & Hotels", "Travel & Daily Activities", "Final Report"].map((name, i) => {
              const step = i + 1;
              const cls = step === currentStep ? "active" : step < currentStep ? "done" : "";
              return <li key={name} className={cls}>{name}</li>;
            })}
          </ol>
        </aside>

        <section className="content card">
          {currentStep === 1 && (
            <StepOneTripDetails base={base} updateBase={updateBase} errors={errors} />
          )}
          {currentStep === 2 && (
            <StepTwoDestinations
              destinations={destinations}
              updateDestination={updateDestination}
              removeDestination={removeDestination}
              addDestination={addDestination}
              allocatedDays={allocatedDays}
              totalDays={base.totalDays}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <StepThreeItinerary
              base={base}
              legPlans={legPlans}
              setLegPlans={setLegPlans}
              dayPlans={dayPlans}
              setDayPlans={setDayPlans}
              availableVehicles={availableVehicles}
              addTimelineEntry={addTimelineEntry}
              removeTimelineEntry={removeTimelineEntry}
              errors={errors}
            />
          )}
          {currentStep === 4 && <StepFourReport reportMarkup={reportMarkup} />}

          <footer className="form-nav">
            <button className="btn btn-light" type="button" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} style={{ visibility: currentStep === 1 ? "hidden" : "visible" }}>
              Back
            </button>
            <button className="btn btn-primary" type="button" onClick={nextStep}>
              {currentStep === 4 ? "Regenerate Report" : "Next"}
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;