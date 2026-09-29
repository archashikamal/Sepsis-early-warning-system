/**
 * Clinical descriptions shown in the popup when a user clicks a vital name.
 */
export const VITAL_DESCRIPTIONS = {
  heartrate: {
    title: "Heart Rate (HR)",
    unit: "beats per minute (bpm)",
    normalRange: "60–100 bpm",
    description:
      "The number of times the heart beats per minute. An elevated heart rate (tachycardia) is one of the earliest signs of sepsis, as the body tries to compensate for falling blood pressure and oxygen delivery. Values above 90 bpm in a resting ICU patient are clinically significant.",
  },
  respiration: {
    title: "Respiratory Rate (RR)",
    unit: "breaths per minute",
    normalRange: "12–20 breaths/min",
    description:
      "How many breaths a patient takes each minute. Rapid breathing (tachypnea) occurs when the body tries to compensate for poor oxygen delivery. A rate above 22 is one of the formal qSOFA criteria for sepsis screening.",
  },
  temperature: {
    title: "Temperature (Temp)",
    unit: "degrees Celsius (°C)",
    normalRange: "36.1–37.2 °C",
    description:
      "Core body temperature. Sepsis classically causes fever (>38 °C), but severely ill patients can also become hypothermic (<36 °C), which carries a worse prognosis. Both extremes should raise concern in the ICU setting.",
  },
  sao2: {
    title: "Oxygen Saturation (SpO₂)",
    unit: "% (percent)",
    normalRange: "95–100 %",
    description:
      "Percentage of haemoglobin carrying oxygen, measured by a pulse oximeter. Values below 94 % indicate inadequate oxygenation and may require supplemental oxygen or ventilatory support.",
  },
  systemicsystolic: {
    title: "Systolic Blood Pressure (SysBP)",
    unit: "mmHg",
    normalRange: "90–140 mmHg",
    description:
      "Peak arterial pressure when the heart contracts. Septic shock is defined partly by systolic BP below 90 mmHg despite adequate fluids. Progressive hypotension in the 8-hour window is a strong predictor of deterioration.",
  },
  systemicdiastolic: {
    title: "Diastolic Blood Pressure (DiaBP)",
    unit: "mmHg",
    normalRange: "60–90 mmHg",
    description:
      "Arterial pressure when the heart rests between beats. A widening pulse pressure (large systolic-diastolic gap) can signal distributive shock, the most common form of septic shock.",
  },
  systemicmean: {
    title: "Mean Arterial Pressure (MAP)",
    unit: "mmHg",
    normalRange: "70–100 mmHg",
    description:
      "Average arterial pressure across one cardiac cycle — the true driving pressure for organ perfusion. Sepsis guidelines target MAP ≥ 65 mmHg; sustained values below this indicate end-organ hypoperfusion.",
  },
  lactate: {
    title: "Lactate",
    unit: "mmol/L",
    normalRange: "0.5–2.0 mmol/L",
    description:
      "A metabolic byproduct produced when cells switch to anaerobic metabolism due to insufficient oxygen. Elevated lactate (≥ 2 mmol/L) is a key biomarker of tissue hypoperfusion. Lactate > 4 mmol/L defines septic shock even without hypotension.",
  },
};

/**
 * Sample patient presets for the "Load Sample Patient" button.
 * Each preset contains 8 hourly rows of the 8 vital features, in order:
 *   heartrate, respiration, temperature, sao2,
 *   systemicsystolic, systemicdiastolic, systemicmean, lactate
 *
 * These are clinically plausible trajectories designed to trigger
 * clearly different model responses.
 */

export const FEATURE_COLS = [
  "heartrate",
  "respiration",
  "temperature",
  "sao2",
  "systemicsystolic",
  "systemicdiastolic",
  "systemicmean",
  "lactate",
];

export const FEATURE_LABELS = {
  heartrate:         "Heart Rate (bpm)",
  respiration:       "Resp Rate (/min)",
  temperature:       "Temp (°C)",
  sao2:              "SpO₂ (%)",
  systemicsystolic:  "Sys BP (mmHg)",
  systemicdiastolic: "Dia BP (mmHg)",
  systemicmean:      "MAP (mmHg)",
  lactate:           "Lactate (mmol/L)",
};

// Short column headers for the table
export const FEATURE_SHORT = {
  heartrate:         "HR",
  respiration:       "RR",
  temperature:       "Temp",
  sao2:              "SpO₂",
  systemicsystolic:  "SysBP",
  systemicdiastolic: "DiaBP",
  systemicmean:      "MAP",
  lactate:           "Lactate",
};

export const NORMAL_RANGES = {
  heartrate:         [60, 100],
  respiration:       [12, 20],
  temperature:       [36.1, 37.2],
  sao2:              [95, 100],
  systemicsystolic:  [90, 140],
  systemicdiastolic: [60, 90],
  systemicmean:      [70, 100],
  lactate:           [0.5, 2.0],
};

/**
 * Physiologically IMPOSSIBLE bounds — values outside these cannot exist in a living patient.
 * Submitting with any impossible value is blocked.
 */
export const ABSOLUTE_LIMITS = {
  heartrate:         [1,   350],   // bpm — asystole to extreme tachycardia
  respiration:       [0,   80],    // /min
  temperature:       [25,  45],    // °C — hypothermia to hyperpyrexia
  sao2:              [1,   100],   // % — cannot exceed 100
  systemicsystolic:  [40,  300],   // mmHg
  systemicdiastolic: [10,  200],   // mmHg
  systemicmean:      [20,  250],   // mmHg
  lactate:           [0.1, 30],    // mmol/L
};

/** Helper: create a row object from an array matching FEATURE_COLS order */
function row(...vals) {
  return Object.fromEntries(FEATURE_COLS.map((k, i) => [k, vals[i]]));
}

export const SAMPLE_PATIENTS = {
  septic_trending: {
    label: "Septic-Trending (High Risk)",
    description: "Progressive deterioration: rising HR/RR, climbing lactate, falling BP and SpO₂",
    readings: [
      // Hour 1-4 (baseline): mildly elevated but stable
      row(88,  18, 37.2, 96, 118, 74, 89,  1.4),
      row(92,  19, 37.5, 95, 115, 72, 87,  1.6),
      row(96,  20, 37.8, 94, 112, 70, 85,  1.9),
      row(101, 22, 38.1, 93, 108, 67, 82,  2.3),
      // Hour 5-8: rapid deterioration
      row(110, 24, 38.6, 91, 102, 62, 77,  2.9),
      row(118, 27, 38.9, 89,  96, 58, 72,  3.7),
      row(124, 30, 39.2, 87,  90, 54, 67,  4.6),
      row(130, 33, 39.5, 85,  84, 50, 62,  5.8),
    ],
  },
  stable: {
    label: "Stable (Low Risk)",
    description: "All vitals within normal range, minor fluctuations, low lactate",
    readings: [
      row(72,  14, 36.8, 98, 122, 78, 93,  0.9),
      row(74,  14, 36.9, 98, 120, 77, 92,  0.8),
      row(70,  15, 36.7, 99, 118, 76, 91,  0.9),
      row(71,  14, 36.8, 98, 121, 78, 93,  0.8),
      row(73,  15, 36.9, 98, 119, 77, 92,  0.9),
      row(72,  14, 36.8, 99, 120, 78, 93,  0.8),
      row(71,  15, 36.7, 98, 122, 79, 94,  0.9),
      row(73,  14, 36.8, 99, 121, 78, 93,  0.8),
    ],
  },
  early_recovery: {
    label: "Early Sepsis / Recovering",
    description: "Elevated baseline, partial improvement after hour 4 — moderate risk",
    readings: [
      // Hours 1-3: peak sepsis
      row(118, 26, 38.8, 90, 94, 58, 71, 4.1),
      row(122, 28, 39.0, 89, 92, 56, 69, 4.5),
      row(120, 27, 38.9, 90, 95, 59, 72, 4.2),
      // Hours 4-8: responding to treatment
      row(115, 25, 38.5, 91, 99, 62, 75, 3.6),
      row(108, 23, 38.2, 93, 104, 66, 80, 2.9),
      row(100, 21, 38.0, 94, 110, 70, 85, 2.3),
      row(95,  20, 37.8, 95, 114, 72, 87, 1.9),
      row(90,  18, 37.5, 96, 118, 75, 90, 1.6),
    ],
  },
};
