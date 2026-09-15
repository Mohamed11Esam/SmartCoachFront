import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  LineChart as ChartIcon,
  TrendingUp,
  Plus,
  Camera,
  Calendar,
  Award,
  Flame,
  Dumbbell,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  MOCK_WEIGHT_LOGS,
  MOCK_VOLUME_LOGS,
  MOCK_PHOTO_LOGS,
} from '../../lib/mockData';
import { useAuthStore } from '../../stores/authStore';
import { WeightLogEntry, ProgressPhotoEntry } from '../../types';

export function ProgressAnalytics() {
  const { user, updateUser } = useAuthStore();

  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>(MOCK_WEIGHT_LOGS);
  const [photoLogs, setPhotoLogs] = useState<ProgressPhotoEntry[]>(MOCK_PHOTO_LOGS);

  // Log weight modal state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(79.8);
  const [newBodyFat, setNewBodyFat] = useState<number>(14.0);
  const [logDate, setLogDate] = useState('2026-09-15');

  // Photo modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoTag, setPhotoTag] = useState<'Front' | 'Side' | 'Back'>('Front');

  const targetWeight = user?.targetWeight || 83.0;

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: WeightLogEntry = {
      id: 'wl_' + Date.now(),
      date: logDate,
      weight: Number(newWeight),
      bodyFat: Number(newBodyFat),
    };

    setWeightLogs([...weightLogs, entry]);
    updateUser({ weight: Number(newWeight) });
    setIsWeightModalOpen(false);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    const entry: ProgressPhotoEntry = {
      id: 'p_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      imageUrl: photoUrl,
      tag: photoTag,
      weight: user?.weight || 79.5,
      notes: 'Logged via Athlete Hub',
    };

    setPhotoLogs([entry, ...photoLogs]);
    setIsPhotoModalOpen(false);
    setPhotoUrl('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Biometrics & Performance Metrics
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Athlete Progress & Visual Analytics
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Visualize body composition trends, tonnage progression, and aesthetic body transformation logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsPhotoModalOpen(true)}
            className="gap-2"
          >
            <Camera className="w-4 h-4 text-accent" />
            <span>Upload Photo</span>
          </Button>

          <Button
            variant="accent-glow"
            size="md"
            onClick={() => setIsWeightModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Biometrics</span>
          </Button>
        </div>
      </div>

      {/* Top 3 Metric Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Net Mass Gained</p>
            <h3 className="text-2xl font-black text-text-primary mt-0.5">+2.3 kg</h3>
            <p className="text-[11px] text-status-approved">Lean hyper-caloric phase</p>
          </div>
        </Card>

        <Card className="p-5 border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-main border border-border text-accent flex items-center justify-center font-bold shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Weekly Volume</p>
            <h3 className="text-2xl font-black text-text-primary mt-0.5">64,400 kg</h3>
            <p className="text-[11px] text-accent">+12% vs last mesocycle</p>
          </div>
        </Card>

        <Card className="p-5 border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-status-approved/15 border border-status-approved/30 text-status-approved flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold">Body Fat Shift</p>
            <h3 className="text-2xl font-black text-text-primary mt-0.5">14.1%</h3>
            <p className="text-[11px] text-text-secondary">-1.1% over 6 weeks</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trajectory Chart */}
        <Card className="p-6 border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Body Weight Trend (kg)</h3>
              <p className="text-xs text-text-muted">Target line set at {targetWeight} kg</p>
            </div>
            <Badge variant="accent">Weekly Weigh-in</Badge>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightLogs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                <XAxis dataKey="date" stroke="#666666" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#666666"
                  fontSize={11}
                  domain={['dataMin - 1', 'dataMax + 2']}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    borderColor: '#333333',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                  }}
                />
                <ReferenceLine
                  y={targetWeight}
                  stroke="#C6F135"
                  strokeDasharray="4 4"
                  label={{ value: 'Target', fill: '#C6F135', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#C6F135"
                  strokeWidth={3}
                  dot={{ fill: '#111111', stroke: '#C6F135', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#D4F55A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Tonnage / Volume Chart */}
        <Card className="p-6 border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Weekly Training Volume (kg)</h3>
              <p className="text-xs text-text-muted">Aggregated sets × reps × load</p>
            </div>
            <Badge variant="neutral">This Week</Badge>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_VOLUME_LOGS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                <XAxis dataKey="date" stroke="#666666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666666" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    borderColor: '#333333',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                  }}
                />
                <Bar dataKey="volume" fill="#C6F135" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Before / After Photo Comparison Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              <span>Transformation Visual Timeline</span>
            </h2>
            <p className="text-xs text-text-muted">
              Standardized weekly physique check-ins for coach & AI assessment.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPhotoModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Photo</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {photoLogs.map((photo) => (
            <Card key={photo.id} className="overflow-hidden border-border group">
              <div className="relative aspect-[3/4] w-full bg-main overflow-hidden">
                <img
                  src={photo.imageUrl}
                  alt={photo.tag}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant="accent" size="sm">
                    {photo.tag}
                  </Badge>
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                    {photo.weight} kg
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  {photo.date} • {photo.notes}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Log Weight Modal */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Log Athlete Biometrics"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveWeight} className="space-y-4">
          <Input
            label="Log Date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            required
          />

          <Input
            label="Body Weight (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(Number(e.target.value))}
            required
          />

          <Input
            label="Body Fat Percentage (%)"
            type="number"
            step="0.1"
            value={newBodyFat}
            onChange={(e) => setNewBodyFat(Number(e.target.value))}
          />

          <Button type="submit" variant="accent-glow" size="lg" className="w-full mt-2">
            Save Biometric Entry
          </Button>
        </form>
      </Modal>

      {/* Upload Photo Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Upload Physique Photo"
        maxWidth="sm"
      >
        <form onSubmit={handleAddPhoto} className="space-y-4">
          <Input
            label="Image URL (Unsplash or hosted)"
            placeholder="https://..."
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Angle / Pose
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Front', 'Side', 'Back'] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPhotoTag(tag)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    photoTag === tag
                      ? 'bg-accent text-black border-accent'
                      : 'bg-main border-border text-text-secondary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="accent-glow" size="lg" className="w-full mt-2">
            Upload Progress Photo
          </Button>
        </form>
      </Modal>
    </div>
  );
}
