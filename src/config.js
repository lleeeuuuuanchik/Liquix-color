var CONFIG =
{
	GAME_ID: 'color_sort_puzzle',

	TUBE_CAPACITY: 4,
	TUBE_WIDTH: 44,
	TUBE_HEIGHT: 160,
	TUBE_GAP: 12,

	STARTING_COLORS: 3,
	MAX_COLORS: 12,
	EMPTY_TUBES: 2,

	INTERSTITIAL_EVERY: 3,
	FREE_UNDOS: 3,

	POINTS_PER_LEVEL: 100,
	COINS_PER_LEVEL: 10,

	// Звёзды: множители от оптимального количества ходов
	STAR_THRESHOLDS: [1.0, 1.5, 2.5],

	// Комбо
	COMBO_BONUS_BASE: 10,
	COMBO_TIMEOUT: 3000,

	// Подсказки и бомбы
	HINTS_PER_LEVEL: 1,
	BOMBS_PER_LEVEL: 0,

	// Бесконечный режим
	ENDLESS_START_COLORS: 3,
	ENDLESS_COLOR_INCREASE_EVERY: 2,

	// Ежедневный вызов
	DAILY_BASE_COLORS: 5,
	DAILY_BONUS_COINS: 25,

	// Магнит
	MAGNET_FREE: 0,

	// Режим на время
	TIMED_BASE_SECONDS: 90,
	TIMED_BONUS_PER_SECOND: 1,
	TIMED_COINS_BONUS: 15,

	// Радужный сегмент (джокер)
	RAINBOW_COLOR_IDX: 99,
	RAINBOW_START_LEVEL: 15,

	// Достижения (id, nameRu, nameEn, descRu, descEn, icon, reward, check-field)
	ACHIEVEMENTS:
	[
		{ id: 'first_steps',    icon: '👣', reward: 10,  goal: 5,   field: 'levelsWon' },
		{ id: 'speedster',      icon: '⚡', reward: 20,  goal: 1,   field: 'fastWins' },
		{ id: 'combo_master',   icon: '🔥', reward: 25,  goal: 1,   field: 'combo5' },
		{ id: 'collector',      icon: '🎨', reward: 30,  goal: 3,   field: 'themesBought' },
		{ id: 'marathon',       icon: '🏃', reward: 35,  goal: 10,  field: 'streakLevels' },
		{ id: 'bomber',         icon: '💣', reward: 15,  goal: 10,  field: 'bombsUsed' },
		{ id: 'stargazer',      icon: '🌟', reward: 40,  goal: 50,  field: 'totalStars' },
		{ id: 'magnet_master',  icon: '🧲', reward: 20,  goal: 5,   field: 'magnetsUsed' },
		{ id: 'ice_king',       icon: '🧊', reward: 15,  goal: 20,  field: 'freezesUsed' },
		{ id: 'time_warrior',   icon: '⏱️', reward: 30,  goal: 5,   field: 'timedWins' },
		{ id: 'rainbow_rider',  icon: '🌈', reward: 25,  goal: 10,  field: 'rainbowsPoured' },
		{ id: 'perfectionist',  icon: '💎', reward: 50,  goal: 10,  field: 'threeStarWins' },
		{ id: 'daily_fan',      icon: '📅', reward: 30,  goal: 7,   field: 'dailyWins' },
		{ id: 'hint_free',      icon: '🧠', reward: 20,  goal: 10,  field: 'noHintWins' },
		{ id: 'unstoppable',    icon: '🚀', reward: 60,  goal: 50,  field: 'levelsWon' },
	],

	SOUND_ENABLED: true,

	// Магазин
	SHOP_ITEMS:
	[
		{ id: 'theme_neon',    cat: 'themes', price: 50,  icon: '🌈', nameRu: 'Неон',       nameEn: 'Neon' },
		{ id: 'theme_pastel',  cat: 'themes', price: 80,  icon: '🎨', nameRu: 'Пастель',    nameEn: 'Pastel' },
		{ id: 'theme_ocean',   cat: 'themes', price: 100, icon: '🌊', nameRu: 'Океан',      nameEn: 'Ocean' },
		{ id: 'theme_sunset',  cat: 'themes', price: 120, icon: '🌅', nameRu: 'Закат',      nameEn: 'Sunset' },
		{ id: 'boost_undo3',   cat: 'boosts', price: 30,  icon: '↩️', nameRu: '+3 отмены',  nameEn: '+3 Undos' },
		{ id: 'boost_hint3',   cat: 'boosts', price: 40,  icon: '💡', nameRu: '+3 подсказки', nameEn: '+3 Hints' },
		{ id: 'boost_bomb2',   cat: 'boosts', price: 60,  icon: '💣', nameRu: '+2 бомбы',   nameEn: '+2 Bombs' },
	],

	THEME_COLORS:
	{
		default: null,
		theme_neon:
		[
			'#ff0055', '#00ffcc', '#ffee00', '#7b00ff',
			'#ff6600', '#00aaff', '#ff00aa', '#33ff00',
			'#ff3388', '#00ffff', '#ffaa00', '#aa00ff',
		],
		theme_pastel:
		[
			'#f8a5a5', '#a5d8f8', '#a5f8c3', '#f8e5a5',
			'#d4a5f8', '#f8c5a5', '#a5f8f0', '#f8a5d4',
			'#c8f8a5', '#a5c8f8', '#f8a5b8', '#b8a5f8',
		],
		theme_ocean:
		[
			'#0077b6', '#00b4d8', '#90e0ef', '#023e8a',
			'#48cae4', '#0096c7', '#ade8f4', '#03045e',
			'#caf0f8', '#0097b2', '#468faf', '#014f86',
		],
		theme_sunset:
		[
			'#ff6b35', '#f7c59f', '#efefd0', '#004e89',
			'#1a659e', '#ff4500', '#ffa07a', '#ff8c42',
			'#ffb347', '#6a0572', '#ab83a1', '#e8573c',
		],
	},

	LIQUID_COLORS:
	[
		'#ef4444', // красный
		'#3b82f6', // синий
		'#22c55e', // зелёный
		'#eab308', // жёлтый
		'#a855f7', // фиолетовый
		'#f97316', // оранжевый
		'#06b6d4', // голубой
		'#ec4899', // розовый
		'#84cc16', // лайм
		'#14b8a6', // бирюзовый
		'#f43f5e', // малиновый
		'#8b5cf6', // индиго
	],

	COLORS:
	{
		background: '#0a0a12',
		surface: '#1e1e24',
		primary: '#7c5cff',
		text: '#e8e8ed',
		textMuted: '#8e8e9a',
		tubeGlass: 'rgba(255, 255, 255, 0.08)',
		tubeStroke: 'rgba(255, 255, 255, 0.15)',
		selectionGlow: 'rgba(124, 92, 255, 0.5)',
		bombGlow: 'rgba(239, 68, 68, 0.5)',
		hintGlow: 'rgba(34, 197, 94, 0.6)',
	},
};
