/**
 * Official NASA Human Research Program (HRP) — Risks of Human Spaceflight
 * Reference: https://www.nasa.gov/hrp/risks/
 */
export const HRP_RISKS = {
  SPACE_RADIATION: {
    id: 'HRP-RAD-01',
    shortLabel: 'Space Radiation',
    title: 'Risk of Space Radiation',
    category: 'Radiation',
    summary:
      'Ionizing radiation from solar particle events (SPEs) and galactic cosmic rays increases acute and degenerative tissue risk.',
    detail:
      'Outside Earth’s magnetosphere, crews face continuous galactic cosmic rays (GCRs) and sudden solar particle events (SPEs). Acute spikes can cause radiation sickness and impair mission tasks, while cumulative exposure elevates long-term cancer, CNS, and cardiovascular risk.',
    drivers: ['Proton flux / dose rate (mSv/day)', 'Cumulative mission dose', 'Shielding & EVA timing'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  CARDIO_ADAPTATIONS: {
    id: 'HRP-PHY-02',
    shortLabel: 'Cardiovascular Adaptations',
    title: 'Risk of Cardiovascular Adaptations',
    category: 'Physiology',
    summary:
      'Microgravity alters blood volume distribution, autonomic tone, and cardiac workload during long-duration flight.',
    detail:
      'Without gravity, plasma volume drops and fluid shifts toward the chest and head, reducing cardiac muscle mass and orthostatic tolerance. Elevated resting HR or falling HRV indicates autonomic strain, dehydration, or deconditioning.',
    drivers: ['Resting heart rate', 'HRV (RMSSD) recovery', 'Blood pressure & orthostatic index'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  BONE_CHANGES: {
    id: 'HRP-PHY-03',
    shortLabel: 'Spaceflight Bone Changes',
    title: 'Risk of Spaceflight-Induced Bone Changes',
    category: 'Physiology',
    summary:
      'Mechanical unloading accelerates bone mineral density loss unless countered with resistive exercise, Vitamin D3, and calcium.',
    detail:
      'In microgravity, weight-bearing bones lose 1–1.5% mineral density per month, raising fracture and renal stone risk. Daily ARED resistive loading plus Vitamin D3 and calcium supplementation are required to preserve skeletal strength.',
    drivers: ['DEXA BMD trend', 'ARED completion %', 'Vitamin D3 & Calcium intake'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  SANS: {
    id: 'HRP-PHY-04',
    shortLabel: 'SANS / Fluid Shift',
    title: 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    category: 'Physiology',
    summary:
      'Headward fluid shifts and elevated cabin CO₂ can raise intracranial/intraocular pressure and impair vision.',
    detail:
      'Microgravity shifts fluids cephalad, flattening the back of the eye and swelling the optic disc. Elevated cabin CO₂ further dilates cerebral vessels. Early screening via fluid-shift proxies and Amsler/visual checks protects crew vision.',
    drivers: ['Orthostatic / fluid-shift index', 'Cabin CO₂ (ppm)', 'Near-visual acuity & Amsler check'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  IMMUNE_RESPONSES: {
    id: 'HRP-PHY-05',
    shortLabel: 'Altered Immune Responses',
    title: 'Risk of Altered Immune System Responses',
    category: 'Physiology',
    summary:
      'Spaceflight stressors and closed-habitat air quality can dysregulate immunity and reactivate latent viruses.',
    detail:
      'Isolation, radiation, disrupted sleep, and trace cabin contaminants (VOCs) alter white-blood-cell signaling and can reactivate latent viruses (e.g., herpesviruses), producing rashes, respiratory irritation, or fatigue.',
    drivers: ['Self-reported symptom score', 'Cabin VOCs (ppb)', 'Sleep & stress load'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  EVA_ATMOSPHERE: {
    id: 'HRP-PHY-06',
    shortLabel: 'Closed-Env CO₂ & EVA',
    title: 'Risk of Compromised Performance from Spacewalks & Cabin Atmosphere',
    category: 'Physiology',
    summary:
      'Elevated cabin or suit CO₂ degrades cognitive vigilance, autonomic recovery, and safe EVA execution.',
    detail:
      'In closed habitats and spacesuits, CO₂ scrubber lag causes mild hypercapnia—manifesting as headaches, HRV suppression, and slower reaction speed before severe hypoxia occurs. High CO₂ places EVA and precision robotics on hold.',
    drivers: ['Cabin CO₂ (ppm)', 'HRV drop vs. baseline', 'PVT reaction slowing (ms)'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  INADEQUATE_SLEEP: {
    id: 'HRP-BEH-07',
    shortLabel: 'Inadequate Sleep & Circadian',
    title: 'Risk of Inadequate Sleep and Irregular Schedules',
    category: 'Behavioral',
    summary:
      'Circadian desynchrony and sleep loss degrade psychomotor vigilance, reaction speed, and operational safety.',
    detail:
      'Shifting mission timelines, noise, and altered light cues misalign the circadian pacemaker, cutting deep/REM sleep and slowing psychomotor vigilance (PVT)—raising error risk during docking and robotics.',
    drivers: ['Circadian alignment %', 'Total sleep hours', 'PVT reaction speed (ms)'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  BEHAVIORAL_CHANGES: {
    id: 'HRP-BEH-08',
    shortLabel: 'Behavioral & Isolation',
    title: 'Risk of Behavioral Changes and Psychiatric Disorders',
    category: 'Behavioral',
    summary:
      'Prolonged isolation, confinement, and distance from Earth can erode mood, sleep quality, and crew cohesion.',
    detail:
      'Deep-space missions introduce communication latency with Earth, confinement, and high workload. Tracking mood alongside sleep and cognitive speed helps catch behavioral fatigue early and trigger crew peer support.',
    drivers: ['Mood check-in score', 'Sleep duration', 'PVT cognitive vigilance'],
    url: 'https://www.nasa.gov/hrp/risks/',
  },
};

export const HRP_NOMINAL_REFERENCE = {
  id: 'HRP-NOM-00',
  shortLabel: 'All HRP Risks Monitored',
  title: 'NASA HRP Risk Monitoring Active',
  category: 'Nominal',
  summary:
    'Continuous edge screening active across NASA HRP Physiology, Behavioral Performance, and Space Radiation risks.',
  detail:
    'All monitored telemetry domains (cardiovascular, musculoskeletal, SANS fluid shift, cabin atmosphere, radiation, sleep, and behavioral health) are within individual Mars transit baselines.',
  drivers: ['Physiology', 'Behavioral Performance', 'Space Radiation'],
  url: 'https://www.nasa.gov/hrp/risks/',
};
