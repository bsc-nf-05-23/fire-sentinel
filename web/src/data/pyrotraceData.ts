export type NavView =
  | 'live-situation-map'
  | 'alerts-village-relay'
  | 'scenario-validation'
  | 'data-postgis-api';

export type EventKey = 'zomba' | 'nyika' | 'dzalanyama';
export type ScenarioKey = 'std' | 'fast' | 'slow';
export type VillageKey = 'chisi' | 'domasi' | 'mulunguzi' | 'songani' | 'chingwe';

export const ZOMBA_TERRAIN_IMAGE =
  '/images/zomba-plateau-terrain.jpg';

export interface IncidentEvent {
  key: EventKey;
  code: string;
  label: string;
  shortTitle: string;
  reserveName: string;
  reserveBoundaryLabel: string;
  ridgeTitle: string;
  detectedUtc: string;
  spreadDirection: string;
  baseBurnAreaHa: number;
  burnRateHaPerHour: number;
  frontVelocityKmh: number;
  maxGustKmh: number;
  windSpeedKmh: number;
  windAzimuthDeg: number;
  windDirLabel: string;
  humidityPct: number;
  nearestVillage: string;
  nearestDistanceLabel: string;
  centerCoords: string;
  replayEpoch: string;
  originLabel: string;
  sridLabel: string;
  viirsOrbitLabel: string;
  settlements: {
    name: string;
    etaLabel: string;
    x: number;
    y: number;
    status: 'safe' | 'warning';
  }[];
  scenarios: Record<
    ScenarioKey,
    {
      iouPct: number;
      iouDelta: string;
      diceCoeff: number;
      falseAlarmPct: number;
      timeErrorMin: number;
      overPredPct: number;
      underPredPct: number;
      truePosHa: number;
      falsePosHa: number;
      falseNegHa: number;
      trueNegHa: number;
      totalFootprintHa: number;
      forecastScale: number;
    }
  >;
}

export const INCIDENT_EVENTS: Record<EventKey, IncidentEvent> = {
  zomba: {
    key: 'zomba',
    code: 'EVT-2025-ZOMBA-09',
    label: 'Zomba Plateau Reserve (Sept 2025 - Historical Replay)',
    shortTitle: 'Zomba Plateau (Sept 2025)',
    reserveName: 'Zomba Forest Reserve',
    reserveBoundaryLabel: 'ZOMBA FOREST RESERVE // EPSG:4326 BOUNDARY',
    ridgeTitle: 'Zomba Plateau Ridge Crest',
    detectedUtc: 'Detected 14:20 UTC · Active ENE Spread',
    spreadDirection: 'ENE',
    baseBurnAreaHa: 142.6,
    burnRateHaPerHour: 18.4,
    frontVelocityKmh: 0.85,
    maxGustKmh: 1.4,
    windSpeedKmh: 18,
    windAzimuthDeg: 68,
    windDirLabel: 'ENE (68°)',
    humidityPct: 19,
    nearestVillage: 'Chisi Village',
    nearestDistanceLabel: '2.4 km (ENE)',
    centerCoords: '15°21\'48"S 35°18\'24"E',
    replayEpoch: '2025-09-14 14:00 CAT',
    originLabel: "ORIGIN: CHINGWE'S HOLE",
    sridLabel: 'EPSG:32736 (UTM 36S)',
    viirsOrbitLabel: 'VIIRS S-NPP Orbit 63821 (375m Active Fire Scar)',
    settlements: [
      {
        name: 'Malosa Settlement',
        etaLabel: 'ETA: T+11.4h [ST_DWithin: 1.4km]',
        x: 485,
        y: 140,
        status: 'warning',
      },
      {
        name: 'Domasi Mission',
        etaLabel: 'ETA: T+18.2h [Safe Envelope]',
        x: 530,
        y: 310,
        status: 'safe',
      },
    ],
    scenarios: {
      std: {
        iouPct: 84.2,
        iouDelta: '↑ +3.1% vs baseline',
        diceCoeff: 0.914,
        falseAlarmPct: 6.4,
        timeErrorMin: 18,
        overPredPct: 12.4,
        underPredPct: 5.8,
        truePosHa: 1802,
        falsePosHa: 137,
        falseNegHa: 124,
        trueNegHa: 14920,
        totalFootprintHa: 2140,
        forecastScale: 1.0,
      },
      fast: {
        iouPct: 79.6,
        iouDelta: '↓ -1.5% gust spread',
        diceCoeff: 0.886,
        falseAlarmPct: 11.8,
        timeErrorMin: 12,
        overPredPct: 19.2,
        underPredPct: 2.1,
        truePosHa: 1889,
        falsePosHa: 278,
        falseNegHa: 37,
        trueNegHa: 14779,
        totalFootprintHa: 2204,
        forecastScale: 1.18,
      },
      slow: {
        iouPct: 76.4,
        iouDelta: '↓ -4.7% dampened',
        diceCoeff: 0.866,
        falseAlarmPct: 3.1,
        timeErrorMin: 29,
        overPredPct: 4.5,
        underPredPct: 14.2,
        truePosHa: 1622,
        falsePosHa: 64,
        falseNegHa: 304,
        trueNegHa: 14993,
        totalFootprintHa: 1990,
        forecastScale: 0.84,
      },
    },
  },
  nyika: {
    key: 'nyika',
    code: 'EVT-2024-NYIKA-08',
    label: 'Nyika National Park (Aug 2024 - Benchmark Run)',
    shortTitle: 'Nyika Plateau (Aug 2024)',
    reserveName: 'Nyika National Park',
    reserveBoundaryLabel: 'NYIKA NATIONAL PARK // EPSG:4326 BOUNDARY',
    ridgeTitle: 'Chelinda Escarpment Grassland',
    detectedUtc: 'Detected 11:05 UTC · Active ESE Spread',
    spreadDirection: 'ESE',
    baseBurnAreaHa: 318.4,
    burnRateHaPerHour: 29.5,
    frontVelocityKmh: 1.25,
    maxGustKmh: 2.1,
    windSpeedKmh: 26,
    windAzimuthDeg: 108,
    windDirLabel: 'ESE (108°)',
    humidityPct: 22,
    nearestVillage: 'Chelinda Camp',
    nearestDistanceLabel: '3.1 km (ESE)',
    centerCoords: '10°35\'12"S 33°48\'06"E',
    replayEpoch: '2024-08-21 11:00 CAT',
    originLabel: 'ORIGIN: NGANDA RIDGE',
    sridLabel: 'EPSG:32736 (UTM 36S)',
    viirsOrbitLabel: 'VIIRS NOAA-20 Orbit 34910 (375m Montane Scar)',
    settlements: [
      {
        name: 'Chelinda Outpost',
        etaLabel: 'ETA: T+06.8h [ST_DWithin: 2.1km]',
        x: 475,
        y: 165,
        status: 'warning',
      },
      {
        name: 'Kasomba Gate',
        etaLabel: 'ETA: T+15.4h [Buffer Monitored]',
        x: 535,
        y: 295,
        status: 'safe',
      },
    ],
    scenarios: {
      std: {
        iouPct: 86.7,
        iouDelta: '↑ +4.8% vs baseline',
        diceCoeff: 0.928,
        falseAlarmPct: 5.2,
        timeErrorMin: 14,
        truePosHa: 2410,
        overPredPct: 9.8,
        underPredPct: 4.3,
        falsePosHa: 142,
        falseNegHa: 118,
        trueNegHa: 18420,
        totalFootprintHa: 2670,
        forecastScale: 1.02,
      },
      fast: {
        iouPct: 81.4,
        iouDelta: '↓ -0.5% gust variance',
        diceCoeff: 0.897,
        falseAlarmPct: 10.1,
        timeErrorMin: 11,
        overPredPct: 16.4,
        underPredPct: 1.9,
        truePosHa: 2495,
        falsePosHa: 290,
        falseNegHa: 33,
        trueNegHa: 18272,
        totalFootprintHa: 2818,
        forecastScale: 1.2,
      },
      slow: {
        iouPct: 78.1,
        iouDelta: '↓ -3.8% moisture cap',
        diceCoeff: 0.877,
        falseAlarmPct: 2.8,
        timeErrorMin: 24,
        overPredPct: 3.9,
        underPredPct: 12.1,
        truePosHa: 2180,
        falsePosHa: 74,
        falseNegHa: 348,
        trueNegHa: 18488,
        totalFootprintHa: 2602,
        forecastScale: 0.86,
      },
    },
  },
  dzalanyama: {
    key: 'dzalanyama',
    code: 'EVT-2023-DZAL-10',
    label: 'Dzalanyama Forest Reserve (Oct 2023 - Post-Fire Assessment)',
    shortTitle: 'Dzalanyama (Oct 2023)',
    reserveName: 'Dzalanyama Forest Reserve',
    reserveBoundaryLabel: 'DZALANYAMA FOREST // EPSG:4326 BOUNDARY',
    ridgeTitle: 'Chongoni Miombo Watershed',
    detectedUtc: 'Detected 13:45 UTC · Active NE Spread',
    spreadDirection: 'NE',
    baseBurnAreaHa: 194.2,
    burnRateHaPerHour: 14.2,
    frontVelocityKmh: 0.68,
    maxGustKmh: 1.15,
    windSpeedKmh: 14,
    windAzimuthDeg: 45,
    windDirLabel: 'NE (45°)',
    humidityPct: 24,
    nearestVillage: 'Kaphatenga',
    nearestDistanceLabel: '2.9 km (NE)',
    centerCoords: '14°18\'30"S 33°28\'50"E',
    replayEpoch: '2023-10-08 13:30 CAT',
    originLabel: 'ORIGIN: LILONGWE HEADWATERS',
    sridLabel: 'EPSG:32736 (UTM 36S)',
    viirsOrbitLabel: 'MODIS Aqua/Terra + VIIRS 375m Composite',
    settlements: [
      {
        name: 'Kaphatenga Cluster',
        etaLabel: 'ETA: T+10.2h [ST_DWithin: 1.9km]',
        x: 495,
        y: 150,
        status: 'warning',
      },
      {
        name: 'Malingunde Station',
        etaLabel: 'ETA: T+19.5h [Safe Envelope]',
        x: 540,
        y: 325,
        status: 'safe',
      },
    ],
    scenarios: {
      std: {
        iouPct: 81.9,
        iouDelta: '↑ +2.4% canopy match',
        diceCoeff: 0.901,
        falseAlarmPct: 7.5,
        timeErrorMin: 21,
        overPredPct: 13.1,
        underPredPct: 6.4,
        truePosHa: 1490,
        falsePosHa: 128,
        falseNegHa: 112,
        trueNegHa: 12650,
        totalFootprintHa: 1730,
        forecastScale: 0.98,
      },
      fast: {
        iouPct: 77.2,
        iouDelta: '↓ -2.3% crown jump',
        diceCoeff: 0.871,
        falseAlarmPct: 12.9,
        timeErrorMin: 16,
        overPredPct: 21.0,
        underPredPct: 2.8,
        truePosHa: 1554,
        falsePosHa: 240,
        falseNegHa: 48,
        trueNegHa: 12538,
        totalFootprintHa: 1842,
        forecastScale: 1.15,
      },
      slow: {
        iouPct: 74.8,
        iouDelta: '↓ -4.7% litter damp',
        diceCoeff: 0.855,
        falseAlarmPct: 3.9,
        timeErrorMin: 31,
        overPredPct: 5.1,
        underPredPct: 15.8,
        truePosHa: 1348,
        falsePosHa: 62,
        falseNegHa: 254,
        trueNegHa: 12716,
        totalFootprintHa: 1664,
        forecastScale: 0.82,
      },
    },
  },
};

export interface FirmsHotspot {
  id: string;
  sensor: 'VIIRS' | 'MODIS';
  confidence: number;
  frpMw: number;
  brightnessK: number;
  x: number;
  y: number;
  appearAtHour: number;
  acquiredUtc: string;
  coords: string;
}

export const FIRMS_HOTSPOTS: FirmsHotspot[] = [
  {
    id: 'FIRMS-V-101',
    sensor: 'VIIRS',
    confidence: 94,
    frpMw: 48.2,
    brightnessK: 348.5,
    x: 540,
    y: 360,
    appearAtHour: 0,
    acquiredUtc: '14:20 UTC',
    coords: '-15.3712°, 35.2914°',
  },
  {
    id: 'FIRMS-M-102',
    sensor: 'MODIS',
    confidence: 76,
    frpMw: 31.6,
    brightnessK: 334.1,
    x: 565,
    y: 375,
    appearAtHour: 1.5,
    acquiredUtc: '15:10 UTC',
    coords: '-15.3738°, 35.2970°',
  },
  {
    id: 'FIRMS-V-103',
    sensor: 'VIIRS',
    confidence: 91,
    frpMw: 62.9,
    brightnessK: 356.8,
    x: 585,
    y: 395,
    appearAtHour: 3,
    acquiredUtc: '16:05 UTC',
    coords: '-15.3755°, 35.3022°',
  },
  {
    id: 'FIRMS-V-104',
    sensor: 'VIIRS',
    confidence: 98,
    frpMw: 84.4,
    brightnessK: 369.2,
    x: 615,
    y: 410,
    appearAtHour: 4.5,
    acquiredUtc: '17:45 UTC',
    coords: '-15.3771°, 35.3095°',
  },
  {
    id: 'FIRMS-M-105',
    sensor: 'MODIS',
    confidence: 72,
    frpMw: 27.8,
    brightnessK: 329.4,
    x: 640,
    y: 435,
    appearAtHour: 6,
    acquiredUtc: '19:15 UTC',
    coords: '-15.3790°, 35.3140°',
  },
  {
    id: 'FIRMS-V-106',
    sensor: 'VIIRS',
    confidence: 86,
    frpMw: 53.1,
    brightnessK: 344.9,
    x: 670,
    y: 445,
    appearAtHour: 8,
    acquiredUtc: '20:40 UTC',
    coords: '-15.3802°, 35.3188°',
  },
];

export interface VillageRelayRecord {
  key: VillageKey;
  name: string;
  mapLabel: string;
  sectorCode: string;
  sectorLabel: string;
  status: 'Critical Warning' | 'Elevated Watch' | 'Monitoring';
  mapStatus: 'WARNING' | 'WATCH';
  pop: string;
  popNumeric: number;
  dist: string;
  mapDist: string;
  window: string;
  etaShort: string;
  elev: string;
  head: string;
  phone: string;
  lat: string;
  lon: string;
  evacRoute: string;
  intersectUtc: string;
  mapX: number;
  mapY: number;
  bufferRadius: number;
  warningMsg: string;
  watchMsg: string;
}

export const VILLAGE_RELAY_RECORDS: VillageRelayRecord[] = [
  {
    key: 'chisi',
    name: 'Chisi Village',
    mapLabel: 'Chisi Village',
    sectorCode: 'SEC-EAST-01',
    sectorLabel: 'Sector East',
    status: 'Critical Warning',
    mapStatus: 'WARNING',
    pop: '1,240',
    popNumeric: 1240,
    dist: '1.4 km',
    mapDist: '2.4 km',
    window: '1.2h – 2.5h',
    etaShort: '1.5h',
    elev: '1,420m',
    head: 'Chief Malemia',
    phone: '+265 88 412 9091',
    lat: '-15.3781°',
    lon: '35.3210°',
    evacRoute: 'Track B (Songani Pass)',
    intersectUtc: 'INTERSECT 16:30 UTC',
    mapX: 860,
    mapY: 530,
    bufferRadius: 48,
    warningMsg:
      'ALERT [ZOMBA-09]: PyroTrace model predicts fire arrival between 16:30 and 17:45 UTC (Window: 1.2h-2.5h). Winds ENE 18km/h. Chief Malemia / Village Focal Contact: initiate Community Evacuation Route B toward Songani immediately.',
    watchMsg:
      'ADVISORY [ZOMBA-09]: PyroTrace fire spread model flags active plume approaching Chisi Village sector within 3 hours. Assemble livestock, clear brush perimeters, stand by on VHF Channel 7.',
  },
  {
    key: 'domasi',
    name: 'Domasi Slope Settlement',
    mapLabel: 'Likangala',
    sectorCode: 'SEC-NE-04',
    sectorLabel: 'Sector NE',
    status: 'Critical Warning',
    mapStatus: 'WARNING',
    pop: '910',
    popNumeric: 910,
    dist: '2.1 km',
    mapDist: '3.7 km',
    window: '1.8h – 3.2h',
    etaShort: '2.1h',
    elev: '1,310m',
    head: 'Headman Mponda',
    phone: '+265 99 203 4412',
    lat: '-15.3620°',
    lon: '35.3340°',
    evacRoute: 'M3 Highway Corridor',
    intersectUtc: 'INTERSECT 17:15 UTC',
    mapX: 940,
    mapY: 410,
    bufferRadius: 38,
    warningMsg:
      'ALERT [ZOMBA-09]: PyroTrace forecast predicts fire front crossing Domasi Ridge at 17:15 UTC. Headman Mponda: Evacuate residents along Ridge Road downhill to Domasi College Ground.',
    watchMsg:
      'ADVISORY [ZOMBA-09]: Smoke and ember drift warning for Domasi Slope. Monitor winds and clear firebreaks along eastern compound line.',
  },
  {
    key: 'mulunguzi',
    name: 'Mulunguzi Valley Core',
    mapLabel: 'Mulunguzi',
    sectorCode: 'SEC-SOUTH-02',
    sectorLabel: 'Sector South',
    status: 'Elevated Watch',
    mapStatus: 'WATCH',
    pop: '1,120',
    popNumeric: 1120,
    dist: '3.8 km',
    mapDist: '4.9 km',
    window: '3.5h – 5.0h',
    etaShort: '2.8h',
    elev: '1,550m',
    head: 'B. Kalonga (VDC)',
    phone: '+265 88 119 5504',
    lat: '-15.3910°',
    lon: '35.3050°',
    evacRoute: 'Dam Access Road West',
    intersectUtc: 'INTERSECT 19:00 UTC',
    mapX: 730,
    mapY: 690,
    bufferRadius: 32,
    warningMsg:
      'ALERT [ZOMBA-09]: Fire breach expected across upper Mulunguzi ridge by 19:00 UTC. Evacuate dam maintenance workers and lower valley cottages.',
    watchMsg:
      'ADVISORY [ZOMBA-09]: Mulunguzi catchment on elevated watch. Maintain emergency water pumping stations and monitor VHF CH-7.',
  },
  {
    key: 'songani',
    name: 'Songani Foothills',
    mapLabel: 'Songani North',
    sectorCode: 'SEC-NW-08',
    sectorLabel: 'Sector NW',
    status: 'Elevated Watch',
    mapStatus: 'WATCH',
    pop: '680',
    popNumeric: 680,
    dist: '4.9 km',
    mapDist: '5.8 km',
    window: '4.2h – 6.0h',
    etaShort: '3.5h',
    elev: '1,180m',
    head: 'GVH Songani',
    phone: '+265 99 710 3389',
    lat: '-15.3490°',
    lon: '35.2980°',
    evacRoute: 'Songani Market Spur',
    intersectUtc: 'INTERSECT 20:10 UTC',
    mapX: 1010,
    mapY: 290,
    bufferRadius: 30,
    warningMsg:
      'ALERT [ZOMBA-09]: High wind divergence threatening northern Songani tree line. Standby for immediate evacuation order.',
    watchMsg:
      'ADVISORY [ZOMBA-09]: Elevated fire watch active for Songani Foothills. Restrict agricultural burning and ready water bowsers.',
  },
  {
    key: 'chingwe',
    name: 'Chingwe Outpost Cluster',
    mapLabel: 'Chingwe Outpost',
    sectorCode: 'SEC-WEST-03',
    sectorLabel: 'Sector West',
    status: 'Monitoring',
    mapStatus: 'WATCH',
    pop: '330',
    popNumeric: 330,
    dist: '7.2 km',
    mapDist: '7.2 km',
    window: '7.0h – 11.5h',
    etaShort: '7.0h',
    elev: '1,820m',
    head: 'Ranger T. Chirwa',
    phone: '+265 88 644 1120',
    lat: '-15.3655°',
    lon: '35.2750°',
    evacRoute: 'Plateau Escarpment Track',
    intersectUtc: 'INTERSECT 22:45 UTC',
    mapX: 390,
    mapY: 360,
    bufferRadius: 26,
    warningMsg:
      'ALERT [ZOMBA-09]: Escarpment ridge fire line approaching Chingwe outpost. Evacuate park staff and visitors immediately.',
    watchMsg:
      'ADVISORY [ZOMBA-09]: Monitoring status at Chingwe. Visibility reduced to 800m due to inversion layer smoke.',
  },
];

export interface DispatchLogEntry {
  id: string;
  timestampUtc: string;
  relayCode: string;
  title: string;
  deliverySummary: string;
  ackLabel: string;
  severity: 'cyan' | 'orange';
}

export const INITIAL_DISPATCH_LOGS: DispatchLogEntry[] = [
  {
    id: 'log-1',
    timestampUtc: '15:42:10 UTC',
    relayCode: 'RELAY-0921',
    title: 'Domasi Slope Warning',
    deliverySummary: 'DELIVERED (48/50 SMS)',
    ackLabel: 'ACK: 4 mins',
    severity: 'cyan',
  },
  {
    id: 'log-2',
    timestampUtc: '14:15:02 UTC',
    relayCode: 'RELAY-0918',
    title: 'Forestry Camp Watch Alert',
    deliverySummary: 'DELIVERED (12/12 SMS)',
    ackLabel: 'ACK: 1 min',
    severity: 'cyan',
  },
  {
    id: 'log-3',
    timestampUtc: '13:02:44 UTC',
    relayCode: 'RELAY-0912',
    title: 'Regional Broad Notice VHF',
    deliverySummary: 'BROADCAST OK',
    ackLabel: 'VHF CH-7 Active',
    severity: 'orange',
  },
];

export interface ApiEndpointSpec {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  latencyMs: number;
  params: string;
  sampleResponse: object;
}

export const POSTGIS_API_ENDPOINTS: ApiEndpointSpec[] = [
  {
    id: 'firms-hotspots',
    method: 'GET',
    path: '/api/v2/firms/hotspots',
    summary: 'Streams clustered NASA FIRMS VIIRS/MODIS active fire detections within reserve bounding box.',
    latencyMs: 14,
    params: '?event_id=EVT-2025-ZOMBA-09&min_conf=70&srid=4326',
    sampleResponse: {
      event_id: 'EVT-2025-ZOMBA-09',
      srid: 4326,
      cluster_method: 'ST_ClusterDBSCAN(eps := 0.008, minpoints := 2)',
      count: 6,
      features: [
        {
          id: 'FIRMS-V-104',
          sensor: 'VIIRS_SNPP',
          confidence: 98,
          frp_mw: 84.4,
          coordinates: [35.3095, -15.3771],
          acquired_utc: '2025-09-14T17:45:00Z',
        },
        {
          id: 'FIRMS-V-103',
          sensor: 'VIIRS_SNPP',
          confidence: 91,
          frp_mw: 62.9,
          coordinates: [35.3022, -15.3755],
          acquired_utc: '2025-09-14T16:05:00Z',
        },
      ],
    },
  },
  {
    id: 'villages-intersects',
    method: 'GET',
    path: '/api/v2/villages/intersects',
    summary: 'Executes PostGIS ST_DWithin & ST_Intersects against 250m settlement buffers and spread ellipses.',
    latencyMs: 18,
    params: '?event_id=EVT-2025-ZOMBA-09&buffer_m=250&limit=5',
    sampleResponse: {
      query_engine: 'PostGIS 3.4.2 / GEOS 3.12',
      execution_ms: 18.4,
      intersected_count: 5,
      total_evacuees_est: 4280,
      settlements: [
        {
          gid: 401,
          name: 'Chisi Village',
          sector: 'SEC-EAST-01',
          dist_m: 1412.6,
          eta_window_h: [1.2, 2.5],
          urgency: 'CRITICAL_WARNING',
        },
        {
          gid: 404,
          name: 'Domasi Slope Settlement',
          sector: 'SEC-NE-04',
          dist_m: 2104.2,
          eta_window_h: [1.8, 3.2],
          urgency: 'CRITICAL_WARNING',
        },
      ],
    },
  },
  {
    id: 'spread-simulate',
    method: 'POST',
    path: '/api/v2/spread/simulate',
    summary: 'Runs Rothermel (1972) Albini-BehavePlus cellular spread solver over 30m SRTM-GL1 DEM.',
    latencyMs: 42,
    params: '{ "fuel_model": "FM4", "slope_factor": 1.45, "moisture_1h": 7.2, "wind_kmh": 18 }',
    sampleResponse: {
      run_id: 'SIM-2025-09-ZOMBA-v4',
      solver: 'Rothermel-Albini Cellular Automata',
      dem_source: 'SRTM-GL1 30m (EPSG:32736)',
      rate_of_spread_kmh: 0.85,
      max_flank_kmh: 1.4,
      isochrones_generated: [1, 3, 6, 12, 18],
      est_burn_area_ha: 142.6,
    },
  },
  {
    id: 'alerts-dispatch',
    method: 'POST',
    path: '/api/alerts',
    summary: 'Dispatches emergency SMS, USSD flash push, and VHF forestry station notifications.',
    latencyMs: 64,
    params: '{ "village_key": "chisi", "protocol": "WARNING", "gateways": ["airtel_mw", "tnm", "vhf_ch7"] }',
    sampleResponse: {
      status: 201,
      relay_id: 'RELAY-0924',
      target: 'Chisi Village',
      recipients_queued: 3,
      gateways: ['Airtel MW', 'TNM GSM', 'VHF CH-07'],
      ussd_flash_ready: true,
      dispatched_utc: '2025-09-14T15:58:12Z',
    },
  },
  {
    id: 'validation-matrix',
    method: 'GET',
    path: '/api/v2/validation/confusion-matrix',
    summary: 'Computes IoU / Jaccard, Sørensen-Dice, and over/under-prediction hectares against VIIRS ground scars.',
    latencyMs: 28,
    params: '?event_id=EVT-2025-ZOMBA-09&scenario=std&timestep_h=8',
    sampleResponse: {
      event_id: 'EVT-2025-ZOMBA-09',
      timestep_h: 8,
      iou_jaccard: 0.842,
      dice_coefficient: 0.914,
      false_alarm_ratio: 0.064,
      arrival_time_rmse_min: 18,
      confusion_ha: {
        true_positive: 1802,
        false_positive: 137,
        false_negative: 124,
        true_negative: 14920,
      },
    },
  },
];

export interface SqlPreset {
  id: string;
  label: string;
  executionMs: number;
  sql: string;
  columns: string[];
  rows: (string | number)[][];
}

export const POSTGIS_SQL_PRESETS: SqlPreset[] = [
  {
    id: 'intersects',
    label: 'ST_Intersects Village Buffer',
    executionMs: 18.4,
    sql: `SELECT v.gid, v.name, v.pop_2024,
       ROUND((ST_Distance(v.geom::geography, f.fire_front::geography) / 1000.0)::numeric, 2) AS dist_km,
       calc_spread_window(v.geom, f.rate_of_spread, f.wind_azimuth) AS eta_window
FROM tbl_villages v
JOIN tbl_fire_isochrones f
  ON ST_Intersects(f.spread_polygon_3h, ST_Buffer(v.geom::geography, 250)::geometry)
WHERE f.event_id = 'EVT-2025-ZOMBA-09'
ORDER BY dist_km ASC LIMIT 5;`,
    columns: ['gid', 'name', 'pop_2024', 'dist_km', 'eta_window'],
    rows: [
      [401, 'Chisi Village', 1240, 1.41, '1.2h - 2.5h'],
      [404, 'Domasi Slope Settlement', 910, 2.10, '1.8h - 3.2h'],
      [407, 'Mulunguzi Valley Core', 1120, 3.82, '3.5h - 5.0h'],
      [411, 'Songani Foothills', 680, 4.91, '4.2h - 6.0h'],
      [419, 'Chingwe Outpost Cluster', 330, 7.20, '7.0h - 11.5h'],
    ],
  },
  {
    id: 'dbscan',
    label: 'VIIRS ST_ClusterDBSCAN',
    executionMs: 11.2,
    sql: `SELECT ST_ClusterDBSCAN(geom, eps := 0.008, minpoints := 2) OVER () AS cluster_id,
       sensor, COUNT(*) AS detections, ROUND(AVG(frp_mw)::numeric, 1) AS mean_frp_mw,
       MAX(confidence) AS max_conf
FROM tbl_firms_detections
WHERE event_id = 'EVT-2025-ZOMBA-09' AND confidence >= 70
GROUP BY cluster_id, sensor
ORDER BY mean_frp_mw DESC;`,
    columns: ['cluster_id', 'sensor', 'detections', 'mean_frp_mw', 'max_conf'],
    rows: [
      [0, 'VIIRS_SNPP', 4, 62.2, 98],
      [0, 'MODIS_TERRA', 2, 29.7, 76],
      [1, 'VIIRS_NOAA20', 3, 41.8, 89],
    ],
  },
  {
    id: 'validation',
    label: 'IoU Ground Truth Diff',
    executionMs: 28.4,
    sql: `WITH union_geom AS (
  SELECT ST_Union(f.geom, b.actual_burn_geom) AS u,
         ST_Intersection(f.geom, b.actual_burn_geom) AS i
  FROM spread_forecasts f
  JOIN viirs_ground_truth b ON f.event_id = b.event_id
  WHERE f.event_id = 'EVT-2025-ZOMBA-09' AND f.timestep_h = 8
)
SELECT ROUND((ST_Area(i::geography) / 10000.0)::numeric, 1) AS overlap_ha,
       ROUND((ST_Area(u::geography) / 10000.0)::numeric, 1) AS union_ha,
       ROUND((ST_Area(i::geography) / ST_Area(u::geography) * 100)::numeric, 2) AS iou_pct
FROM union_geom;`,
    columns: ['overlap_ha', 'union_ha', 'iou_pct'],
    rows: [[1802.4, 2140.6, 84.20]],
  },
  {
    id: 'gist',
    label: 'Spatial Index Health (GiST)',
    executionMs: 6.7,
    sql: `SELECT relname AS table_name, indexrelname AS gist_index,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
       idx_scan AS index_scans
FROM pg_stat_user_indexes
WHERE indexrelname LIKE '%geom%'
ORDER BY idx_scan DESC;`,
    columns: ['table_name', 'gist_index', 'index_size', 'index_scans'],
    rows: [
      ['tbl_firms_detections', 'idx_firms_geom_gist', '4.8 MB', 18492],
      ['tbl_villages', 'idx_villages_geom_gist', '1.2 MB', 14210],
      ['spread_forecasts', 'idx_forecasts_geom_gist', '9.4 MB', 9844],
      ['viirs_ground_truth', 'idx_viirs_scar_gist', '3.1 MB', 4312],
    ],
  },
];

export const SATELLITE_PASSES = [
  {
    satellite: 'VIIRS S-NPP (375m)',
    orbit: 'Orbit 63821',
    acquired: '4m ago · 15:54 UTC',
    detections: 14,
    meanFrp: '61.4 MW',
    status: 'Ingested',
  },
  {
    satellite: 'VIIRS NOAA-20 (375m)',
    orbit: 'Orbit 35402',
    acquired: '38m ago · 15:20 UTC',
    detections: 11,
    meanFrp: '52.8 MW',
    status: 'Ingested',
  },
  {
    satellite: 'MODIS Aqua (1000m)',
    orbit: 'Pass MW-19',
    acquired: '1h 12m ago · 14:46 UTC',
    detections: 5,
    meanFrp: '30.2 MW',
    status: 'Verified',
  },
  {
    satellite: 'Sentinel-2B L2A (20m SWIR)',
    orbit: 'Tile T36LXH',
    acquired: '3h 05m ago · 12:53 UTC',
    detections: 1,
    meanFrp: 'Burn Scar Mask',
    status: 'Cached',
  },
];
