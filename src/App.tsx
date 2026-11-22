import { useEffect, useRef, useState } from 'react';
import { Lock, LogOut, Menu, X } from 'lucide-react';
import {
  AchievementDef,
  AuctionItem,
  DqrUser,
  EgoReport,
  GalleryPhoto,
  IntroSettings,
  LevelRange,
  MainTab,
  NewspaperEdition,
  PastWinnerRecord,
  QuizRecord,
  RankDef,
  RivalHistoryEvent,
  RivalRecord,
  StreakBand,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  Territory,
  TitleItem,
  UserWeeklyTracker,
  VerdictRecord,
} from './types';
import {
  buildUserSnapshot,
  countUserTerritories,
  formatRivalDate,
  parseQuestionsCount,
  resolveRank,
} from './utils/rivalHelpers';
import {
  createFreshWeeklySummary,
  createInitialWeeklyTracker,
  getWeekStartIso,
} from './utils/weeklyHelpers';
import {
  INITIAL_AUCTIONS,
  INITIAL_BS_YEARS,
  INITIAL_CHALLENGES,
  INITIAL_EGO_REPORTS,
  INITIAL_GALLERY,
  INITIAL_GUIDANCE,
  INITIAL_INTRO_SETTINGS,
  INITIAL_NEWSPAPER,
  INITIAL_PAST_WINNERS,
  INITIAL_PREDICTIONS,
  INITIAL_QUIZZES,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_SYSTEM_MESSAGES,
  INITIAL_TERRITORIES,
  INITIAL_USERS,
  INITIAL_VERDICTS,
} from './data/initialData';
import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_LEVEL_RANGES,
  DEFAULT_RANKS,
  DEFAULT_STREAK_BANDS,
  FIFTY_TITLE_PRESETS,
} from './data/presets';
import { IntroductionPage } from './components/IntroductionPage';
import { HallOfFame } from './components/HallOfFame';
import { AscensionPath } from './components/AscensionPath';
import { TerritoriesPage } from './components/TerritoriesPage';
import { NewspaperPage } from './components/NewspaperPage';
import { SystemPage } from './components/SystemPage';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  loadAllStoreFromSupabase,
  saveStoreToSupabase,
} from './lib/supabase';

const STORAGE_KEYS = {
  intro: 'dqr_v2_intro',
  years: 'dqr_v2_years',
  quizzes: 'dqr_v2_quizzes',
  gallery: 'dqr_v2_gallery',
  users: 'dqr_v2_users',
  session: 'dqr_v2_session',
  ranks: 'dqr_v2_ranks',
  levels: 'dqr_v2_levels',
  streaks: 'dqr_v2_streaks',
  titles: 'dqr_v2_titles',
  auctions: 'dqr_v2_auctions',
  pastWinners: 'dqr_v2_past_winners',
  territories: 'dqr_v2_territories',
  newspaper: 'dqr_v2_newspaper',
  sysConfig: 'dqr_v2_sys_config',
  sysMsgs: 'dqr_v2_sys_msgs',
  predictions: 'dqr_v2_predictions',
  guidance: 'dqr_v2_guidance',
  challenges: 'dqr_v2_challenges',
  egoReports: 'dqr_v2_ego_reports',
  verdicts: 'dqr_v2_verdicts',
  rivalries: 'dqr_v2_rivalries',
  weeklyTrackers: 'dqr_v2_weekly_trackers',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [pendingTab, setPendingTab] = useState<MainTab | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [introSettings, setIntroSettings] = useState<IntroSettings>(() =>
    loadStored(STORAGE_KEYS.intro, INITIAL_INTRO_SETTINGS)
  );
  const [bsYears, setBsYears] = useState<string[]>(() =>
    loadStored(STORAGE_KEYS.years, INITIAL_BS_YEARS)
  );
  const [quizzes, setQuizzes] = useState<QuizRecord[]>(() =>
    loadStored(STORAGE_KEYS.quizzes, INITIAL_QUIZZES)
  );
  const [gallery, setGallery] = useState<GalleryPhoto[]>(() =>
    loadStored(STORAGE_KEYS.gallery, INITIAL_GALLERY)
  );
  const [users, setUsers] = useState<DqrUser[]>(() =>
    loadStored(STORAGE_KEYS.users, INITIAL_USERS)
  );
  // Logged out by default unless a verified session was stored
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    loadStored<string | null>(STORAGE_KEYS.session, null)
  );

  const [ranks, setRanks] = useState<RankDef[]>(() =>
    loadStored(STORAGE_KEYS.ranks, DEFAULT_RANKS)
  );
  const [levelRanges, setLevelRanges] = useState<LevelRange[]>(() =>
    loadStored(STORAGE_KEYS.levels, DEFAULT_LEVEL_RANGES)
  );
  const [streakBands, setStreakBands] = useState<StreakBand[]>(() =>
    loadStored(STORAGE_KEYS.streaks, DEFAULT_STREAK_BANDS)
  );
  const [titles, setTitles] = useState<TitleItem[]>(() =>
    loadStored(STORAGE_KEYS.titles, FIFTY_TITLE_PRESETS)
  );
  const [achievements] = useState<AchievementDef[]>(DEFAULT_ACHIEVEMENTS);
  const [auctions, setAuctions] = useState<AuctionItem[]>(() =>
    loadStored(STORAGE_KEYS.auctions, INITIAL_AUCTIONS)
  );
  const [pastWinners, setPastWinners] = useState<PastWinnerRecord[]>(() =>
    loadStored(STORAGE_KEYS.pastWinners, INITIAL_PAST_WINNERS)
  );
  const [territories, setTerritories] = useState<Territory[]>(() =>
    loadStored(STORAGE_KEYS.territories, INITIAL_TERRITORIES)
  );
  const [newspaper, setNewspaper] = useState<NewspaperEdition>(() =>
    loadStored(STORAGE_KEYS.newspaper, INITIAL_NEWSPAPER)
  );
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() =>
    loadStored(STORAGE_KEYS.sysConfig, INITIAL_SYSTEM_CONFIG)
  );
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>(() =>
    loadStored(STORAGE_KEYS.sysMsgs, INITIAL_SYSTEM_MESSAGES)
  );
  const [predictions, setPredictions] = useState<SystemPrediction[]>(() =>
    loadStored(STORAGE_KEYS.predictions, INITIAL_PREDICTIONS)
  );
  const [guidance, setGuidance] = useState<SystemGuidanceItem[]>(() =>
    loadStored(STORAGE_KEYS.guidance, INITIAL_GUIDANCE)
  );
  const [challenges, setChallenges] = useState<SystemChallenge[]>(() =>
    loadStored(STORAGE_KEYS.challenges, INITIAL_CHALLENGES)
  );
  const [egoReports, setEgoReports] = useState<EgoReport[]>(() =>
    loadStored(STORAGE_KEYS.egoReports, INITIAL_EGO_REPORTS)
  );
  const [verdicts, setVerdicts] = useState<VerdictRecord[]>(() =>
    loadStored(STORAGE_KEYS.verdicts, INITIAL_VERDICTS)
  );
  const [rivalries, setRivalries] = useState<RivalRecord[]>(() =>
    loadStored(STORAGE_KEYS.rivalries, [])
  );
  const [weeklyTrackers, setWeeklyTrackers] = useState<
    Record<string, UserWeeklyTracker>
  >(() => loadStored(STORAGE_KEYS.weeklyTrackers, {}));

  const supabaseHydratedRef = useRef(false);
  const lastSyncedJsonRef = useRef<Record<string, string>>({});
  const skipNextRivalDiffRef = useRef(false);
  const prevRivalSnapshotRef = useRef<{
    users: Record<
      string,
      { xp: number; rankId: string; streak: number; questions: number }
    >;
    territoryCounts: Record<string, number>;
    challengeCompletions: Record<string, string[]>;
  } | null>(null);

  // Hydrate shared state from Supabase on initial load
  useEffect(() => {
    let active = true;
    (async () => {
      const remote = await loadAllStoreFromSupabase();
      if (!active) return;

      if (remote[STORAGE_KEYS.intro])
        setIntroSettings(remote[STORAGE_KEYS.intro] as IntroSettings);
      if (remote[STORAGE_KEYS.years])
        setBsYears(remote[STORAGE_KEYS.years] as string[]);
      if (remote[STORAGE_KEYS.quizzes])
        setQuizzes(remote[STORAGE_KEYS.quizzes] as QuizRecord[]);
      if (remote[STORAGE_KEYS.gallery])
        setGallery(remote[STORAGE_KEYS.gallery] as GalleryPhoto[]);
      if (remote[STORAGE_KEYS.users])
        setUsers(remote[STORAGE_KEYS.users] as DqrUser[]);
      if (remote[STORAGE_KEYS.ranks])
        setRanks(remote[STORAGE_KEYS.ranks] as RankDef[]);
      if (remote[STORAGE_KEYS.levels])
        setLevelRanges(remote[STORAGE_KEYS.levels] as LevelRange[]);
      if (remote[STORAGE_KEYS.streaks])
        setStreakBands(remote[STORAGE_KEYS.streaks] as StreakBand[]);
      if (remote[STORAGE_KEYS.titles])
        setTitles(remote[STORAGE_KEYS.titles] as TitleItem[]);
      if (remote[STORAGE_KEYS.auctions])
        setAuctions(remote[STORAGE_KEYS.auctions] as AuctionItem[]);
      if (remote[STORAGE_KEYS.pastWinners])
        setPastWinners(remote[STORAGE_KEYS.pastWinners] as PastWinnerRecord[]);
      if (remote[STORAGE_KEYS.territories])
        setTerritories(remote[STORAGE_KEYS.territories] as Territory[]);
      if (remote[STORAGE_KEYS.newspaper])
        setNewspaper(remote[STORAGE_KEYS.newspaper] as NewspaperEdition);
      if (remote[STORAGE_KEYS.sysConfig])
        setSystemConfig(remote[STORAGE_KEYS.sysConfig] as SystemConfig);
      if (remote[STORAGE_KEYS.sysMsgs])
        setSystemMessages(remote[STORAGE_KEYS.sysMsgs] as SystemMessage[]);
      if (remote[STORAGE_KEYS.predictions])
        setPredictions(remote[STORAGE_KEYS.predictions] as SystemPrediction[]);
      if (remote[STORAGE_KEYS.guidance])
        setGuidance(remote[STORAGE_KEYS.guidance] as SystemGuidanceItem[]);
      if (remote[STORAGE_KEYS.challenges])
        setChallenges(remote[STORAGE_KEYS.challenges] as SystemChallenge[]);
      if (remote[STORAGE_KEYS.egoReports])
        setEgoReports(remote[STORAGE_KEYS.egoReports] as EgoReport[]);
      if (remote[STORAGE_KEYS.verdicts])
        setVerdicts(remote[STORAGE_KEYS.verdicts] as VerdictRecord[]);
      if (remote[STORAGE_KEYS.rivalries])
        setRivalries(remote[STORAGE_KEYS.rivalries] as RivalRecord[]);
      if (remote[STORAGE_KEYS.weeklyTrackers])
        setWeeklyTrackers(
          remote[STORAGE_KEYS.weeklyTrackers] as Record<
            string,
            UserWeeklyTracker
          >
        );

      if (
        remote[STORAGE_KEYS.users] ||
        remote[STORAGE_KEYS.territories] ||
        remote[STORAGE_KEYS.challenges]
      ) {
        skipNextRivalDiffRef.current = true;
      }

      for (const [k, v] of Object.entries(remote)) {
        lastSyncedJsonRef.current[k] = JSON.stringify(v);
      }
      supabaseHydratedRef.current = true;
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist to localStorage & sync changed slices to Supabase dqr_app_store
  useEffect(() => {
    const entries: [string, unknown][] = [
      [STORAGE_KEYS.intro, introSettings],
      [STORAGE_KEYS.years, bsYears],
      [STORAGE_KEYS.quizzes, quizzes],
      [STORAGE_KEYS.gallery, gallery],
      [STORAGE_KEYS.users, users],
      [STORAGE_KEYS.ranks, ranks],
      [STORAGE_KEYS.levels, levelRanges],
      [STORAGE_KEYS.streaks, streakBands],
      [STORAGE_KEYS.titles, titles],
      [STORAGE_KEYS.auctions, auctions],
      [STORAGE_KEYS.pastWinners, pastWinners],
      [STORAGE_KEYS.territories, territories],
      [STORAGE_KEYS.newspaper, newspaper],
      [STORAGE_KEYS.sysConfig, systemConfig],
      [STORAGE_KEYS.sysMsgs, systemMessages],
      [STORAGE_KEYS.predictions, predictions],
      [STORAGE_KEYS.guidance, guidance],
      [STORAGE_KEYS.challenges, challenges],
      [STORAGE_KEYS.egoReports, egoReports],
      [STORAGE_KEYS.verdicts, verdicts],
      [STORAGE_KEYS.rivalries, rivalries],
      [STORAGE_KEYS.weeklyTrackers, weeklyTrackers],
    ];

    try {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(currentUserId));
      for (const [k, val] of entries) {
        localStorage.setItem(k, JSON.stringify(val));
      }
    } catch {
      // Ignore quota exceeded on large fallback assets
    }

    if (!supabaseHydratedRef.current) return;

    const timer = setTimeout(() => {
      for (const [k, val] of entries) {
        const serialized = JSON.stringify(val);
        if (lastSyncedJsonRef.current[k] !== serialized) {
          lastSyncedJsonRef.current[k] = serialized;
          void saveStoreToSupabase(k, val);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    introSettings,
    bsYears,
    quizzes,
    gallery,
    users,
    currentUserId,
    ranks,
    levelRanges,
    streakBands,
    titles,
    auctions,
    pastWinners,
    territories,
    newspaper,
    systemConfig,
    systemMessages,
    predictions,
    guidance,
    challenges,
    egoReports,
    verdicts,
    rivalries,
    weeklyTrackers,
  ]);

  // Track changes in XP earned (gains only), territories, streak, questions, rank, and completed challenges for active rivalries
  useEffect(() => {
    const nextUsersSnap: Record<
      string,
      { xp: number; rankId: string; streak: number; questions: number }
    > = {};
    const nextTerrCounts: Record<string, number> = {};
    for (const u of users) {
      nextUsersSnap[u.id] = {
        xp: u.xp,
        rankId: u.rankId,
        streak: u.streak,
        questions: parseQuestionsCount(u.reportCard?.totalQuestionsStudied),
      };
      nextTerrCounts[u.id] = countUserTerritories(u.id, territories);
    }

    const nextChalSnap: Record<string, string[]> = {};
    for (const c of challenges) {
      nextChalSnap[c.id] = [...c.completedByUserIds];
    }

    const currentSnap = {
      users: nextUsersSnap,
      territoryCounts: nextTerrCounts,
      challengeCompletions: nextChalSnap,
    };

    const isInitialOrHydration =
      !prevRivalSnapshotRef.current || skipNextRivalDiffRef.current;
    const prevSnap = prevRivalSnapshotRef.current;
    prevRivalSnapshotRef.current = currentSnap;
    if (skipNextRivalDiffRef.current) {
      skipNextRivalDiffRef.current = false;
    }

    // Update weekly trackers (ensure baseline, handle week rollover, and accumulate weekly gains)
    const currentWeekIso = getWeekStartIso(new Date());
    setWeeklyTrackers((prevTrackers) => {
      let changed = false;
      const nextTrackers: Record<string, UserWeeklyTracker> = { ...prevTrackers };

      for (const u of users) {
        const nextU = nextUsersSnap[u.id];
        const nextTerr = nextTerrCounts[u.id] ?? 0;
        const existing = nextTrackers[u.id];

        if (!existing) {
          nextTrackers[u.id] = createInitialWeeklyTracker(u, territories);
          changed = true;
          continue;
        }

        if (existing.activeWeek.weekStartIso !== currentWeekIso) {
          const archivedWeek = {
            ...existing.activeWeek,
            dismissedEndOfWeek: false,
          };
          nextTrackers[u.id] = {
            activeWeek: createFreshWeeklySummary(u, territories, currentWeekIso),
            completedWeeks: [archivedWeek, ...existing.completedWeeks].slice(0, 12),
          };
          changed = true;
          continue;
        }

        if (!isInitialOrHydration && prevSnap) {
          const prevU = prevSnap.users[u.id];
          const prevTerr = prevSnap.territoryCounts[u.id] ?? 0;
          const xpGain = prevU && nextU.xp > prevU.xp ? nextU.xp - prevU.xp : 0;
          const terrGain = nextTerr > prevTerr ? nextTerr - prevTerr : 0;

          if (
            xpGain > 0 ||
            terrGain > 0 ||
            existing.activeWeek.currentQuestions !== nextU.questions ||
            existing.activeWeek.currentStreak !== nextU.streak ||
            existing.activeWeek.currentTerritories !== nextTerr
          ) {
            nextTrackers[u.id] = {
              ...existing,
              activeWeek: {
                ...existing.activeWeek,
                xpEarned: existing.activeWeek.xpEarned + xpGain,
                currentQuestions: nextU.questions,
                currentStreak: nextU.streak,
                territoriesAcquired:
                  existing.activeWeek.territoriesAcquired + terrGain,
                currentTerritories: nextTerr,
              },
            };
            changed = true;
          }
        }
      }

      return changed ? nextTrackers : prevTrackers;
    });

    if (isInitialOrHydration || !prevSnap) {
      return;
    }

    const now = Date.now();
    const dateLabel = formatRivalDate(now);

    setRivalries((prevRivalries) => {
      let anyUpdated = false;
      const updated = prevRivalries.map((r) => {
        if (r.status !== 'active') return r;

        let nextReqEarned = r.requesterEarnedXp;
        let nextRecEarned = r.recipientEarnedXp;
        const newEvents: RivalHistoryEvent[] = [];

        const participants = [
          { id: r.requesterId, isRequester: true },
          { id: r.recipientId, isRequester: false },
        ];

        for (const part of participants) {
          const prevU = prevSnap.users[part.id];
          const nextU = nextUsersSnap[part.id];
          const userObj = users.find((u) => u.id === part.id);
          if (!prevU || !nextU || !userObj) continue;

          if (nextU.xp > prevU.xp) {
            const gained = nextU.xp - prevU.xp;
            if (part.isRequester) nextReqEarned += gained;
            else nextRecEarned += gained;
            newEvents.push({
              id: `rve-xp-${now}-${part.id}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: now,
              dateLabel,
              type: 'xp',
              actorUserId: part.id,
              title: `@${userObj.username} earned +${gained.toLocaleString()} XP`,
              detail: `${userObj.fullName} added +${gained.toLocaleString()} XP since the rivalry began.`,
            });
          }

          if (nextU.rankId !== prevU.rankId) {
            const oldRank = resolveRank(ranks, prevU.rankId)?.name || prevU.rankId;
            const newRank = resolveRank(ranks, nextU.rankId)?.name || nextU.rankId;
            newEvents.push({
              id: `rve-rk-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'rank',
              actorUserId: part.id,
              title: `@${userObj.username} rank updated to ${newRank}`,
              detail: `Progressed from ${oldRank} to ${newRank}.`,
            });
          }

          if (nextU.streak !== prevU.streak) {
            newEvents.push({
              id: `rve-st-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'streak',
              actorUserId: part.id,
              title: `@${userObj.username} streak reached ${nextU.streak} days`,
              detail:
                nextU.streak > prevU.streak
                  ? `Consistency climbed from ${prevU.streak} to ${nextU.streak} days.`
                  : `Streak adjusted from ${prevU.streak} to ${nextU.streak} days.`,
            });
          }

          if (nextU.questions !== prevU.questions) {
            newEvents.push({
              id: `rve-qs-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'questions',
              actorUserId: part.id,
              title: `@${userObj.username} updated Questions Completed`,
              detail: `Report Card count changed from ${prevU.questions.toLocaleString()} to ${nextU.questions.toLocaleString()} questions.`,
            });
          }

          const prevTerr = prevSnap.territoryCounts[part.id] ?? 0;
          const nextTerr = nextTerrCounts[part.id] ?? 0;
          if (nextTerr !== prevTerr) {
            newEvents.push({
              id: `rve-tr-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'territory',
              actorUserId: part.id,
              title:
                nextTerr > prevTerr
                  ? `@${userObj.username} acquired a Territory`
                  : `@${userObj.username} territory standing shifted`,
              detail: `Territories held moved from ${prevTerr} to ${nextTerr}.`,
            });
          }

          for (const chl of challenges) {
            const wasDone = (prevSnap.challengeCompletions[chl.id] || []).includes(
              part.id
            );
            const isDone = chl.completedByUserIds.includes(part.id);
            if (!wasDone && isDone) {
              newEvents.push({
                id: `rve-ch-${now}-${part.id}-${chl.id}`,
                timestamp: now,
                dateLabel,
                type: 'challenge',
                actorUserId: part.id,
                title: `@${userObj.username} completed “${chl.title}”`,
                detail: `Verified System Challenge (+${chl.rewardXp.toLocaleString()} XP reward).`,
              });
            }
          }
        }

        if (
          newEvents.length === 0 &&
          nextReqEarned === r.requesterEarnedXp &&
          nextRecEarned === r.recipientEarnedXp
        ) {
          return r;
        }

        anyUpdated = true;
        return {
          ...r,
          requesterEarnedXp: nextReqEarned,
          recipientEarnedXp: nextRecEarned,
          history: [...newEvents, ...r.history].slice(0, 100),
        };
      });

      return anyUpdated ? updated : prevRivalries;
    });
  }, [users, territories, challenges, ranks]);

  const currentUser = currentUserId
    ? users.find((u) => u.id === currentUserId) || null
    : null;
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  // Ensure non-admins / logged-out users cannot remain on gated tabs
  useEffect(() => {
    const loginRequiredTabs: MainTab[] = ['ascension', 'territories', 'system'];
    if (!isLoggedIn && (loginRequiredTabs.includes(activeTab) || activeTab === 'admin')) {
      setActiveTab('home');
    } else if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isLoggedIn, isAdmin]);

  const navigateTo = (tab: MainTab) => {
    setMobileMenuOpen(false);
    const loginRequiredTabs: MainTab[] = ['ascension', 'territories', 'system'];
    if (loginRequiredTabs.includes(tab) && !isLoggedIn) {
      setPendingTab(tab);
      setLoginOpen(true);
      return;
    }
    if (tab === 'admin' && !isAdmin) {
      if (!isLoggedIn) {
        setPendingTab('admin');
        setLoginOpen(true);
      }
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    if (currentUser) {
      handleUpdateUserAny(currentUser.id, {
        isOnline: false,
        lastLoggedIn: new Date().toLocaleString(),
      });
    }
    setCurrentUserId(null);
    setPendingTab(null);
    if (
      activeTab === 'ascension' ||
      activeTab === 'territories' ||
      activeTab === 'system' ||
      activeTab === 'admin'
    ) {
      setActiveTab('home');
    }
  };

  /* ---- HANDLERS ---- */
  const handleSaveQuiz = (quiz: QuizRecord) => {
    setQuizzes((prev) => {
      const exists = prev.some((q) => q.id === quiz.id);
      return exists
        ? prev.map((q) => (q.id === quiz.id ? quiz : q))
        : [quiz, ...prev];
    });
  };

  const handleRemovePlayerFromQuiz = (quizId: string, playerName: string) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId
          ? { ...q, players: q.players.filter((p) => p !== playerName) }
          : q
      )
    );
  };

  const handleUpdateUserAny = (userId: string, patch: Partial<DqrUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...patch } : u))
    );
  };

  const handleCreateUser = (
    newUser: Omit<DqrUser, 'id' | 'createdAt'>
  ): string | null => {
    if (
      users.some(
        (u) => u.username.toLowerCase() === newUser.username.toLowerCase()
      )
    ) {
      return `Username "${newUser.username}" already exists.`;
    }
    const created: DqrUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUsers((prev) => [...prev, created]);
    return null;
  };

  const handleLevelUp = (userId: string, xpCost: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId && u.xp >= xpCost
          ? { ...u, xp: u.xp - xpCost, level: u.level + 1 }
          : u
      )
    );
  };

  const handleBuyTitle = (userId: string, title: TitleItem): string | null => {
    const u = users.find((x) => x.id === userId);
    if (!u) return 'User not found.';
    if (u.ownedTitleIds.includes(title.id)) return 'Already owned.';
    if (u.xp < title.priceXp) return 'Not enough XP.';
    handleUpdateUserAny(userId, {
      xp: u.xp - title.priceXp,
      ownedTitleIds: [...u.ownedTitleIds, title.id],
      equippedTitleId: title.id,
    });
    return null;
  };

  const handleToggleEquipAchievement = (userId: string, achId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    const exists = u.equippedAchievementIds.includes(achId);
    let next: string[];
    if (exists) {
      next = u.equippedAchievementIds.filter((id) => id !== achId);
    } else {
      next = [...u.equippedAchievementIds, achId].slice(-2); // max 2 equipped
    }
    handleUpdateUserAny(userId, { equippedAchievementIds: next });
  };

  const handlePlaceBid = (
    auctionId: string,
    userId: string,
    amount: number
  ): string | null => {
    const u = users.find((x) => x.id === userId);
    const auc = auctions.find((a) => a.id === auctionId);
    if (!u || !auc) return 'Auction unavailable.';
    if (auc.settled || auc.endsAt <= Date.now()) return 'Auction has ended.';
    const minReq =
      auc.highestBidderId === null ? auc.startingBid : auc.currentBid + 1;
    if (amount < minReq) return `Bid must be at least ${minReq} XP.`;
    if (u.xp < amount) return 'Insufficient XP balance.';

    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? {
              ...a,
              currentBid: amount,
              highestBidderId: u.id,
              highestBidderName: u.fullName,
              endsAt: a.endsAt + 10_000, // +10 seconds on every new bid
              bids: [
                ...a.bids,
                {
                  userId: u.id,
                  username: u.username,
                  fullName: u.fullName,
                  amount,
                  timestamp: Date.now(),
                },
              ],
            }
          : a
      )
    );
    return null;
  };

  const handleSettleAuction = (auctionId: string) => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc || auc.settled || !auc.highestBidderId) return;
    const winner = users.find((u) => u.id === auc.highestBidderId);
    if (!winner) return;

    // Add title to catalog if not already there
    if (!titles.some((t) => t.id === auc.title.id)) {
      setTitles((prev) => [auc.title, ...prev]);
    }
    handleUpdateUserAny(winner.id, {
      xp: Math.max(0, winner.xp - auc.currentBid),
      ownedTitleIds: Array.from(
        new Set([...winner.ownedTitleIds, auc.title.id])
      ),
      equippedTitleId: auc.title.id,
    });
    setAuctions((prev) =>
      prev.map((a) => (a.id === auctionId ? { ...a, settled: true } : a))
    );
  };

  const handleSubmitTerritoryAttempt = (
    territoryId: string,
    userId: string,
    score: number
  ): { tookOver: boolean; message: string } => {
    const ter = territories.find((t) => t.id === territoryId);
    const challenger = users.find((u) => u.id === userId);
    if (!ter || !challenger) {
      return { tookOver: false, message: 'Territory unavailable.' };
    }

    const tookOver = score > ter.highestScore;
    const dateLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
    });

    setTerritories((prev) =>
      prev.map((t) => {
        if (t.id !== territoryId) return t;
        const nextAttempted = Array.from(
          new Set([...t.attemptedUserIds, userId])
        );
        if (!tookOver) {
          return { ...t, attemptedUserIds: nextAttempted };
        }
        const demotedHistory = t.history.map((h) => ({
          ...h,
          result: 'Defeated' as const,
        }));
        const newEntry = {
          id: `th-${Date.now()}`,
          holderUserId: challenger.id,
          holderName: challenger.fullName,
          score,
          totalQuestions: t.questions.length,
          dateLabel,
          result: 'Current' as const,
        };
        return {
          ...t,
          currentHolderUserId: challenger.id,
          currentHolderName: challenger.fullName,
          highestScore: score,
          wonOn: dateLabel,
          attemptedUserIds: nextAttempted,
          history: [newEntry, ...demotedHistory].slice(0, 10),
        };
      })
    );

    return tookOver
      ? {
          tookOver: true,
          message: `You defeated the previous score (${ter.highestScore}/${ter.questions.length}) and seized ${ter.name}! (+100 Power)`,
        }
      : {
          tookOver: false,
          message: `${ter.currentHolderName || 'The holder'} keeps control (${ter.highestScore}/${ter.questions.length}). Strictly higher score is required.`,
        };
  };

  const handleSendSystemMessage = (userId: string, text: string) => {
    setSystemMessages((prev) => [
      ...prev,
      {
        id: `smsg-${Date.now()}`,
        userId,
        sender: 'user',
        text,
        createdAt: Date.now(),
        readByAdmin: false,
        readByUser: true,
      },
    ]);
  };

  const handleAdminReplyMessage = (userId: string, text: string) => {
    setSystemMessages((prev) => [
      ...prev.map((m) =>
        m.userId === userId ? { ...m, readByAdmin: true } : m
      ),
      {
        id: `smsg-${Date.now()}`,
        userId,
        sender: 'system',
        text,
        createdAt: Date.now(),
        readByAdmin: true,
        readByUser: false,
      },
    ]);
  };

  const handleMarkMessagesRead = (userId: string) => {
    setSystemMessages((prev) =>
      prev.map((m) =>
        m.userId === userId && m.sender === 'system'
          ? { ...m, readByUser: true }
          : m
      )
    );
  };

  const handleClaimChallenge = (challengeId: string, userId: string) => {
    const chl = challenges.find((c) => c.id === challengeId);
    const u = users.find((x) => x.id === userId);
    if (!chl || !u || chl.completedByUserIds.includes(userId)) return;

    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, completedByUserIds: [...c.completedByUserIds, userId] }
          : c
      )
    );
    handleUpdateUserAny(userId, { xp: u.xp + chl.rewardXp });
  };

  /* ---- RIVAL HANDLERS ---- */
  const handleSendRivalRequest = (
    requesterId: string,
    recipientId: string
  ): string | null => {
    if (requesterId === recipientId) {
      return 'You cannot select yourself as a rival.';
    }
    const target = users.find((u) => u.id === recipientId);
    if (!target) return 'Selected user could not be found.';

    const existingActive = rivalries.find(
      (r) =>
        r.status === 'active' &&
        ((r.requesterId === requesterId && r.recipientId === recipientId) ||
          (r.requesterId === recipientId && r.recipientId === requesterId))
    );
    if (existingActive) {
      return `You already have an active rivalry with @${target.username}.`;
    }

    const existingPending = rivalries.find(
      (r) =>
        r.status === 'pending' &&
        ((r.requesterId === requesterId && r.recipientId === recipientId) ||
          (r.requesterId === recipientId && r.recipientId === requesterId))
    );
    if (existingPending) {
      return existingPending.requesterId === requesterId
        ? `A rival request to @${target.username} is already pending.`
        : `@${target.username} already sent you a pending request — accept it in Incoming Requests.`;
    }

    const created: RivalRecord = {
      id: `rv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requesterId,
      recipientId,
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      requesterEarnedXp: 0,
      recipientEarnedXp: 0,
      history: [],
    };
    setRivalries((prev) => [created, ...prev]);
    return null;
  };

  const handleRespondRivalRequest = (rivalryId: string, accept: boolean) => {
    const targetRivalry = rivalries.find((r) => r.id === rivalryId);
    if (!targetRivalry || targetRivalry.status !== 'pending') return;

    const now = Date.now();
    const dateLabel = formatRivalDate(now);

    if (!accept) {
      setRivalries((prev) =>
        prev.map((r) =>
          r.id === rivalryId ? { ...r, status: 'declined', endedAt: now } : r
        )
      );
      return;
    }

    const reqUser = users.find((u) => u.id === targetRivalry.requesterId);
    const recUser = users.find((u) => u.id === targetRivalry.recipientId);
    if (!reqUser || !recUser) return;

    setRivalries((prev) =>
      prev.map((r) => {
        if (r.id === rivalryId) {
          return {
            ...r,
            status: 'active',
            startedAt: now,
            endedAt: null,
            requesterEarnedXp: 0,
            recipientEarnedXp: 0,
            baselineStats: {
              requester: buildUserSnapshot(reqUser, territories, 0),
              recipient: buildUserSnapshot(recUser, territories, 0),
            },
            history: [
              {
                id: `rve-start-${now}`,
                timestamp: now,
                dateLabel,
                type: 'started',
                title: `Friendly rivalry started: @${reqUser.username} vs @${recUser.username}`,
                detail:
                  'XP earned tracker starts at 0 XP for both competitors today. Both rivals are ready to grow.',
              },
            ],
          };
        }

        // Conclude any prior active rivalry involving either participant cleanly
        if (
          r.status === 'active' &&
          (r.requesterId === reqUser.id ||
            r.recipientId === reqUser.id ||
            r.requesterId === recUser.id ||
            r.recipientId === recUser.id)
        ) {
          const oldReq = users.find((u) => u.id === r.requesterId);
          const oldRec = users.find((u) => u.id === r.recipientId);
          return {
            ...r,
            status: 'ended',
            endedAt: now,
            finalStats:
              oldReq && oldRec
                ? {
                    requester: buildUserSnapshot(
                      oldReq,
                      territories,
                      r.requesterEarnedXp
                    ),
                    recipient: buildUserSnapshot(
                      oldRec,
                      territories,
                      r.recipientEarnedXp
                    ),
                  }
                : r.finalStats,
            history: [
              {
                id: `rve-end-${now}-${r.id}`,
                timestamp: now,
                dateLabel,
                type: 'ended',
                title: 'Rivalry concluded for a new matchup',
                detail:
                  'A new friendly rivalry was accepted. Both rivals carried strong progress forward.',
              },
              ...r.history,
            ],
          };
        }

        return r;
      })
    );
  };

  const handleCancelRivalRequest = (rivalryId: string) => {
    setRivalries((prev) =>
      prev.map((r) =>
        r.id === rivalryId && r.status === 'pending'
          ? { ...r, status: 'cancelled', endedAt: Date.now() }
          : r
      )
    );
  };

  const handleEndRivalry = (rivalryId: string, endedByUserId: string) => {
    const now = Date.now();
    const dateLabel = formatRivalDate(now);
    const actor = users.find((u) => u.id === endedByUserId);

    setRivalries((prev) =>
      prev.map((r) => {
        if (r.id !== rivalryId || r.status !== 'active') return r;
        const reqUser = users.find((u) => u.id === r.requesterId);
        const recUser = users.find((u) => u.id === r.recipientId);
        return {
          ...r,
          status: 'ended',
          endedAt: now,
          finalStats:
            reqUser && recUser
              ? {
                  requester: buildUserSnapshot(
                    reqUser,
                    territories,
                    r.requesterEarnedXp
                  ),
                  recipient: buildUserSnapshot(
                    recUser,
                    territories,
                    r.recipientEarnedXp
                  ),
                }
              : r.finalStats,
          history: [
            {
              id: `rve-end-${now}`,
              timestamp: now,
              dateLabel,
              type: 'ended',
              actorUserId: endedByUserId,
              title: actor
                ? `@${actor.username} concluded this rivalry`
                : 'Rivalry concluded',
              detail:
                'Full comparison stats and timeline remain saved in Past Rivalries.',
            },
            ...r.history,
          ],
        };
      })
    );
  };

  const navItems: { id: MainTab; label: string; requiresAuth?: boolean }[] = [
    { id: 'home', label: 'Home' },
    { id: 'hall-of-fame', label: 'Hall of Fame' },
    { id: 'ascension', label: 'Ascension', requiresAuth: true },
    { id: 'territories', label: 'Territories', requiresAuth: true },
    { id: 'newspaper', label: 'Newspaper' },
    { id: 'system', label: 'System', requiresAuth: true },
    ...(isAdmin ? [{ id: 'admin' as MainTab, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f5f2eb]">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/25 bg-[#08080a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          {/* Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-display text-2xl font-bold tracking-[0.14em] text-[#d4af37] hover:text-[#f5dc82] whitespace-nowrap shrink-0 cursor-pointer"
          >
            DQR
          </button>

          {/* Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-5 lg:flex"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const locked = Boolean(item.requiresAuth && !isLoggedIn);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative inline-flex items-center gap-1 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer xl:text-sm ${
                    isActive
                      ? 'text-[#f8e6a0]'
                      : 'text-[#bfb7a6] hover:text-white'
                  }`}
                >
                  {locked && <Lock className="h-3 w-3 text-[#d4af37]/70" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#d4af37]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth Controls (Strict PIN Login — No Demo Switcher) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>
            {currentUser ? (
              <>
                <span className="hidden rounded-lg border border-[#d4af37]/30 bg-[#14120c] px-2.5 py-1.5 text-xs font-medium text-[#f8e6a0] sm:inline-block whitespace-nowrap">
                  {currentUser.fullName}
                  {currentUser.role === 'admin' ? ' · Admin' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#14120c] px-3 py-1.5 text-xs font-semibold text-[#f8e6a0] hover:border-[#f0cb65] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingTab(null);
                  setLoginOpen(true);
                }}
                className="rounded-lg bg-gradient-to-r from-[#c79a26] to-[#d4af37] px-4 py-1.5 text-xs font-bold text-[#08080a] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="rounded-lg border border-white/15 p-1.5 text-[#f5dc82] lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#d4af37]/20 bg-[#0b0a08] px-4 py-3 lg:hidden">
            <nav className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const locked = Boolean(item.requiresAuth && !isLoggedIn);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-[#d4af37]/15 text-[#f8e6a0]'
                        : 'text-[#d4ccb8] hover:bg-white/5'
                    }`}
                  >
                    {locked && <Lock className="h-3 w-3 text-[#d4af37]/70" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-2.5 border-t border-white/10 pt-2.5 sm:hidden">
              <PWAInstallButton compact />
            </div>
          </div>
        )}
      </header>

      {/* ACTIVE PAGE */}
      <main>
        {activeTab === 'home' && (
          <IntroductionPage
            settings={introSettings}
            isLoggedIn={isLoggedIn}
            onGetStarted={() => {
              if (isLoggedIn) navigateTo('hall-of-fame');
              else {
                setPendingTab('ascension');
                setLoginOpen(true);
              }
            }}
            onGoHallOfFame={() => navigateTo('hall-of-fame')}
          />
        )}

        {activeTab === 'hall-of-fame' && (
          <HallOfFame bsYears={bsYears} quizzes={quizzes} gallery={gallery} />
        )}

        {activeTab === 'ascension' && currentUser && (
          <AscensionPath
            currentUser={currentUser}
            users={users}
            ranks={ranks}
            levelRanges={levelRanges}
            streakBands={streakBands}
            titles={titles}
            achievements={achievements}
            auctions={auctions}
            pastWinners={pastWinners}
            weeklyTracker={
              weeklyTrackers[currentUser.id] ||
              createInitialWeeklyTracker(currentUser, territories)
            }
            onDismissWeeklySummary={(uid, weekStartIso) => {
              setWeeklyTrackers((prev) => {
                const existing = prev[uid];
                if (!existing) return prev;
                return {
                  ...prev,
                  [uid]: {
                    activeWeek:
                      existing.activeWeek.weekStartIso === weekStartIso
                        ? { ...existing.activeWeek, dismissedEndOfWeek: true }
                        : existing.activeWeek,
                    completedWeeks: existing.completedWeeks.map((cw) =>
                      cw.weekStartIso === weekStartIso
                        ? { ...cw, dismissedEndOfWeek: true }
                        : cw
                    ),
                  },
                };
              });
            }}
            onLevelUp={handleLevelUp}
            onAcknowledgeAnnouncement={(uid) =>
              handleUpdateUserAny(uid, { announcementChecked: true })
            }
            onBuyTitle={handleBuyTitle}
            onEquipTitle={(uid, tid) =>
              handleUpdateUserAny(uid, { equippedTitleId: tid })
            }
            onToggleEquipAchievement={handleToggleEquipAchievement}
            onUpdateProfile={(uid, patch) => handleUpdateUserAny(uid, patch)}
            onPlaceBid={handlePlaceBid}
            onSettleAuction={handleSettleAuction}
          />
        )}

        {activeTab === 'territories' && currentUser && (
          <TerritoriesPage
            currentUser={currentUser}
            users={users}
            territories={territories}
            onSubmitAttempt={handleSubmitTerritoryAttempt}
          />
        )}

        {activeTab === 'newspaper' && <NewspaperPage edition={newspaper} />}

        {activeTab === 'system' && currentUser && (
          <SystemPage
            currentUser={currentUser}
            users={users}
            ranks={ranks}
            config={systemConfig}
            messages={systemMessages}
            predictions={predictions}
            guidance={guidance}
            challenges={challenges}
            egoReports={egoReports}
            verdict={verdicts.find((v) => v.userId === currentUser.id)}
            quizzes={quizzes}
            territories={territories}
            rivalries={rivalries}
            onSendMessage={handleSendSystemMessage}
            onMarkMessagesRead={handleMarkMessagesRead}
            onClaimChallenge={handleClaimChallenge}
            onSendRivalRequest={handleSendRivalRequest}
            onRespondRivalRequest={handleRespondRivalRequest}
            onCancelRivalRequest={handleCancelRivalRequest}
            onEndRivalry={handleEndRivalry}
          />
        )}

        {activeTab === 'admin' && isAdmin && currentUser && (
          <AdminPanel
            currentUser={currentUser}
            introSettings={introSettings}
            onUpdateIntro={setIntroSettings}
            bsYears={bsYears}
            onAddBsYear={(y) => setBsYears((p) => [...p, y].sort())}
            onDeleteBsYear={(y) =>
              setBsYears((p) => p.filter((x) => x !== y))
            }
            quizzes={quizzes}
            onSaveQuiz={handleSaveQuiz}
            onDeleteQuiz={(id) =>
              setQuizzes((p) => p.filter((q) => q.id !== id))
            }
            onRemovePlayerFromQuiz={handleRemovePlayerFromQuiz}
            gallery={gallery}
            onAddGalleryPhoto={(ph) => setGallery((p) => [ph, ...p])}
            onDeleteGalleryPhoto={(id) =>
              setGallery((p) => p.filter((g) => g.id !== id))
            }
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUserAny={handleUpdateUserAny}
            onDeleteUser={(uid) =>
              setUsers((p) => p.filter((u) => u.id !== uid))
            }
            ranks={ranks}
            onSaveRanks={setRanks}
            levelRanges={levelRanges}
            onSaveLevelRanges={setLevelRanges}
            streakBands={streakBands}
            onSaveStreakBands={setStreakBands}
            titles={titles}
            onAddTitle={(t) => setTitles((p) => [t, ...p])}
            achievements={achievements}
            auctions={auctions}
            onCreateAuction={(a) => setAuctions((p) => [a, ...p])}
            onSettleAuction={handleSettleAuction}
            pastWinners={pastWinners}
            onAddPastWinner={(pw) => setPastWinners((p) => [pw, ...p])}
            onDeletePastWinner={(id) =>
              setPastWinners((p) => p.filter((x) => x.id !== id))
            }
            territories={territories}
            onSaveTerritories={setTerritories}
            newspaper={newspaper}
            onSaveNewspaper={setNewspaper}
            systemConfig={systemConfig}
            onSaveSystemConfig={setSystemConfig}
            systemMessages={systemMessages}
            onAdminReplyMessage={handleAdminReplyMessage}
            predictions={predictions}
            onSavePredictions={setPredictions}
            guidance={guidance}
            onSaveGuidance={setGuidance}
            challenges={challenges}
            onSaveChallenges={setChallenges}
            egoReports={egoReports}
            onSaveEgoReports={setEgoReports}
            verdicts={verdicts}
            onSaveVerdicts={setVerdicts}
          />
        )}
      </main>

      <LoginModal
        open={loginOpen}
        users={users}
        onClose={() => {
          setLoginOpen(false);
          setPendingTab(null);
        }}
        onSuccess={(user) => {
          setCurrentUserId(user.id);
          handleUpdateUserAny(user.id, {
            isOnline: true,
            lastLoggedIn: 'Online now',
          });
          setLoginOpen(false);
          if (pendingTab) {
            if (pendingTab === 'admin' && user.role !== 'admin') {
              setActiveTab('home');
            } else {
              setActiveTab(pendingTab);
            }
            setPendingTab(null);
          }
        }}
      />

      <OfflineIndicator />
    </div>
  );
}
