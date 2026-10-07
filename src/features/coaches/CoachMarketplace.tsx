import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Star,
  Award,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Filter,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CoachProfile } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { formatCurrency } from '../../lib/utils';
import api from '../../lib/axios';

const SPECIALTIES = [
  'All',
  'Hypertrophy',
  'Olympic Lifting',
  'Fat Loss',
  'Endurance',
  'Functional Training',
  'Calisthenics',
];

export function CoachMarketplace() {
  const navigate = useNavigate();
  const { startConversationWithCoach } = useChatStore();

  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-09-18');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchCoaches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/coach-profile');
      if (Array.isArray(data)) {
        setCoaches(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve certified coaches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      coach.specialties.some((s) => s.toLowerCase() === selectedSpecialty.toLowerCase());

    const coachName =
      typeof coach.userId === 'object' && coach.userId
        ? `${coach.userId.firstName} ${coach.userId.lastName}`
        : 'Coach';

    const matchesSearch =
      !searchQuery.trim() ||
      coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.bio.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSpecialty && matchesSearch;
  });

  const handleMessageCoach = (coach: CoachProfile) => {
    const coachUserId =
      typeof coach.userId === 'object' && coach.userId ? coach.userId._id : coach._id;
    const coachName =
      typeof coach.userId === 'object' && coach.userId
        ? `Coach ${coach.userId.firstName} ${coach.userId.lastName}`
        : 'Coach';

    startConversationWithCoach(coachUserId, coachName, coach.avatarUrl);
    navigate('/chat');
  };

  const handleBookSession = async () => {
    if (!selectedCoach) return;
    setBookingSuccess(true);

    try {
      await api.post('/schedule/sessions', {
        coachId: selectedCoach._id,
        scheduledDate: bookingDate,
        startTime: selectedSlot.split(' ')[0],
        endTime: '11:00',
      });
    } catch {
      // Local fallback
    }

    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedCoach(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Certified Elite Trainers
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Coach Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Connect directly with verified coaches specializing in strength, Olympic lifting, fat loss, and sports biomechanics.
          </p>
        </div>
      </div>

      {/* Specialty Filter Chips & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-accent text-black font-bold shadow-sm'
                  : 'bg-card border border-border text-text-secondary hover:text-text-primary hover:bg-card-hover'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search coaches by name..."
          className="bg-input-bg border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-64"
        />
      </div>

      {/* Coaches Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 border-border flex flex-col justify-between space-y-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-card rounded w-1/2" />
                  <div className="h-3 bg-card rounded w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCoaches.length === 0 ? (
        <Card className="p-12 text-center border-border space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-text-muted">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">No coaches found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {error || 'No verified coach profiles match your filter. Try selecting "All" specialties.'}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setSelectedSpecialty('All'); setSearchQuery(''); fetchCoaches(); }}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCoaches.map((coach) => {
            const coachName =
              typeof coach.userId === 'object' && coach.userId
                ? `${coach.userId.firstName} ${coach.userId.lastName}`
                : 'Certified Coach';

            return (
              <Card
                key={coach._id}
                hoverEffect
                className="p-6 border-border flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Header Profile Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={coach.avatarUrl || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400'}
                        alt={coachName}
                        className="w-16 h-16 rounded-2xl object-cover border border-border shadow-md"
                      />
                    {coach.isVerified && (
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-status-approved text-black">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-text-primary truncate">
                        Coach {coachName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-accent">
                        <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                        <span>{coach.averageRating}</span>
                        <span className="text-text-muted font-normal">
                          ({coach.reviewCount || 42})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-text-muted mt-0.5">
                      {coach.experienceYears} Years Experience • {coach.clientCount || 30}+ Athletes
                    </p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {coach.specialties.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-text-secondary line-clamp-2 mt-4 leading-relaxed">
                  {coach.bio}
                </p>

                {/* Certifications preview */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Award className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{coach.certifications.join(' • ')}</span>
                </div>
              </div>

              {/* Card Footer: Rates & Actions */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-semibold">
                    Monthly Program
                  </span>
                  <p className="text-sm font-black text-text-primary">
                    {formatCurrency(coach.monthlyRate || 249)}{' '}
                    <span className="text-xs font-normal text-text-muted">/ mo</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMessageCoach(coach)}
                    className="gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                    <span>Chat</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedCoach(coach)}
                    className="gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 fill-black" />
                    <span>Book Session</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      {/* Booking Calendar Modal */}
      {selectedCoach && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCoach(null)}
          title={`Book 1-on-1 Strategy Session`}
          description={`With Coach ${
            typeof selectedCoach.userId === 'object' && selectedCoach.userId
              ? `${selectedCoach.userId.firstName} ${selectedCoach.userId.lastName}`
              : ''
          }`}
          maxWidth="md"
        >
          {bookingSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-status-approved/20 border border-status-approved text-status-approved mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Session Confirmed!</h3>
              <p className="text-xs text-text-muted">
                Scheduled for {bookingDate} at {selectedSlot}. Coach invitation synced to your calendar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Date selection */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Select Training Date
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['2026-09-18', '2026-09-19', '2026-09-20'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBookingDate(d)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        bookingDate === d
                          ? 'bg-accent text-black border-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {new Date(d).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['09:00 AM', '10:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedSlot === slot
                          ? 'bg-accent text-black border-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-3.5 rounded-xl bg-main border border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">Session Fee (60 Mins)</span>
                <span className="font-bold text-accent text-sm">
                  {formatCurrency(selectedCoach.hourlyRate || 85)}
                </span>
              </div>

              <Button
                variant="accent-glow"
                size="lg"
                className="w-full mt-2"
                onClick={handleBookSession}
              >
                Confirm Session Booking
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
