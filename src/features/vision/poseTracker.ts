import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';

export type ExerciseType = 'squats' | 'pushups' | 'bicep_curls' | 'shoulder_press' | 'general';

export type RepPhase = 'STANDBY' | 'ECCENTRIC' | 'INFLECTION' | 'CONCENTRIC' | 'REP_COMPLETE';

export interface Point3D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface KinematicConfig {
  type: ExerciseType;
  name: string;
  primaryJoint: string;
  leftJoints: [number, number, number];
  rightJoints: [number, number, number];
  inflectionAngle: number;
  extensionAngle: number;
  cues: {
    standby: string;
    eccentric: string;
    inflection: string;
    concentric: string;
    complete: string;
  };
}

export const KINEMATIC_CONFIGS: Record<ExerciseType, KinematicConfig> = {
  squats: {
    type: 'squats',
    name: 'Barbell / Bodyweight Squat',
    primaryJoint: 'Knee',
    // Hip (23/24) - Knee (25/26) - Ankle (27/28)
    leftJoints: [23, 25, 27],
    rightJoints: [24, 26, 28],
    inflectionAngle: 100, // Inflection <= 100 deg
    extensionAngle: 160,  // Extension >= 160 deg
    cues: {
      standby: 'Stand tall. Feet shoulder-width apart.',
      eccentric: 'Lower hips down & back under control...',
      inflection: 'Parallel reached! Drive up through heels!',
      concentric: 'Drive upward with power to full extension!',
      complete: 'Rep counted! Reset and prepare next rep.',
    },
  },
  pushups: {
    type: 'pushups',
    name: 'Pushup',
    primaryJoint: 'Elbow',
    // Shoulder (11/12) - Elbow (13/14) - Wrist (15/16)
    leftJoints: [11, 13, 15],
    rightJoints: [12, 14, 16],
    inflectionAngle: 90,  // Inflection <= 90 deg
    extensionAngle: 160,  // Extension >= 160 deg
    cues: {
      standby: 'High plank locked. Core rigid, arms straight.',
      eccentric: 'Lower chest towards floor, elbows at 45°...',
      inflection: 'Chest to deck reached! Press up explosively!',
      concentric: 'Press floor away to full elbow lockout!',
      complete: 'Clean pushup! Keep core and glutes tight.',
    },
  },
  bicep_curls: {
    type: 'bicep_curls',
    name: 'Bicep Curl',
    primaryJoint: 'Elbow',
    // Shoulder (11/12) - Elbow (13/14) - Wrist (15/16)
    leftJoints: [11, 13, 15],
    rightJoints: [12, 14, 16],
    inflectionAngle: 55,  // Flexion <= 55 deg
    extensionAngle: 145,  // Extension >= 145 deg
    cues: {
      standby: 'Arms fully extended at your sides. Elbows pinned.',
      eccentric: 'Curl load upward without swinging torso...',
      inflection: 'Peak contraction! Squeeze the biceps!',
      concentric: 'Control the descent under tension...',
      complete: 'Strict curl! Lower all the way to extension.',
    },
  },
  shoulder_press: {
    type: 'shoulder_press',
    name: 'Overhead / Shoulder Press',
    primaryJoint: 'Elbow',
    // Shoulder (11/12) - Elbow (13/14) - Wrist (15/16)
    leftJoints: [11, 13, 15],
    rightJoints: [12, 14, 16],
    inflectionAngle: 85,
    extensionAngle: 160,
    cues: {
      standby: 'Dumbbells at shoulder level, core braced.',
      eccentric: 'Drive weights overhead towards lockout...',
      inflection: 'Full overhead lockout! Control the descent.',
      concentric: 'Lower elbows under control to 90°...',
      complete: 'Strong press! Reset breath and repeat.',
    },
  },
  general: {
    type: 'general',
    name: 'Movement Kinematics',
    primaryJoint: 'Joint',
    leftJoints: [23, 25, 27],
    rightJoints: [24, 26, 28],
    inflectionAngle: 95,
    extensionAngle: 160,
    cues: {
      standby: 'Prepare for movement. Form posture aligned.',
      eccentric: 'Initiating eccentric range of motion...',
      inflection: 'Target range of motion reached! Drive back!',
      concentric: 'Returning to starting position...',
      complete: 'Rep complete! Maintain smooth rhythm.',
    },
  },
};

/**
 * Standard MediaPipe 33-point pose skeleton connections
 */
export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 13], [13, 15],
  [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16],
  [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26],
  [25, 27], [26, 28],
  [27, 29], [28, 30],
  [29, 31], [30, 32],
  [27, 31], [28, 32],
];

/**
 * Mathematical kinematic angle computation:
 * theta = arccos( (BA dot BC) / (|BA| * |BC|) ) * (180 / pi)
 * Clamped strictly to [-1, 1] before arccos to guard against floating point inaccuracies.
 */
export function calculateJointAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA < 1e-6 || magBC < 1e-6) {
    return 180;
  }

  const cosine = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  const angleRad = Math.acos(cosine);
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Web Audio API Rep Chime Synthesizer
 */
class SynthesizerEngine {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Clean acoustic chime when rep is counted */
  public playRepChime() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Dual harmonic bell tone (A5 880Hz gliding to E6 1320Hz)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      gainNode.gain.setValueAtTime(0.22, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback fails gracefully if browser tab is blocked
    }
  }

  /** Triumphant 4-tone fanfare when target reps are hit */
  public playSetCompletionFanfare() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio playback fails gracefully
    }
  }
}

export const soundSynthesizer = new SynthesizerEngine();

export interface KinematicState {
  phase: RepPhase;
  repCount: number;
  currentAngle: number;
  targetInflection: number;
  targetExtension: number;
  depthPercentage: number;
  feedbackCue: string;
  isInflectionReached: boolean;
  activeJointName: string;
  detectedSide: 'left' | 'right' | 'both';
  lastRepTimestamp: number;
}

/**
 * Kinematic State Machine with Debounce & Peak-to-Valley Detection
 */
export class RepKinematicsTracker {
  private config: KinematicConfig;
  private phase: RepPhase = 'STANDBY';
  private repCount: number = 0;
  private isInflectionReached: boolean = false;
  private lastRepTimestamp: number = 0;
  private minRepIntervalMs: number = 600; // Debounce protection to eliminate false counts
  private currentAngle: number = 180;
  private depthPercentage: number = 0;
  private detectedSide: 'left' | 'right' | 'both' = 'both';
  private feedbackCue: string = '';

  constructor(exerciseType: ExerciseType = 'squats', initialReps: number = 0) {
    this.config = KINEMATIC_CONFIGS[exerciseType] || KINEMATIC_CONFIGS.squats;
    this.repCount = initialReps;
    this.currentAngle = this.config.extensionAngle;
    this.feedbackCue = this.config.cues.standby;
  }

  public setExercise(exerciseType: ExerciseType) {
    this.config = KINEMATIC_CONFIGS[exerciseType] || KINEMATIC_CONFIGS.general;
    this.phase = 'STANDBY';
    this.isInflectionReached = false;
    this.currentAngle = this.config.extensionAngle;
    this.depthPercentage = 0;
    this.feedbackCue = this.config.cues.standby;
  }

  public resetReps(count: number = 0) {
    this.repCount = count;
    this.phase = 'STANDBY';
    this.isInflectionReached = false;
    this.depthPercentage = 0;
    this.feedbackCue = this.config.cues.standby;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public setRepCount(count: number) {
    this.repCount = count;
  }

  /**
   * Evaluates landmark frames, calculates joint angles, and drives the state machine.
   * Returns updated snapshot of kinematics and a flag if a new rep completed.
   */
  public processLandmarks(landmarks: NormalizedLandmark[]): {
    state: KinematicState;
    repCompleted: boolean;
  } {
    let repCompleted = false;
    const now = Date.now();

    if (!landmarks || landmarks.length < 33) {
      return {
        state: this.getSnapshot(),
        repCompleted: false,
      };
    }

    // Determine left vs right joint angle based on landmark visibility
    const [la, lb, lc] = this.config.leftJoints;
    const [ra, rb, rc] = this.config.rightJoints;

    const leftVis = ((landmarks[la].visibility ?? 1) + (landmarks[lb].visibility ?? 1) + (landmarks[lc].visibility ?? 1)) / 3;
    const rightVis = ((landmarks[ra].visibility ?? 1) + (landmarks[rb].visibility ?? 1) + (landmarks[rc].visibility ?? 1)) / 3;

    let angle = 180;
    if (leftVis > 0.6 && rightVis > 0.6) {
      const leftAngle = calculateJointAngle(landmarks[la], landmarks[lb], landmarks[lc]);
      const rightAngle = calculateJointAngle(landmarks[ra], landmarks[rb], landmarks[rc]);
      angle = Math.round((leftAngle + rightAngle) / 2);
      this.detectedSide = 'both';
    } else if (leftVis >= rightVis) {
      angle = calculateJointAngle(landmarks[la], landmarks[lb], landmarks[lc]);
      this.detectedSide = 'left';
    } else {
      angle = calculateJointAngle(landmarks[ra], landmarks[rb], landmarks[rc]);
      this.detectedSide = 'right';
    }

    this.currentAngle = angle;

    // Calculate depth percentage toward inflection
    const ext = this.config.extensionAngle;
    const infl = this.config.inflectionAngle;
    const totalRom = Math.abs(ext - infl);

    if (totalRom > 0) {
      const progress = Math.max(0, ext - angle);
      this.depthPercentage = Math.min(100, Math.round((progress / totalRom) * 100));
    } else {
      this.depthPercentage = 0;
    }

    // State Machine Transitions
    switch (this.phase) {
      case 'STANDBY':
        if (angle < ext - 12) {
          this.phase = 'ECCENTRIC';
          this.feedbackCue = this.config.cues.eccentric;
        } else {
          this.feedbackCue = this.config.cues.standby;
        }
        break;

      case 'ECCENTRIC':
        // Descending towards inflection
        if (angle <= infl) {
          this.phase = 'INFLECTION';
          this.isInflectionReached = true;
          this.feedbackCue = this.config.cues.inflection;
        } else if (angle >= ext - 5) {
          // Reset if athlete stood back up without reaching inflection
          this.phase = 'STANDBY';
          this.feedbackCue = this.config.cues.standby;
        } else {
          this.feedbackCue = this.config.cues.eccentric;
        }
        break;

      case 'INFLECTION':
        // Turnaround inflection point reached
        if (angle > infl + 8) {
          this.phase = 'CONCENTRIC';
          this.feedbackCue = this.config.cues.concentric;
        } else {
          this.feedbackCue = this.config.cues.inflection;
        }
        break;

      case 'CONCENTRIC':
        // Driving back up to starting extension
        if (angle >= ext - 8) {
          if (this.isInflectionReached && now - this.lastRepTimestamp >= this.minRepIntervalMs) {
            this.repCount += 1;
            this.lastRepTimestamp = now;
            this.phase = 'REP_COMPLETE';
            this.isInflectionReached = false;
            this.feedbackCue = this.config.cues.complete;
            repCompleted = true;
            soundSynthesizer.playRepChime();
          } else {
            this.phase = 'STANDBY';
            this.isInflectionReached = false;
            this.feedbackCue = this.config.cues.standby;
          }
        } else if (angle <= infl) {
          // Double bounce at bottom
          this.phase = 'INFLECTION';
          this.feedbackCue = this.config.cues.inflection;
        } else {
          this.feedbackCue = this.config.cues.concentric;
        }
        break;

      case 'REP_COMPLETE':
        // Brief transition frame before next rep standby
        if (now - this.lastRepTimestamp > 300) {
          this.phase = angle < ext - 12 ? 'ECCENTRIC' : 'STANDBY';
          this.feedbackCue = this.phase === 'ECCENTRIC' ? this.config.cues.eccentric : this.config.cues.standby;
        }
        break;
    }

    return {
      state: this.getSnapshot(),
      repCompleted,
    };
  }

  public getSnapshot(): KinematicState {
    return {
      phase: this.phase,
      repCount: this.repCount,
      currentAngle: this.currentAngle,
      targetInflection: this.config.inflectionAngle,
      targetExtension: this.config.extensionAngle,
      depthPercentage: this.depthPercentage,
      feedbackCue: this.feedbackCue,
      isInflectionReached: this.isInflectionReached,
      activeJointName: this.config.primaryJoint,
      detectedSide: this.detectedSide,
      lastRepTimestamp: this.lastRepTimestamp,
    };
  }
}

/**
 * MediaPipe PoseLandmarker Singleton Manager
 * Gracefully loads WASM via CDN with GPU delegate and CPU fallback.
 */
class PoseLandmarkerService {
  private landmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<PoseLandmarker | null> | null = null;

  public async getLandmarker(): Promise<PoseLandmarker | null> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const modelPath =
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

        // Primary: GPU Delegate
        try {
          this.landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          return this.landmarker;
        } catch (gpuError) {
          console.warn('MediaPipe GPU initialization failed, falling back to CPU delegate:', gpuError);
          // Graceful fallback: CPU Delegate
          this.landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          return this.landmarker;
        }
      } catch (err) {
        console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
        return null;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  public close() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn('Error closing pose landmarker:', e);
      }
      this.landmarker = null;
      this.initPromise = null;
    }
  }
}

export const poseLandmarkerService = new PoseLandmarkerService();

/**
 * Built-in Kinematic Simulation Generator
 * Produces anatomically accurate 33-point pose landmark arrays for test and fallback scenarios.
 * Progress is in [0, 1] where 0 = standing extension, 0.5 = peak inflection depth, 1 = return to extension.
 */
export function simulateRepFrame(exerciseType: ExerciseType, progress: number): NormalizedLandmark[] {
  const normProgress = Math.max(0, Math.min(1, progress));
  // Sine curve: 0 at start/end, 1 at inflection peak (progress = 0.5)
  const s = Math.sin(normProgress * Math.PI);

  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.99,
  }));

  // Common head/face anchors
  landmarks[0] = { x: 0.5, y: 0.16 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 }; // Nose
  landmarks[1] = { x: 0.49, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[2] = { x: 0.48, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[3] = { x: 0.47, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[4] = { x: 0.51, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[5] = { x: 0.52, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[6] = { x: 0.53, y: 0.15 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[7] = { x: 0.46, y: 0.16 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[8] = { x: 0.54, y: 0.16 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[9] = { x: 0.49, y: 0.18 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };
  landmarks[10] = { x: 0.51, y: 0.18 + (exerciseType === 'squats' ? 0.22 * s : 0.08 * s), z: 0, visibility: 0.99 };

  switch (exerciseType) {
    case 'squats': {
      // Squat: Hip (23/24) - Knee (25/26) - Ankle (27/28)
      // At s=0 (standing): Knee angle is ~172 deg
      // At s=1 (parallel depth): Knee angle is ~92 deg
      const hipY = 0.52 + 0.25 * s;
      const kneeXOffset = 0.07 * s;
      const kneeY = 0.70 + 0.08 * s;
      const ankleY = 0.90;

      // Shoulders
      landmarks[11] = { x: 0.43, y: 0.28 + 0.24 * s, z: 0, visibility: 0.99 };
      landmarks[12] = { x: 0.57, y: 0.28 + 0.24 * s, z: 0, visibility: 0.99 };
      // Elbows
      landmarks[13] = { x: 0.38, y: 0.42 + 0.24 * s, z: 0, visibility: 0.99 };
      landmarks[14] = { x: 0.62, y: 0.42 + 0.24 * s, z: 0, visibility: 0.99 };
      // Wrists
      landmarks[15] = { x: 0.44, y: 0.38 + 0.24 * s, z: 0, visibility: 0.99 };
      landmarks[16] = { x: 0.56, y: 0.38 + 0.24 * s, z: 0, visibility: 0.99 };
      // Hips
      landmarks[23] = { x: 0.45, y: hipY, z: 0, visibility: 0.99 };
      landmarks[24] = { x: 0.55, y: hipY, z: 0, visibility: 0.99 };
      // Knees
      landmarks[25] = { x: 0.42 - kneeXOffset, y: kneeY, z: 0, visibility: 0.99 };
      landmarks[26] = { x: 0.58 + kneeXOffset, y: kneeY, z: 0, visibility: 0.99 };
      // Ankles
      landmarks[27] = { x: 0.44, y: ankleY, z: 0, visibility: 0.99 };
      landmarks[28] = { x: 0.56, y: ankleY, z: 0, visibility: 0.99 };
      // Feet
      landmarks[29] = { x: 0.43, y: 0.93, z: 0, visibility: 0.99 };
      landmarks[30] = { x: 0.57, y: 0.93, z: 0, visibility: 0.99 };
      landmarks[31] = { x: 0.41, y: 0.94, z: 0, visibility: 0.99 };
      landmarks[32] = { x: 0.59, y: 0.94, z: 0, visibility: 0.99 };
      break;
    }

    case 'pushups': {
      // Pushup side profile:
      // Shoulder (11/12) - Elbow (13/14) - Wrist (15/16)
      // At s=0 (high plank): Elbow is ~168 deg
      // At s=1 (chest to deck): Elbow is ~84 deg
      const dropY = 0.16 * s;
      const shoulderY = 0.54 + dropY;
      const elbowX = 0.32 + 0.08 * s;
      const elbowY = 0.62 + 0.06 * s;
      const wristX = 0.34;
      const wristY = 0.78;

      landmarks[11] = { x: 0.28, y: shoulderY, z: 0, visibility: 0.99 };
      landmarks[12] = { x: 0.30, y: shoulderY, z: 0, visibility: 0.99 };
      landmarks[13] = { x: elbowX, y: elbowY, z: 0, visibility: 0.99 };
      landmarks[14] = { x: elbowX + 0.02, y: elbowY, z: 0, visibility: 0.99 };
      landmarks[15] = { x: wristX, y: wristY, z: 0, visibility: 0.99 };
      landmarks[16] = { x: wristX + 0.02, y: wristY, z: 0, visibility: 0.99 };
      landmarks[23] = { x: 0.52, y: shoulderY + 0.04, z: 0, visibility: 0.99 };
      landmarks[24] = { x: 0.54, y: shoulderY + 0.04, z: 0, visibility: 0.99 };
      landmarks[25] = { x: 0.70, y: shoulderY + 0.08, z: 0, visibility: 0.99 };
      landmarks[26] = { x: 0.72, y: shoulderY + 0.08, z: 0, visibility: 0.99 };
      landmarks[27] = { x: 0.88, y: 0.78, z: 0, visibility: 0.99 };
      landmarks[28] = { x: 0.90, y: 0.78, z: 0, visibility: 0.99 };
      break;
    }

    case 'bicep_curls': {
      // Curl: Shoulder (11/12) - Elbow (13/14) - Wrist (15/16)
      // At s=0: Wrist is down at y=0.74 (elbow angle ~165 deg)
      // At s=1: Wrist curled up to y=0.38 (elbow angle ~48 deg)
      const wristY = 0.74 - 0.36 * s;
      const wristX = 0.38 + 0.04 * s;

      landmarks[11] = { x: 0.42, y: 0.32, z: 0, visibility: 0.99 };
      landmarks[12] = { x: 0.58, y: 0.32, z: 0, visibility: 0.99 };
      landmarks[13] = { x: 0.40, y: 0.52, z: 0, visibility: 0.99 };
      landmarks[14] = { x: 0.60, y: 0.52, z: 0, visibility: 0.99 };
      landmarks[15] = { x: wristX, y: wristY, z: 0, visibility: 0.99 };
      landmarks[16] = { x: 1 - wristX, y: wristY, z: 0, visibility: 0.99 };
      landmarks[23] = { x: 0.44, y: 0.60, z: 0, visibility: 0.99 };
      landmarks[24] = { x: 0.56, y: 0.60, z: 0, visibility: 0.99 };
      landmarks[25] = { x: 0.44, y: 0.78, z: 0, visibility: 0.99 };
      landmarks[26] = { x: 0.56, y: 0.78, z: 0, visibility: 0.99 };
      landmarks[27] = { x: 0.44, y: 0.92, z: 0, visibility: 0.99 };
      landmarks[28] = { x: 0.56, y: 0.92, z: 0, visibility: 0.99 };
      break;
    }

    case 'shoulder_press': {
      // Overhead Press:
      // At s=0: Full overhead lockout (elbow angle ~179 deg)
      // At s=1: Racked at shoulder level (elbow angle ~40-75 deg)
      landmarks[11] = { x: 0.42, y: 0.35, z: 0, visibility: 0.99 };
      landmarks[12] = { x: 0.58, y: 0.35, z: 0, visibility: 0.99 };
      landmarks[13] = { x: 0.40 - 0.06 * s, y: 0.22 + 0.22 * s, z: 0, visibility: 0.99 };
      landmarks[14] = { x: 0.60 + 0.06 * s, y: 0.22 + 0.22 * s, z: 0, visibility: 0.99 };
      landmarks[15] = { x: 0.38 - 0.03 * s, y: 0.08 + 0.20 * s, z: 0, visibility: 0.99 };
      landmarks[16] = { x: 0.62 + 0.03 * s, y: 0.08 + 0.20 * s, z: 0, visibility: 0.99 };
      landmarks[23] = { x: 0.44, y: 0.60, z: 0, visibility: 0.99 };
      landmarks[24] = { x: 0.56, y: 0.60, z: 0, visibility: 0.99 };
      landmarks[25] = { x: 0.44, y: 0.78, z: 0, visibility: 0.99 };
      landmarks[26] = { x: 0.56, y: 0.78, z: 0, visibility: 0.99 };
      landmarks[27] = { x: 0.44, y: 0.92, z: 0, visibility: 0.99 };
      landmarks[28] = { x: 0.56, y: 0.92, z: 0, visibility: 0.99 };
      break;
    }

    default: {
      // General movement defaults to squat kinematics
      return simulateRepFrame('squats', progress);
    }
  }

  // Populate hand/finger landmarks (17-22)
  for (let i = 17; i <= 22; i++) {
    const isLeft = i % 2 !== 0;
    const baseWrist = isLeft ? landmarks[15] : landmarks[16];
    landmarks[i] = {
      x: baseWrist.x + (isLeft ? -0.02 : 0.02),
      y: baseWrist.y + 0.02,
      z: 0,
      visibility: 0.9,
    };
  }

  return landmarks;
}

/**
 * High-performance 2D Canvas Skeleton Renderer
 * Draws 33 skeletal landmarks and connecting wireframe bones.
 * Turns Apex Fluorescent Green (#C6F135) when target inflection depth is reached.
 */
export function renderPoseOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  isInflectionReached: boolean,
  activeJointIndices: [number, number, number],
  currentAngle?: number
) {
  ctx.save();

  // Dynamic athletic glow color scheme
  const boneColor = isInflectionReached ? '#C6F135' : '#06B6D4';
  const glowColor = isInflectionReached ? 'rgba(198, 241, 53, 0.8)' : 'rgba(6, 182, 212, 0.6)';

  // Draw Wireframe Bones
  ctx.lineWidth = isInflectionReached ? 4 : 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = boneColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isInflectionReached ? 12 : 6;

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (!start || !end) continue;
    if ((start.visibility ?? 1) < 0.3 || (end.visibility ?? 1) < 0.3) continue;

    ctx.beginPath();
    ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
    ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
    ctx.stroke();
  }

  // Draw 33 Landmark Points
  ctx.shadowBlur = 4;
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;

    const px = lm.x * canvasWidth;
    const py = lm.y * canvasHeight;

    const isVertex = i === activeJointIndices[1];
    const isRayJoint = i === activeJointIndices[0] || i === activeJointIndices[2];

    if (isVertex) {
      // Primary Vertex Joint (Knee / Elbow)
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#C6F135';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Outer pulse ring
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(198, 241, 53, 0.7)';
      ctx.stroke();

      // Live angle label pill
      if (currentAngle !== undefined) {
        ctx.font = 'bold 12px monospace';
        const label = `${currentAngle}°`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(px + 14, py - 12, textWidth + 12, 22, 6);
        ctx.fill();

        ctx.strokeStyle = '#C6F135';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#C6F135';
        ctx.fillText(label, px + 20, py + 4);
      }
    } else if (isRayJoint) {
      // Adjacent ray joints (Hip / Ankle / Shoulder / Wrist)
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isInflectionReached ? '#C6F135' : '#38BDF8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    } else {
      // General skeletal points
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Intelligent exercise type heuristic from workout name
 */
export function detectExerciseKinematicType(exerciseName: string = ''): ExerciseType {
  const name = exerciseName.toLowerCase();
  if (name.includes('squat') || name.includes('leg press') || name.includes('lunge')) {
    return 'squats';
  }
  if (name.includes('pushup') || name.includes('push up') || name.includes('push-up') || name.includes('bench press') || name.includes('chest press') || name.includes('dip')) {
    return 'pushups';
  }
  if (name.includes('curl') || name.includes('bicep') || name.includes('chin-up') || name.includes('chin up')) {
    return 'bicep_curls';
  }
  if (name.includes('press') || name.includes('shoulder') || name.includes('overhead') || name.includes('military')) {
    return 'shoulder_press';
  }
  return 'general';
}
