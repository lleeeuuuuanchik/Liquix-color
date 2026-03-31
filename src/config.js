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

		// Неон: кислотно-яркие, максимальная насыщенность, тёмный фон хорошо контрастирует
		theme_neon:
		[
			'#ff0040', // кислотный красный
			'#ff6600', // кислотный оранжевый
			'#ffee00', // кислотный жёлтый
			'#aaff00', // кислотный лайм
			'#00ff44', // кислотный зелёный
			'#00ffcc', // кислотный мятный
			'#00eeff', // кислотный циан
			'#0066ff', // кислотный синий
			'#8800ff', // кислотный фиолетовый
			'#ee00ff', // кислотный пурпур
			'#ff0099', // кислотный розовый
			'#ff3300', // кислотный алый
		],

		// Пастель: светлые, мягкие, сдержанная насыщенность — сильно отличается от неона
		theme_pastel:
		[
			'#ffb3b3', // нежно-розовый
			'#ffd4a0', // персиковый
			'#fff0a0', // кремово-жёлтый
			'#c8f0a0', // мятно-зелёный светлый
			'#a0e8c8', // сладкий мятный
			'#a0dff0', // небесный
			'#a8c8ff', // лавандово-голубой
			'#c8b4ff', // лавандовый
			'#e8b4f0', // сиреневый
			'#ffb4e0', // розово-лиловый
			'#ffcccc', // пудровый розовый
			'#d4c8a0', // тёплый бежевый
		],

		// Океан: холодная морская гамма — сине-зелёные + акценты кораллом и золотом
		theme_ocean:
		[
			'#ff5566', // коралловый
			'#ff9944', // янтарный закат
			'#f5d020', // солнечный
			'#44cc88', // морской зелёный
			'#00bb99', // изумрудный прибой
			'#00ccdd', // лагуна
			'#0099ee', // морской голубой
			'#0055cc', // глубина
			'#4433aa', // тёмный индиго
			'#7755cc', // морской фиолет
			'#cc3388', // кораллово-розовый
			'#009977', // тёмный аквамарин
		],

		// Закат: тёплая земляная гамма — красные, охристые, пурпурные, без холодного
		theme_sunset:
		[
			'#ff2200', // вулканический красный
			'#ff6600', // закатный оранжевый
			'#ffaa00', // охра
			'#ffdd00', // золото
			'#ddaa00', // бронза
			'#aa6600', // тёмная охра
			'#cc3366', // клюква
			'#ff4488', // фламинго
			'#dd2255', // малина
			'#881144', // бургундский
			'#cc44bb', // пурпурный закат
			'#993399', // слива
		],
	},

	// 12 максимально различимых цветов: равномерно по цветовому кругу + янтарный
	LIQUID_COLORS:
	[
		'#ff3333', // красный       (0°)
		'#ff8800', // оранжевый     (30°)
		'#ffcc00', // жёлтый        (48°)
		'#99dd00', // лайм          (77°)
		'#00cc55', // зелёный       (142°)
		'#00ddcc', // мятный        (174°)
		'#0099ff', // голубой       (210°)
		'#4455ee', // синий         (234°)
		'#9933ff', // фиолетовый    (266°)
		'#ff22cc', // маджента      (307°)
		'#ff4488', // розовый       (337°)
		'#cc7700', // янтарный      (земляной)
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
