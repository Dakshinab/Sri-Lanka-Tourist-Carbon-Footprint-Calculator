# Sri Lanka Tourist Carbon Footprint Calculator

A frontend intake system for travel agents to record and calculate the carbon footprint of tourist trips across Sri Lanka. Built as a Final Year Project (FYP) using React and Vite.

---

## Overview

This application guides travel agents through a 4-step wizard to capture complete trip details for foreign tourists visiting Sri Lanka. It calculates carbon emissions from hotel stays and on-ground activities, while transport emissions are handled by a separate module.

The system supports solo and group travel, multi-destination itineraries of up to 14 days, per-day hotel selection, timed daily activity scheduling, and generates a downloadable PDF report.

---

## Features

- 4-step guided wizard interface
- Tourist profile and trip details intake
- Multi-destination planning with per-day hotel selection (3, 4, and 5-star)
- Timed daily activity scheduling with overlap detection
- Carbon emission calculation for activities and hotel stays
- Downloadable A4 PDF report with full emission breakdown
- Inline form validation with red border error indicators
- Days allocation progress bar with real-time feedback
- Duplicate destination warning
- Collapsible day cards and per-day hotel sections
- Color-coded activity timeline visual
- Fully responsive layout

---

## Project Structure

```
FYP/
├── index.html
├── package.json
├── styles.css
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── data.js
    └── components/
        ├── StepOneTripDetails.jsx
        ├── StepTwoDestinations.jsx
        ├── StepThreeItinerary.jsx
        └── StepFourReport.jsx
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool and dev server |
| Vanilla CSS | Styling (no CSS framework) |
| Google Fonts | DM Sans + Playfair Display |

No backend. No database. Pure frontend application.

---

## Getting Started

### Prerequisites

- Node.js v18 or v20 LTS — download from https://nodejs.org

### Installation

```bash
# Clone or extract the project
cd "FYP"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

---

## The 4-Step Wizard

### Step 1 — Basic Trip Details
Captures tourist profile (name, email, age, country), travel group info, arrival and departure airports with dates and times, and optional rental vehicle details. Total stay days are auto-calculated from the selected dates.

### Step 2 — Destinations and Hotels
Allows adding multiple Sri Lanka destinations in travel order. Each destination supports star category selection (3, 4, or 5-star), same hotel for all days or per-day hotel selection with individual star categories, and a stepper control for stay days. A sticky progress bar tracks day allocation in real time.

### Step 3 — Travel Legs and Daily Activities
Auto-generates travel legs between destinations based on the itinerary. For each day, the travel agent records the hotel arrival time and adds timed activities from a predefined list. Activities are validated for time overlap and displayed on a color-coded visual timeline.

### Step 4 — Final Report
Displays a complete trip summary including tourist profile, destination plan, travel legs, daily activity breakdowns, and a full carbon emission summary. The report can be downloaded and printed as an A4 PDF directly from the browser.

---

## Carbon Emission Calculation

Transport emissions (travel legs) are calculated by a separate module and are excluded from this system's output.

This system calculates:

**Activity Emissions**
```
emission (kg CO₂) = duration_hours × emission_factor × group_size
```

**Hotel Emissions**
```
emission (kg CO₂) = hotel_factor × group_size   (per night)
```

### Activity Emission Factors (kg CO₂ per person per hour)

| Activity | Factor | Basis |
|---|---|---|
| Meal | 1.500 | Food consumption and kitchen energy |
| Resting | 0.050 | Hotel electricity baseline |
| Walking | 0.008 | Food supply chain (extra calorie burn) |
| Jogging | 0.025 | Higher calorie burn, food supply chain |
| Hiking | 0.030 | High exertion, food supply chain |
| Bicycle Ride | 0.010 | Moderate effort, food supply chain |
| Swimming / Snorkeling | 0.050 | Physical effort and equipment |
| Surfing | 0.050 | Physical effort and equipment |
| Boat Ride | 0.240 | Motor boat fuel consumption |
| Beach Leisure | 0.050 | Minimal facility use |
| Wildlife Safari | 0.800 | Safari jeep fuel consumption |
| Cultural / Temple Visit | 0.100 | Site electricity and facilities |
| Sightseeing | 0.100 | Site facilities |
| Shopping | 0.300 | Retail energy consumption |
| Spa / Ayurveda | 0.400 | Hot water, electricity, products |
| Public Transport | 0.080 | Bus and train emissions per hour |
| Private / Hired Vehicle | 0.550 | Fuel consumption per hour |
| Airport Transfer | 0.550 | Same as private vehicle |
| Medical / Hospital Visit | 0.500 | Hospital energy consumption |
| Other | 0.100 | Default estimate |

### Hotel Emission Factors (kg CO₂ per person per night)

| Star Category | Factor |
|---|---|
| 3-star | 20 |
| 4-star | 35 |
| 5-star | 60 |

Sources: IPCC AR6 Report, DEFRA UK Emission Factors, IEA Hotel Energy Consumption Report.

To update emission factors, edit the `ACTIVITY_EMISSION_FACTORS` and `HOTEL_EMISSION_FACTORS` objects in `src/data.js`.

---

## Supported Locations

20 Sri Lanka destinations are supported:

Colombo, Kandy, Galle, Ella, Nuwara Eliya, Sigiriya, Bentota, Anuradhapura, Yala, Arugam Bay, Trincomalee, Jaffna, Mirissa, Hikkaduwa, Negombo, Dambulla, Polonnaruwa, Kalpitiya, Haputale, Badulla.

Each location includes 5 hotels per star category (3, 4, and 5-star).

---

## Activity Types

20 activity types are supported for daily scheduling:

Meal, Resting, Walking, Jogging, Hiking, Bicycle Ride, Swimming / Snorkeling, Surfing, Boat Ride, Beach Leisure, Wildlife Safari, Cultural / Temple Visit, Sightseeing, Shopping, Spa / Ayurveda, Public Transport, Private / Hired Vehicle, Airport Transfer, Medical / Hospital Visit, Other.

---

## Trip Constraints

| Parameter | Limit |
|---|---|
| Maximum trip duration | 14 days |
| Maximum group size | 45 persons |
| Maximum tourist age | 75 years |
| Maximum destinations | Unlimited |
| Maximum activities per day | Unlimited (overlap checked) |
| Supported airports | CMB, HRI, JAF |

---

## Notes

- Transport emissions for travel legs are excluded from this system and are handled by a separate developer module.
- Emission factors are stored in `src/data.js` and can be updated by the project supervisor without modifying application logic.
- The PDF report is generated via the browser print dialog and requires no external library.
- Sri Lanka is excluded from the tourist country of origin list as this system targets foreign tourists only.

---

## Author

**Dakshina Dissanayake**
Final Year Project — Faculty of Information Technology
Horizon Campus