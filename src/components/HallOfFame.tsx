import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Image as ImageIcon,
  Layers,
  MapPin,
  Star,
  Trophy,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  GalleryPhoto,
  HofSubTab,
  QuizPosition,
  QuizRecord,
} from '../types';
import {
  POSITION_OPTIONS,
  POSITION_POINTS,
  StandingsSortMode,
  computeStandings,
} from '../data/initialData';
import {
  FirstGoldCrown,
  PositionCrownOrEmblem,
  SecondSilverCrown,
  ThirdBronzeCrown,
} from './Crowns';

interface HallOfFameProps {
  bsYears: string[];
  quizzes: QuizRecord[];
  gallery: GalleryPhoto[];
}

interface LightboxState {
  photos: { url: string; title: string; subtitle: string }[];
  index: number;
}

export function HallOfFame({ bsYears, quizzes, gallery }: HallOfFameProps) {
  const [subTab, setSubTab] = useState<HofSubTab>('standings');
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Standings filters
  const [standingsYear, setStandingsYear] = useState<string>('all');
  const [standingsSort, setStandingsSort] =
    useState<StandingsSortMode>('points');

  // External Wins filters
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterPosition, setFilterPosition] = useState<string>('');
  const [filterHost, setFilterHost] = useState<string>('');
  const [filterPlayer, setFilterPlayer] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null);
        else if (selectedQuiz) setSelectedQuiz(null);
      }
      if (lightbox && e.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev
            ? { ...prev, index: (prev.index + 1) % prev.photos.length }
            : null
        );
      }
      if (lightbox && e.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index:
                  (prev.index - 1 + prev.photos.length) % prev.photos.length,
              }
            : null
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox, selectedQuiz]);

  const standings = useMemo(
    () => computeStandings(quizzes, standingsYear, standingsSort),
    [quizzes, standingsYear, standingsSort]
  );

  const podiumTop3 = standings.slice(0, 3);

  const uniqueHosts = useMemo(
    () => Array.from(new Set(quizzes.map((q) => q.host).filter(Boolean))).sort(),
    [quizzes]
  );

  const uniquePlayers = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => q.players.forEach((p) => set.add(p.trim())));
    return Array.from(set).filter(Boolean).sort();
  }, [quizzes]);

  const hasAnyFilter = Boolean(
    filterYear || filterPosition || filterHost || filterPlayer
  );

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (filterYear && q.yearBS !== filterYear) return false;
      if (filterPosition && q.position !== filterPosition) return false;
      if (filterHost && q.host !== filterHost) return false;
      if (
        filterPlayer &&
        !q.players.some((p) => p.toLowerCase() === filterPlayer.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [quizzes, filterYear, filterPosition, filterHost, filterPlayer]);

  const groupedGallery = useMemo(() => {
    const map = new Map<
      string,
      { quizName: string; yearBS: string; host: string; items: GalleryPhoto[] }
    >();
    for (const item of gallery) {
      const key = `${item.yearBS}__${item.quizName}`;
      if (!map.has(key)) {
        map.set(key, {
          quizName: item.quizName,
          yearBS: item.yearBS,
          host: item.host,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) =>
      b.yearBS.localeCompare(a.yearBS)
    );
  }, [gallery]);

  const clearAllFilters = () => {
    setFilterYear('');
    setFilterPosition('');
    setFilterHost('');
    setFilterPlayer('');
  };

  const getQuizCardTheme = (position: QuizPosition) => {
    switch (position) {
      case '1st':
        return {
          wrapper:
            'border-[#d4af37]/70 bg-gradient-to-br from-[#1b1608] via-[#0c1c34] to-[#0a1f3a] shadow-[0_14px_40px_rgba(212,175,55,0.22)] hover:border-[#f5dc82] hover:shadow-[0_22px_56px_rgba(212,175,55,0.38)]',
          labelColor: 'text-[#f8e6a0]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(245,220,130,0.24),transparent_65%)]',
        };
      case '2nd':
        return {
          wrapper:
            'border-slate-300/50 bg-gradient-to-br from-[#162235] via-[#0d223f] to-[#0a1f3a] shadow-[0_14px_36px_rgba(203,213,225,0.14)] hover:border-slate-200/85 hover:shadow-[0_20px_50px_rgba(226,232,240,0.26)]',
          labelColor: 'text-slate-200',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(226,232,240,0.18),transparent_65%)]',
        };
      case '3rd':
        return {
          wrapper:
            'border-[#b86b35]/60 bg-gradient-to-br from-[#23150d] via-[#122038] to-[#0a1f3a] shadow-[0_14px_36px_rgba(184,107,53,0.18)] hover:border-[#e69f66] hover:shadow-[0_20px_50px_rgba(184,107,53,0.32)]',
          labelColor: 'text-[#f5c08D]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(184,107,53,0.24),transparent_65%)]',
        };
      case 'Not Qualified':
        return {
          wrapper:
            'border-white/15 bg-gradient-to-br from-[#0e223d] to-[#08172b] hover:border-white/40',
          labelColor: 'text-slate-300',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.10),transparent_65%)]',
        };
      default:
        return {
          wrapper:
            'border-[#d4af37]/30 bg-gradient-to-br from-[#10294b] to-[#0a1f3a] hover:border-[#d4af37]/70',
          labelColor: 'text-[#e9cf7c]',
          aura: 'bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.14),transparent_65%)]',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f3a] text-white">
      {/* Hall of Fame Architectural Header Banner */}
      <div className="border-b border-[#d4af37]/25 bg-gradient-to-b from-[#07162b] to-[#0a1f3a] px-5 pt-10 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="font-mono text-xs tracking-[0.22em] text-[#d4af37] uppercase">
                District Academic Archive
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Hall of Fame
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#f5f5f0]/80 sm:text-base">
                Permanent record of district-level quiz performances, podium
                honors, and competition photography across Bikram Sambat years.
              </p>
            </motion.div>

            {/* Sub-tab Segmented Controls */}
            <div
              role="tablist"
              aria-label="Hall of Fame sections"
              className="inline-flex rounded-xl border border-[#7c4d2b]/60 bg-[#071528] p-1.5 shadow-inner"
            >
              {(
                [
                  { id: 'gallery', label: 'Gallery' },
                  { id: 'standings', label: 'Standings' },
                  { id: 'external-wins', label: 'External Wins' },
                ] as const
              ).map((tab) => {
                const active = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setSubTab(tab.id)}
                    className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                      active
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#e9c85b] text-[#081324] shadow-[0_4px_16px_rgba(212,175,55,0.35)]'
                        : 'text-[#f5f5f0]/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* ================= 1. GALLERY SUB-TAB ================= */}
          {subTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {groupedGallery.length === 0 ? (
                <div className="rounded-2xl border border-[#7c4d2b]/40 bg-[#f5f5f0] p-12 text-center text-[#0a1f3a]">
                  <ImageIcon className="mx-auto h-10 w-10 text-[#7c4d2b]" />
                  <h3 className="mt-3 font-display text-xl font-bold">
                    No Gallery Photographs Yet
                  </h3>
                  <p className="mt-1 text-sm text-[#0a1f3a]/70">
                    Administrators can add past district quiz photos from the
                    Admin Panel.
                  </p>
                </div>
              ) : (
                groupedGallery.map((group, gIdx) => (
                  <motion.section
                    key={`${group.yearBS}-${group.quizName}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.08 }}
                    className="rounded-2xl border border-[#7c4d2b]/50 bg-[#f5f5f0] p-6 text-[#0a1f3a] shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-8"
                  >
                    <div className="flex flex-col justify-between gap-2 border-b border-[#7c4d2b]/20 pb-4 sm:flex-row sm:items-end">
                      <div>
                        <p className="font-mono text-xs font-semibold tracking-wider text-[#7c4d2b]">
                          {group.yearBS} B.S. · {group.host}
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-[#0a1f3a]">
                          {group.quizName}
                        </h2>
                      </div>
                      <span className="text-xs font-medium text-[#7c4d2b]">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'Photograph' : 'Photographs'}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((photo, pIdx) => (
                        <motion.button
                          key={photo.id}
                          type="button"
                          whileHover={{ y: -5, scale: 1.01 }}
                          onClick={() =>
                            setLightbox({
                              photos: group.items.map((i) => ({
                                url: i.imageUrl,
                                title: i.quizName,
                                subtitle: `${i.yearBS} B.S. · ${i.caption}`,
                              })),
                              index: pIdx,
                            })
                          }
                          className="group relative overflow-hidden rounded-xl border-4 border-[#6c4123] bg-[#0a1f3a] text-left shadow-md transition-shadow hover:shadow-xl cursor-pointer"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#0a1f3a]">
                            <img
                              src={photo.imageUrl}
                              alt={photo.caption || photo.quizName}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 transition-opacity group-hover:opacity-100" />
                          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-[#f5dc82] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            <ZoomIn className="h-4 w-4" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <p className="line-clamp-2 text-xs leading-snug font-medium text-[#f5f5f0]">
                              {photo.caption}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.section>
                ))
              )}
            </motion.div>
          )}

          {/* ================= 2. STANDINGS SUB-TAB (CLEAN, UNCONGESTED GOLD & BLACK TROPHY) ================= */}
          {subTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-[#d4af37]/40 bg-[#08080a] p-6 text-[#f5f2eb] shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-10"
            >
              {/* Header & Filters */}
              <div className="flex flex-col justify-between gap-5 border-b border-[#d4af37]/20 pb-7 lg:flex-row lg:items-end">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
                    Championship Leaderboard
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-bold text-[#f8e6a0] sm:text-3xl">
                    District Standings
                  </h2>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Ranked by Points, then oldest 1st quiz played, then D-first
                    alphabetical order · 1st (6) · 2nd (5) · 3rd (4) · 4th (3) ·
                    5th (2) · 6th (1) · NQ (0)
                  </p>
                </div>

                {/* Standings Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label="Filter standings by year"
                    value={standingsYear}
                    onChange={(e) => setStandingsYear(e.target.value)}
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 font-mono text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All B.S. Years</option>
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Sort standings by category"
                    value={standingsSort}
                    onChange={(e) =>
                      setStandingsSort(e.target.value as StandingsSortMode)
                    }
                    className="rounded-xl border border-[#d4af37]/40 bg-[#12110d] px-3.5 py-2.5 text-xs font-semibold text-[#f8e6a0] focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="points">Sort: Highest Points</option>
                    <option value="most-1st">Filter: Most 1st</option>
                    <option value="most-2nd">Filter: Most 2nd</option>
                    <option value="most-3rd">Filter: Most 3rd</option>
                    <option value="most-4th">Filter: Most 4th</option>
                    <option value="most-5th">Filter: Most 5th</option>
                    <option value="most-6th">Filter: Most 6th</option>
                    <option value="most-quizzes">
                      Filter: Most Quizzes Played
                    </option>
                  </select>
                </div>
              </div>

              {/* MID-SIZED PODIUM FOR 1st, 2nd, 3rd */}
              {podiumTop3.length > 0 && (
                <div className="mt-9 pb-8">
                  <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-4 sm:gap-7">
                    {/* 2nd Place (Silver Pillar) */}
                    {podiumTop3[1] ? (
                      <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.16 }}
                        whileHover={{ y: -4 }}
                        className="flex flex-col items-center text-center"
                      >
                        <SecondSilverCrown className="h-11 w-11 sm:h-12 sm:w-12" />
                        <p className="mt-2 max-w-full truncate font-display text-sm font-bold text-slate-100 sm:text-base">
                          {podiumTop3[1].player}
                        </p>
                        <p className="font-mono text-xs text-slate-300 tabular-nums">
                          {podiumTop3[1].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.65,
                            delay: 0.22,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-24 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-slate-300/50 bg-gradient-to-b from-slate-300/25 via-slate-500/15 to-[#0d0d10] px-2 sm:h-28"
                        >
                          <span className="font-display text-xl font-extrabold text-slate-200 sm:text-2xl">
                            2nd
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {podiumTop3[1].qualified}/{podiumTop3[1].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div />
                    )}

                    {/* 1st Place (Tall Golden Pillar) */}
                    {podiumTop3[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center text-center"
                      >
                        <FirstGoldCrown className="h-12 w-12 sm:h-14 sm:w-14" />
                        <p className="mt-2 max-w-full truncate font-display text-base font-bold text-[#f8e6a0] sm:text-lg">
                          {podiumTop3[0].player}
                        </p>
                        <p className="font-mono text-xs font-semibold text-[#d4af37] tabular-nums">
                          {podiumTop3[0].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.78,
                            delay: 0.12,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-32 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-[#f5dc82]/75 bg-gradient-to-b from-[#f0cb65]/45 via-[#b8861b]/25 to-[#120f08] px-2 shadow-[0_-12px_36px_rgba(212,175,55,0.3)] sm:h-36"
                        >
                          <span className="font-display text-2xl font-extrabold text-[#fff2b8] sm:text-3xl">
                            1st
                          </span>
                          <span className="font-mono text-[11px] text-[#f5dc82]">
                            {podiumTop3[0].qualified}/{podiumTop3[0].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* 3rd Place (Bronze / Warm Wood Pillar) */}
                    {podiumTop3[2] ? (
                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        whileHover={{ y: -4 }}
                        className="flex flex-col items-center text-center"
                      >
                        <ThirdBronzeCrown className="h-10 w-10 sm:h-11 sm:w-11" />
                        <p className="mt-2 max-w-full truncate font-display text-sm font-bold text-[#f5c08D] sm:text-base">
                          {podiumTop3[2].player}
                        </p>
                        <p className="font-mono text-xs text-[#d69560] tabular-nums">
                          {podiumTop3[2].points} pts
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.32,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: 'bottom' }}
                          className="sheen-hover mt-3 flex h-20 w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 border-[#b86b35]/60 bg-gradient-to-b from-[#b86b35]/30 via-[#6c3c1b]/20 to-[#110c09] px-2 sm:h-24"
                        >
                          <span className="font-display text-lg font-extrabold text-[#f5c08D] sm:text-xl">
                            3rd
                          </span>
                          <span className="font-mono text-[11px] text-[#d69560]">
                            {podiumTop3[2].qualified}/{podiumTop3[2].totalQuizzes}{' '}
                            Qual.
                          </span>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )}

              {/* SPACIOUS, UNCONGESTED GOLD & BLACK STANDINGS TABLE */}
              {standings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#11100d] p-10 text-center">
                  <Trophy className="mx-auto h-9 w-9 text-[#d4af37]/60" />
                  <p className="mt-3 text-sm text-neutral-300">
                    No quiz records found for this filter.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table: Position | Player Name | 1st..6th | Total Quizzes | Qualified | Points */}
                  <div className="mt-4 hidden overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-[#0d0c09] md:block">
                    <table className="w-full table-fixed border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#d4af37]/30 bg-gradient-to-r from-[#1a1509] via-[#13110b] to-[#1a1509] font-mono text-xs tracking-wider text-[#f5dc82] uppercase">
                          <th className="w-[9%] py-4 pl-5 pr-2">Pos</th>
                          <th className="w-[24%] py-4 px-2">Player Name</th>
                          <th className="w-[6.5%] py-4 text-center">1st</th>
                          <th className="w-[6.5%] py-4 text-center">2nd</th>
                          <th className="w-[6.5%] py-4 text-center">3rd</th>
                          <th className="w-[6.5%] py-4 text-center">4th</th>
                          <th className="w-[6.5%] py-4 text-center">5th</th>
                          <th className="w-[6.5%] py-4 text-center">6th</th>
                          <th className="w-[10%] py-4 text-center">
                            Quizzes
                          </th>
                          <th className="w-[9%] py-4 text-center">
                            Qualified
                          </th>
                          <th className="w-[9%] py-4 pr-5 text-right">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4af37]/12 text-sm tabular-nums">
                        {standings.map((row, idx) => (
                          <motion.tr
                            key={row.player}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: idx * 0.05,
                            }}
                            className={`group transition-colors duration-200 hover:bg-[#d4af37]/12 ${
                              idx === 0
                                ? 'bg-[#d4af37]/8'
                                : idx === 1
                                  ? 'bg-white/[0.03]'
                                  : idx === 2
                                    ? 'bg-[#b86b35]/[0.06]'
                                    : ''
                            }`}
                          >
                            <td className="py-4 pl-5 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#d4af37]">
                                  #{idx + 1}
                                </span>
                                {idx === 0 && (
                                  <FirstGoldCrown className="h-5 w-5" />
                                )}
                                {idx === 1 && (
                                  <SecondSilverCrown className="h-5 w-5" />
                                )}
                                {idx === 2 && (
                                  <ThirdBronzeCrown className="h-5 w-5" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <span className="block truncate font-semibold text-[#f8f5ee] group-hover:text-[#f8e6a0]">
                                {row.player}
                              </span>
                            </td>
                            <td className="py-4 text-center font-mono font-semibold text-[#f8e6a0]">
                              {row.first}
                            </td>
                            <td className="py-4 text-center font-mono text-slate-200">
                              {row.second}
                            </td>
                            <td className="py-4 text-center font-mono text-[#f5c08D]">
                              {row.third}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.fourth}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.fifth}
                            </td>
                            <td className="py-4 text-center font-mono text-neutral-300">
                              {row.sixth}
                            </td>
                            <td className="py-4 text-center font-mono font-medium text-white">
                              {row.totalQuizzes}
                            </td>
                            <td className="py-4 text-center font-mono text-emerald-300">
                              {row.qualified}
                            </td>
                            <td className="py-4 pr-5 text-right font-mono text-base font-bold text-[#f0cb65]">
                              {row.points}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Trophy Cards (Zero sideways scroll!) */}
                  <div className="mt-4 space-y-3.5 md:hidden">
                    {standings.map((row, idx) => (
                      <motion.div
                        key={row.player}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-2xl border border-[#d4af37]/30 bg-[#100e0a] p-4"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/15 pb-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#d4af37]">
                              #{idx + 1}
                            </span>
                            {idx === 0 && (
                              <FirstGoldCrown className="h-5 w-5 shrink-0" />
                            )}
                            {idx === 1 && (
                              <SecondSilverCrown className="h-5 w-5 shrink-0" />
                            )}
                            {idx === 2 && (
                              <ThirdBronzeCrown className="h-5 w-5 shrink-0" />
                            )}
                            <span className="truncate font-display text-base font-bold text-[#f8e6a0]">
                              {row.player}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-bold text-[#f0cb65]">
                            {row.points} pts
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-6 gap-1.5 text-center font-mono text-xs tabular-nums">
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5dc82]">
                              1st
                            </span>
                            <span className="font-bold text-white">
                              {row.first}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-slate-300">
                              2nd
                            </span>
                            <span className="font-bold text-white">
                              {row.second}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-[#f5c08D]">
                              3rd
                            </span>
                            <span className="font-bold text-white">
                              {row.third}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              4th
                            </span>
                            <span className="font-bold text-white">
                              {row.fourth}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              5th
                            </span>
                            <span className="font-bold text-white">
                              {row.fifth}
                            </span>
                          </div>
                          <div className="rounded bg-white/5 py-1.5">
                            <span className="block text-[10px] text-neutral-400">
                              6th
                            </span>
                            <span className="font-bold text-white">
                              {row.sixth}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-neutral-400">
                          <span>Total Quizzes: {row.totalQuizzes}</span>
                          <span className="text-emerald-300">
                            Qualified: {row.qualified}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ================= 3. EXTERNAL WINS SUB-TAB (YEARWISE + FILTERS) ================= */}
          {subTab === 'external-wins' && (
            <motion.div
              key="external-wins"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col justify-between gap-5 rounded-2xl border border-[#d4af37]/30 bg-[#07162b] p-5 shadow-lg lg:flex-row lg:items-center">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    External Wins & Yearwise Archive
                  </h2>
                  <p className="mt-1 text-xs text-[#f5f5f0]/75">
                    Select a Bikram Sambat year below or combine filters in the
                    top corner. Click any quiz box to reveal full details.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
                  <select
                    aria-label="Filter by B.S. Year"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 font-mono text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Years (B.S.)</option>
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Position"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Positions</option>
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Host"
                    value={filterHost}
                    onChange={(e) => setFilterHost(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Hosts</option>
                    {uniqueHosts.map((host) => (
                      <option key={host} value={host}>
                        {host}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by Player"
                    value={filterPlayer}
                    onChange={(e) => setFilterPlayer(e.target.value)}
                    className="rounded-lg border border-[#d4af37]/35 bg-[#0a1f3a] px-3 py-2 text-xs text-white focus:border-[#f0cb65] focus:outline-none cursor-pointer"
                  >
                    <option value="">All Players</option>
                    {uniquePlayers.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>

                  {hasAnyFilter && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#d4af37]/15 px-3 py-2 text-xs font-semibold text-[#f8e6a0] transition-colors hover:bg-[#d4af37]/25 cursor-pointer sm:col-span-1"
                    >
                      <FilterX className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {!hasAnyFilter ? (
                <div className="mt-8">
                  <p className="mb-4 font-mono text-xs tracking-wider text-[#d4af37] uppercase">
                    Choose a Bikram Sambat Year
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {bsYears.map((yr, idx) => {
                      const yearQuizzes = quizzes.filter(
                        (q) => q.yearBS === yr
                      );
                      const firstCount = yearQuizzes.filter(
                        (q) => q.position === '1st'
                      ).length;

                      return (
                        <motion.button
                          key={yr}
                          type="button"
                          initial={{ opacity: 0, y: 20, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: idx * 0.07 }}
                          whileHover={{ y: -6, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFilterYear(yr)}
                          className="sheen-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#0e2a4d] via-[#0a1f3a] to-[#071528] p-6 text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-colors hover:border-[#f5dc82] cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-3xl font-bold tracking-tight text-[#f8e6a0] group-hover:text-white">
                              {yr}
                            </span>
                            <div className="rounded-xl border border-[#7c4d2b]/60 bg-[#7c4d2b]/25 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#f5c08D]">
                              B.S.
                            </div>
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#f5f5f0]/80">
                            <span>
                              {yearQuizzes.length}{' '}
                              {yearQuizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                            </span>
                            {firstCount > 0 && (
                              <span className="font-semibold text-[#f0cb65]">
                                {firstCount} Gold {firstCount === 1 ? 'Win' : 'Wins'}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-[#07162b] px-3.5 py-2 text-xs font-semibold text-[#f8e6a0] transition-colors hover:border-[#f0cb65] hover:bg-[#0f294a] cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to All Years</span>
                    </button>

                    <p className="font-mono text-xs text-[#f5f5f0]/80">
                      Showing {filteredQuizzes.length}{' '}
                      {filteredQuizzes.length === 1 ? 'record' : 'records'}
                      {filterYear ? ` · ${filterYear} B.S.` : ''}
                    </p>
                  </div>

                  {filteredQuizzes.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-[#07162b] p-12 text-center">
                      <Trophy className="mx-auto h-10 w-10 text-[#d4af37]/50" />
                      <h3 className="mt-3 font-display text-xl font-bold text-white">
                        No Matching Quiz Records
                      </h3>
                      <p className="mt-1 text-sm text-[#f5f5f0]/70">
                        Try clearing one of your active filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredQuizzes.map((quiz, idx) => {
                        const theme = getQuizCardTheme(quiz.position);
                        return (
                          <motion.button
                            key={quiz.id}
                            type="button"
                            initial={{ opacity: 0, y: 22, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.42,
                              delay: idx * 0.06,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            whileHover={{ y: -7, scale: 1.02 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => setSelectedQuiz(quiz)}
                            className={`sheen-hover group relative flex min-h-[215px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all duration-300 cursor-pointer ${theme.wrapper}`}
                          >
                            <div
                              aria-hidden="true"
                              className={`pointer-events-none absolute inset-0 ${theme.aura}`}
                            />

                            <div className="relative z-10 flex flex-col items-center">
                              <PositionCrownOrEmblem
                                position={quiz.position}
                                className="h-14 w-14"
                              />
                              <span
                                className={`mt-3 font-mono text-xs font-bold tracking-wider uppercase ${theme.labelColor}`}
                              >
                                {quiz.position === 'Not Qualified'
                                  ? 'Not Qualified'
                                  : `${quiz.position} Place`}
                              </span>
                              <h3 className="mt-2 font-display text-lg font-bold leading-snug text-white group-hover:text-[#f8e6a0]">
                                {quiz.quizName}
                              </h3>
                              <span className="mt-4 text-[11px] font-medium text-white/55 transition-colors group-hover:text-white/90">
                                Click to inspect details
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUIZ DETAIL POP-UP MODAL */}
      <AnimatePresence>
        {selectedQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQuiz(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4af37]/50 bg-[#08192f] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.75)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <PositionCrownOrEmblem
                    position={selectedQuiz.position}
                    className="h-14 w-14 shrink-0"
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#f5dc82]">
                      {selectedQuiz.yearBS} B.S. ·{' '}
                      {selectedQuiz.position === 'Not Qualified'
                        ? 'Not Qualified'
                        : `${selectedQuiz.position} Place`}{' '}
                      ({POSITION_POINTS[selectedQuiz.position]} pts)
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-white">
                      {selectedQuiz.quizName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuiz(null)}
                  aria-label="Close quiz details"
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <MapPin className="h-4 w-4" />
                    <span>Host / Organizer</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    {selectedQuiz.host}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Calendar className="h-4 w-4" />
                    <span>Year & Teams</span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {selectedQuiz.yearBS} B.S. · {selectedQuiz.teamCount} Teams
                    Competed
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Users className="h-4 w-4" />
                    <span>Participating Players</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[#f5f5f0]">
                    {selectedQuiz.players.join(', ')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b2340] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
                    <Star className="h-4 w-4" />
                    <span>Overall Performance Rating</span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-bold text-[#f8e6a0]">
                    {selectedQuiz.rating} / 10
                  </p>
                </div>
              </div>

              {selectedQuiz.extraNote && (
                <div className="mt-5 rounded-xl border border-[#7c4d2b]/50 bg-[#f5f5f0] p-4 text-[#0a1f3a]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7c4d2b] uppercase">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Archivist Note</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    {selectedQuiz.extraNote}
                  </p>
                </div>
              )}

              {selectedQuiz.photos.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 font-mono text-xs font-semibold text-[#d4af37] uppercase">
                    Attached Photographs
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedQuiz.photos.map((url, pIdx) => (
                      <button
                        key={`${url}-${pIdx}`}
                        type="button"
                        onClick={() =>
                          setLightbox({
                            photos: selectedQuiz.photos.map((u) => ({
                              url: u,
                              title: selectedQuiz.quizName,
                              subtitle: `${selectedQuiz.yearBS} B.S. · ${selectedQuiz.host}`,
                            })),
                            index: pIdx,
                          })
                        }
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-[#7c4d2b] cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`${selectedQuiz.quizName} photo ${pIdx + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-[#f8e6a0]" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close lightbox"
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {lightbox.photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index:
                              (prev.index - 1 + prev.photos.length) %
                              prev.photos.length,
                          }
                        : null
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.photos.length,
                          }
                        : null
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-4xl overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#090d14] shadow-2xl"
            >
              <img
                src={lightbox.photos[lightbox.index].url}
                alt={lightbox.photos[lightbox.index].title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-full object-contain bg-black"
              />
              <div className="border-t border-white/10 p-4 text-center">
                <p className="font-display text-lg font-bold text-[#f8e6a0]">
                  {lightbox.photos[lightbox.index].title}
                </p>
                <p className="mt-1 text-xs text-neutral-300">
                  {lightbox.photos[lightbox.index].subtitle}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
