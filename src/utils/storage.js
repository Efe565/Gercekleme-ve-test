// LocalStorage persistence and BPI / LPI (Lumosity Performance Index) calculations

const STORAGE_KEY = 'lumina_brain_lab_data';

// Helper to get formatted date string (YYYY-MM-DD)
const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];

const DEFAULT_PROFILE = {
  name: 'Bilişsel Sporcu',
  createdAt: new Date().toISOString(),
  overallBpi: 1045,
  overallLpi: 1045,
  streak: 3,
  longestStreak: 5,
  streakFreezes: 2, // Seri Koruma Kalkanı (Lumosity'de olmayan en çok istenen özellik)
  maxStreakFreezes: 3,
  streakShieldLogs: [
    {
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      type: 'earned',
      text: 'Hoş geldin hediyesi: 2 Seri Koruma Kalkanı yüklendi.'
    }
  ],
  ageGroup: '25-34',
  weeklyGoal: 5,
  workoutPreference: 'full', // 'full' (5 games) or 'quick' (3 games)
  theme: 'dark', // 'dark' (OLED Gece Modu) or 'light'
  binauralSettings: {
    enabled: false,
    mode: 'alpha', // 'alpha', 'gamma', 'flow'
    volume: 0.25
  },
  trainingGoals: ['memory', 'attention', 'speed'],
  lastWorkoutDate: getYesterdayStr(),
  completedDays: [
    new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    getYesterdayStr()
  ],
  totalWorkouts: 12,
  domains: {
    speed: {
      bpi: 1060,
      name: 'Hız',
      color: '#FF9A00',
      percentile: 88,
      description: 'Görsel işlemleme ve hızlı karar verme yeteneği.'
    },
    memory: {
      bpi: 1025,
      name: 'Hafıza',
      color: '#7B4CE6',
      percentile: 82,
      description: 'Uzamsal çalışma belleği ve desenleri akılda tutma.'
    },
    attention: {
      bpi: 1070,
      name: 'Dikkat',
      color: '#0091FF',
      percentile: 91,
      description: 'Çeldiricileri filtreleme ve odaklanma kontrolü.'
    },
    flexibility: {
      bpi: 1035,
      name: 'Esneklik',
      color: '#E83D84',
      percentile: 84,
      description: 'Görevler ve kurallar arasında hızlı zihinsel geçiş.'
    },
    problemSolving: {
      bpi: 1045,
      name: 'Problem Çözme',
      color: '#00B894',
      percentile: 86,
      description: 'Hızlı mantıksal hesaplama ve nicel akıl yürütme.'
    }
  },
  games: {
    'speed-match': {
      highScore: 2450,
      timesPlayed: 8,
      bestCombo: 14,
      avgReactionMs: 380
    },
    'memory-matrix': {
      highScore: 1980,
      timesPlayed: 6,
      bestLevel: 7,
      tilesRecalled: 42
    },
    'lost-in-migration': {
      highScore: 3100,
      timesPlayed: 7,
      accuracy: 94,
      avgReactionMs: 410
    },
    'chalkboard-challenge': {
      highScore: 2200,
      timesPlayed: 5,
      accuracy: 90
    },
    'color-match': {
      highScore: 2650,
      timesPlayed: 6,
      accuracy: 92,
      avgReactionMs: 395
    }
  },
  history: [
    { date: 'Pzt', bpi: 1015, workouts: 1 },
    { date: 'Sal', bpi: 1022, workouts: 1 },
    { date: 'Çar', bpi: 1030, workouts: 1 },
    { date: 'Per', bpi: 1038, workouts: 1 },
    { date: 'Cum', bpi: 1042, workouts: 1 },
    { date: 'Cmt', bpi: 1040, workouts: 0 },
    { date: 'Bugün', bpi: 1045, workouts: 1 }
  ]
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_PROFILE, ...parsed };

    // Ensure streak freeze fields
    if (merged.streakFreezes === undefined) merged.streakFreezes = 2;
    if (merged.maxStreakFreezes === undefined) merged.maxStreakFreezes = 3;
    if (!merged.streakShieldLogs) merged.streakShieldLogs = [...DEFAULT_PROFILE.streakShieldLogs];
    if (!merged.theme) merged.theme = 'dark';
    if (!merged.binauralSettings) merged.binauralSettings = { ...DEFAULT_PROFILE.binauralSettings };

    // Ensure domains object and colors are valid
    if (!merged.domains) merged.domains = { ...DEFAULT_PROFILE.domains };
    Object.keys(DEFAULT_PROFILE.domains).forEach(k => {
      if (!merged.domains[k]) {
        merged.domains[k] = { ...DEFAULT_PROFILE.domains[k] };
      } else {
        merged.domains[k].color = DEFAULT_PROFILE.domains[k].color;
        merged.domains[k].name = DEFAULT_PROFILE.domains[k].name;
      }
    });

    if (!merged.games) merged.games = { ...DEFAULT_PROFILE.games };
    if (!merged.completedDays) merged.completedDays = [...DEFAULT_PROFILE.completedDays];
    if (!merged.overallLpi) merged.overallLpi = merged.overallBpi;

    return merged;
  } catch (e) {
    console.error('Failed to load profile', e);
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function updateProfile(partial) {
  const current = getProfile();
  const updated = { ...current, ...partial };
  saveProfile(updated);
  return updated;
}

export function recordGameSession(gameId, domainKey, score, stats = {}) {
  const profile = getProfile();
  
  // Game stats
  if (!profile.games[gameId]) {
    profile.games[gameId] = { highScore: 0, timesPlayed: 0 };
  }
  const gameRecord = profile.games[gameId];
  gameRecord.timesPlayed = (gameRecord.timesPlayed || 0) + 1;
  const isNewRecord = score > (gameRecord.highScore || 0);
  if (isNewRecord) {
    gameRecord.highScore = score;
  }
  Object.assign(gameRecord, stats);

  // Dynamic BPI / LPI update calculation
  const currentDomain = profile.domains[domainKey];
  let bpiDelta = 0;
  if (currentDomain) {
    bpiDelta = Math.max(3, Math.min(18, Math.round(score / 250)));
    currentDomain.bpi += bpiDelta;
    currentDomain.percentile = Math.min(99, Math.round(50 + (currentDomain.bpi - 1000) / 10));
  }

  // Overall BPI & LPI is the weighted average of domains
  const domainKeys = Object.keys(profile.domains);
  const totalBpi = domainKeys.reduce((acc, k) => acc + profile.domains[k].bpi, 0);
  profile.overallBpi = Math.round(totalBpi / domainKeys.length);
  profile.overallLpi = profile.overallBpi;

  saveProfile(profile);
  return { profile, bpiDelta, isNewRecord };
}

export function completeDailyWorkout(completedGamesResults) {
  const profile = getProfile();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  let shieldProtected = false;

  // Streak logic with Streak Freeze protection
  if (profile.lastWorkoutDate === yesterday) {
    // Normal consecutive day
    profile.streak = (profile.streak || 0) + 1;
  } else if (profile.lastWorkoutDate === today) {
    // Already did a workout today, keep streak
    profile.streak = profile.streak || 1;
  } else {
    // Day was skipped! Check if user has streak freeze available
    if ((profile.streakFreezes || 0) > 0 && (profile.streak || 0) > 0) {
      profile.streakFreezes -= 1;
      profile.streak = (profile.streak || 0) + 1;
      shieldProtected = true;
      if (!profile.streakShieldLogs) profile.streakShieldLogs = [];
      profile.streakShieldLogs.unshift({
        date: today,
        type: 'used',
        text: `🛡️ Seri Koruma Kalkanı devreye girdi! Dün kaçırılan gün serinizi bozmadı (${profile.streak}. gün korundu).`
      });
    } else {
      // Streak breaks to 1
      profile.streak = 1;
    }
  }
  
  if (profile.streak > (profile.longestStreak || 0)) {
    profile.longestStreak = profile.streak;
  }

  profile.lastWorkoutDate = today;
  if (!profile.completedDays) profile.completedDays = [];
  if (!profile.completedDays.includes(today)) {
    profile.completedDays.push(today);
  }
  profile.totalWorkouts = (profile.totalWorkouts || 0) + 1;

  // Check if eligible for bonus streak freeze (reward for consistency)
  let earnedShield = false;
  if (profile.totalWorkouts % 5 === 0 && profile.streakFreezes < (profile.maxStreakFreezes || 3)) {
    profile.streakFreezes += 1;
    earnedShield = true;
    if (!profile.streakShieldLogs) profile.streakShieldLogs = [];
    profile.streakShieldLogs.unshift({
      date: today,
      type: 'earned',
      text: `🎉 Tebrikler! 5 seansı tamamladığınız için +1 Seri Koruma Kalkanı kazandınız.`
    });
  }

  // Aggregate LPI boost from workout (usually 10-25 BPI bonus)
  const totalScore = completedGamesResults.reduce((sum, g) => sum + (g.score || 0), 0);
  const bonusBpi = Math.max(10, Math.min(28, Math.round(totalScore / 450)));

  profile.overallBpi += bonusBpi;
  profile.overallLpi = profile.overallBpi;

  Object.keys(profile.domains).forEach(key => {
    profile.domains[key].bpi += Math.round(bonusBpi * 0.8);
    profile.domains[key].percentile = Math.min(99, Math.round(50 + (profile.domains[key].bpi - 1000) / 10));
  });

  // Append history
  const dayName = new Date().toLocaleDateString('tr-TR', { weekday: 'short' });
  profile.history.push({
    date: dayName,
    bpi: profile.overallBpi,
    workouts: 1
  });
  if (profile.history.length > 7) {
    profile.history.shift();
  }

  saveProfile(profile);
  return { profile, bonusBpi, shieldProtected, earnedShield };
}

export function earnStreakFreeze(reason = 'Özel Görev') {
  const profile = getProfile();
  if ((profile.streakFreezes || 0) < (profile.maxStreakFreezes || 3)) {
    profile.streakFreezes = (profile.streakFreezes || 0) + 1;
    if (!profile.streakShieldLogs) profile.streakShieldLogs = [];
    profile.streakShieldLogs.unshift({
      date: getTodayStr(),
      type: 'earned',
      text: `+1 Seri Kalkanı kazanıldı: ${reason}`
    });
    saveProfile(profile);
    return { success: true, profile };
  }
  return { success: false, reason: 'Kalkan haznesi dolu (Maks 3)' };
}

export function useStreakFreezeManually() {
  const profile = getProfile();
  if ((profile.streakFreezes || 0) > 0) {
    profile.streakFreezes -= 1;
    if (!profile.streakShieldLogs) profile.streakShieldLogs = [];
    profile.streakShieldLogs.unshift({
      date: getTodayStr(),
      type: 'used',
      text: `Seri Koruma Kalkanı aktif hale getirildi (Yarın için koruma hazır).`
    });
    saveProfile(profile);
    return { success: true, profile };
  }
  return { success: false, reason: 'Kullanılabilir kalkan yok' };
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PROFILE;
}

