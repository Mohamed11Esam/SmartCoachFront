import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  FlipHorizontal,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Play,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  type ExerciseType,
  KINEMATIC_CONFIGS,
  RepKinematicsTracker,
  poseLandmarkerService,
  soundSynthesizer,
  simulateRepFrame,
  renderPoseOnCanvas,
  detectExerciseKinematicType,
  type KinematicState,
} from './poseTracker';

interface VisionRepCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
  targetReps?: number;
  initialReps?: number;
  onSyncReps?: (countedReps: number, markSetComplete?: boolean) => void;
}

const EXERCISE_OPTIONS: { id: ExerciseType; label: string }[] = [
  { id: 'squats', label: 'Squats' },
  { id: 'pushups', label: 'Pushups' },
  { id: 'bicep_curls', label: 'Bicep Curls' },
  { id: 'shoulder_press', label: 'Shoulder Press' },
];

export function VisionRepCounterModal({
  isOpen,
  onClose,
  exerciseName = 'Squats',
  targetReps = 10,
  initialReps = 0,
  onSyncReps,
}: VisionRepCounterModalProps) {
  // Exercise Selection
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>(() =>
    detectExerciseKinematicType(exerciseName)
  );

  // Kinematics and Reps state
  const trackerRef = useRef<RepKinematicsTracker | null>(null);
  const [kinematicState, setKinematicState] = useState<KinematicState>({
    phase: 'STANDBY',
    repCount: initialReps,
    currentAngle: 160,
    targetInflection: 100,
    targetExtension: 160,
    depthPercentage: 0,
    feedbackCue: 'Stand tall. Feet shoulder-width apart.',
    isInflectionReached: false,
    activeJointName: 'Knee',
    detectedSide: 'both',
    lastRepTimestamp: 0,
  });

  const [repCount, setRepCount] = useState<number>(initialReps);
  const [hasHitTarget, setHasHitTarget] = useState<boolean>(false);

  // Hardware Camera & Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Simulation mode
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationAnimationRef = useRef<number | null>(null);

  // MediaPipe detection animation loop
  const animFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize or update tracker on exercise change
  useEffect(() => {
    const detected = detectExerciseKinematicType(exerciseName);
    setSelectedExercise(detected);
  }, [exerciseName]);

  useEffect(() => {
    if (!trackerRef.current) {
      trackerRef.current = new RepKinematicsTracker(selectedExercise, repCount);
    } else {
      trackerRef.current.setExercise(selectedExercise);
    }
    const snap = trackerRef.current.getSnapshot();
    setKinematicState(snap);
  }, [selectedExercise]);

  // Audio mute sync
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSynthesizer.setMuted(next);
  };

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize Camera Stream
  const startCameraStream = useCallback(async () => {
    if (!isOpen) return;
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by browser. Switch to Simulation mode.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permissions denied or unavailable.';
      console.warn('Camera stream initialization warning:', msg);
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [isOpen, facingMode, stopCameraStream]);

  // Start / restart camera when modal opens or camera toggle changes
  useEffect(() => {
    if (isOpen) {
      startCameraStream();
    } else {
      stopCameraStream();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (simulationAnimationRef.current) cancelAnimationFrame(simulationAnimationRef.current);
    }
    return () => {
      stopCameraStream();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (simulationAnimationRef.current) cancelAnimationFrame(simulationAnimationRef.current);
    };
  }, [isOpen, startCameraStream, stopCameraStream]);

  // Load MediaPipe Model once
  useEffect(() => {
    let isCancelled = false;
    if (isOpen) {
      setIsModelLoading(true);
      poseLandmarkerService
        .getLandmarker()
        .then((landmarker) => {
          if (!isCancelled) {
            setIsModelLoading(false);
            if (!landmarker) {
              setCameraError('MediaPipe model could not load. You can test with built-in Simulation.');
            }
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setIsModelLoading(false);
            setCameraError('MediaPipe vision pipeline failed to initialize.');
          }
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Handle Target Rep Hit celebration
  const checkTargetRepHit = useCallback(
    (newReps: number) => {
      if (newReps >= targetReps && !hasHitTarget) {
        setHasHitTarget(true);
        soundSynthesizer.playSetCompletionFanfare();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C6F135', '#06B6D4', '#FFFFFF', '#F59E0B'],
        });
      }
    },
    [targetReps, hasHitTarget]
  );

  // Main Detection Loop (Webcam)
  useEffect(() => {
    if (!isOpen || !isCameraActive || isSimulating) return;

    let isRunning = true;

    const detectLoop = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const landmarker = await poseLandmarkerService.getLandmarker();
          if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const startTimeMs = performance.now();
            const poseResult = landmarker.detectForVideo(video, startTimeMs);

            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
              const landmarks = poseResult.landmarks[0];
              if (trackerRef.current) {
                const { state, repCompleted } = trackerRef.current.processLandmarks(landmarks);
                setKinematicState(state);
                setRepCount(state.repCount);

                if (repCompleted) {
                  checkTargetRepHit(state.repCount);
                }

                const cfg = KINEMATIC_CONFIGS[selectedExercise];
                const activeJoints =
                  state.detectedSide === 'left' ? cfg.leftJoints : cfg.rightJoints;

                renderPoseOnCanvas(
                  ctx,
                  landmarks,
                  canvas.width,
                  canvas.height,
                  state.isInflectionReached,
                  activeJoints,
                  state.currentAngle
                );
              }
            }
          }
        }
      }

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(detectLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(detectLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isCameraActive, isSimulating, selectedExercise, checkTargetRepHit]);

  // Run a single realistic simulated rep frame sequence (1.8s)
  const runSimulatedRep = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const duration = 1800; // 1.8 seconds per natural repetition
    const startTime = performance.now();

    const canvas = canvasRef.current;
    if (canvas) {
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 640;
        canvas.height = 480;
      }
    }

    const simStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Generate 33-point realistic simulated landmarks
      const simLandmarks = simulateRepFrame(selectedExercise, progress);

      if (trackerRef.current) {
        const { state, repCompleted } = trackerRef.current.processLandmarks(simLandmarks);
        setKinematicState(state);
        setRepCount(state.repCount);

        if (repCompleted) {
          checkTargetRepHit(state.repCount);
        }

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cfg = KINEMATIC_CONFIGS[selectedExercise];
            renderPoseOnCanvas(
              ctx,
              simLandmarks,
              canvas.width,
              canvas.height,
              state.isInflectionReached,
              cfg.leftJoints,
              state.currentAngle
            );
          }
        }
      }

      if (progress < 1) {
        simulationAnimationRef.current = requestAnimationFrame(simStep);
      } else {
        setIsSimulating(false);
      }
    };

    simulationAnimationRef.current = requestAnimationFrame(simStep);
  };

  // Reset Rep Count
  const handleReset = () => {
    if (trackerRef.current) {
      trackerRef.current.resetReps(0);
      setKinematicState(trackerRef.current.getSnapshot());
    }
    setRepCount(0);
    setHasHitTarget(false);
  };

  // Sync Reps to Set
  const handleSyncToSet = (autoCompleteSet: boolean = false) => {
    if (onSyncReps) {
      onSyncReps(repCount, autoCompleteSet);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Radial progress calculations
  const circumference = 2 * Math.PI * 40;
  const progressRatio = Math.min(1, repCount / targetReps);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Container HUD Card */}
      <div className="relative w-full max-w-5xl bg-card border border-border/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header HUD Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-main/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold">
              <Camera className="w-5 h-5 fill-accent/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-text-primary tracking-tight">
                  MediaPipe Vision Coach
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                  <Activity className="w-3 h-3 animate-pulse" /> Live Kinematics
                </span>
              </div>
              <p className="text-xs text-text-muted hidden sm:block">
                On-device 33-point skeletal tracking • Mathematical rep counting
              </p>
            </div>
          </div>

          {/* Privacy Badge & Close Button */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-[11px] font-semibold text-text-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>100% On-Device WebAssembly • Zero frames sent to cloud</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-card border border-transparent hover:border-border transition-colors cursor-pointer"
              title="Close Vision Coach"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Exercise Switcher Selector Ribbon */}
        <div className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-border/50 bg-card/40 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted mr-1.5">
              Kinematic Model:
            </span>
            {EXERCISE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedExercise(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedExercise === opt.id
                    ? 'bg-accent text-black shadow-md shadow-accent/20'
                    : 'bg-main text-text-secondary hover:text-text-primary hover:bg-card border border-border/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
            Inflection: &le; {kinematicState.targetInflection}&deg; • Ext: &ge;{' '}
            {kinematicState.targetExtension}&deg;
          </Badge>
        </div>

        {/* Main Camera / Visualizer Arena */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[480px] overflow-hidden">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-contain ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />

          {/* Canvas Skeleton Overlay */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />

          {/* Loading Indicator */}
          {isModelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 space-y-3">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-accent">Initializing MediaPipe WebAssembly...</p>
              <p className="text-xs text-text-muted">Loading lightweight float16 neural model</p>
            </div>
          )}

          {/* Fallback Screen when webcam is inactive or has error */}
          {cameraError && !isSimulating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card/95 z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-status-declined/15 text-status-declined flex items-center justify-center">
                <Camera className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-black text-text-primary">Camera Not Available</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                <Button variant="accent-glow" size="sm" onClick={runSimulatedRep}>
                  <Play className="w-4 h-4 mr-1.5" /> Test Kinematics via Simulation
                </Button>
                <Button variant="secondary" size="sm" onClick={startCameraStream}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Retry Camera Access
                </Button>
              </div>
            </div>
          )}

          {/* Form Cue Floater Banner */}
          <div className="absolute top-4 inset-x-4 flex justify-center pointer-events-none z-10">
            <div
              className={`px-4 py-2 rounded-2xl border shadow-xl flex items-center gap-2 backdrop-blur-md transition-all duration-300 ${
                kinematicState.isInflectionReached
                  ? 'bg-accent/90 border-accent text-black font-black shadow-[0_0_20px_rgba(198,241,53,0.5)] scale-105'
                  : 'bg-black/75 border-border/80 text-white font-bold'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${
                  kinematicState.isInflectionReached ? 'text-black' : 'text-accent'
                }`}
              />
              <span className="text-xs sm:text-sm tracking-wide">
                {kinematicState.feedbackCue}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono ${
                  kinematicState.isInflectionReached
                    ? 'bg-black text-accent font-black'
                    : 'bg-main text-text-muted'
                }`}
              >
                {kinematicState.phase}
              </span>
            </div>
          </div>

          {/* Bottom Overlaid Athletic Telemetry Hud */}
          <div className="absolute bottom-4 inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-10">
            {/* Live Joint Angle & Depth Meter */}
            <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-border/80 p-3 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {kinematicState.activeJointName} Kinematics
                </span>
                <span className="text-lg font-black font-mono text-text-primary">
                  {kinematicState.currentAngle}&deg;
                </span>
              </div>

              <div className="h-8 w-px bg-border/60" />

              <div className="w-36 sm:w-44 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-text-secondary">Inflection Depth</span>
                  <span
                    className={`font-mono ${
                      kinematicState.depthPercentage >= 100
                        ? 'text-accent font-black'
                        : 'text-text-primary'
                    }`}
                  >
                    {kinematicState.depthPercentage}%
                  </span>
                </div>
                <div className="w-full bg-main h-2 rounded-full overflow-hidden border border-border/40">
                  <div
                    className={`h-full transition-all duration-150 ${
                      kinematicState.depthPercentage >= 100
                        ? 'bg-accent shadow-[0_0_8px_#C6F135]'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${kinematicState.depthPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Radial Target Rep Visualizer */}
            <div className="pointer-events-auto bg-black/85 backdrop-blur-md border border-border/80 px-4 py-2.5 rounded-2xl flex items-center gap-3.5 shadow-2xl">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    className="stroke-main"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    className="stroke-accent transition-all duration-300"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - progressRatio)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-white font-mono leading-none">
                    {repCount}
                  </span>
                  <span className="text-[9px] font-bold text-text-muted leading-none mt-0.5">
                    /{targetReps}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  Target Sets Reps
                </span>
                <span className="text-xs font-black text-white">
                  {repCount >= targetReps ? (
                    <span className="text-accent flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-accent" /> Target Hit!
                    </span>
                  ) : (
                    `${targetReps - repCount} reps remaining`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Controls Toolbar */}
        <div className="p-4 bg-main/80 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Camera & Testing Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={runSimulatedRep}
              disabled={isSimulating}
              className="gap-1.5 text-xs font-bold"
              title="Run a simulated frame rep to test without moving"
            >
              <Play className="w-3.5 h-3.5 text-accent" />
              <span>{isSimulating ? 'Simulating Rep...' : 'Simulate Rep'}</span>
            </Button>

            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Flip Camera (Front / Back)"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent" />}
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Reset Rep Counter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Reps Button Group */}
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="md" onClick={onClose} className="text-xs font-bold">
              Discard
            </Button>

            <Button
              variant="accent-glow"
              size="md"
              onClick={() => handleSyncToSet(repCount >= targetReps)}
              className="text-xs font-black gap-2 shadow-lg shadow-accent/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {repCount >= targetReps ? 'Sync & Complete Set' : `Sync Reps (${repCount}) to Set`}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
