var Progress =
{
	_key: CONFIG.GAME_ID + '_progress',
	_data: null,

	_defaults: function ()
	{
		return {
			coins: 0,
			highScore: 0,
			gamesPlayed: 0,
			level: 1,
			totalMoves: 0,
			stars: {},
			endlessHighLevel: 0,
			dailyCompleted: '',
			purchased: [],
			activeTheme: 'default',
			stats: {},
			achievementsUnlocked: [],
		};
	},

	load: function ()
	{
		try
		{
			var raw = localStorage.getItem(this._key);
			this._data = raw ? JSON.parse(raw) : this._defaults();
		}
		catch (e)
		{
			this._data = this._defaults();
		}

		var defs = this._defaults();
		for (var k in defs)
		{
			if (!(k in this._data))
				this._data[k] = defs[k];
		}
	},

	save: function ()
	{
		try
		{
			localStorage.setItem(this._key, JSON.stringify(this._data));
		}
		catch (e) {}
	},

	get: function (key)
	{
		if (!this._data) this.load();
		return this._data[key];
	},

	set: function (key, value)
	{
		if (!this._data) this.load();
		this._data[key] = value;
		this.save();
	},

	addCoins: function (amount)
	{
		this.set('coins', this.get('coins') + amount);
	},

	updateHighScore: function (score)
	{
		if (score > this.get('highScore'))
			this.set('highScore', score);
	},

	// --- Звёзды ---

	setStars: function (level, count)
	{
		var stars = this.get('stars') || {};
		if (!stars[level] || count > stars[level])
		{
			stars[level] = count;
			this.set('stars', stars);
		}
	},

	getStarsForLevel: function (level)
	{
		var stars = this.get('stars') || {};
		return stars[level] || 0;
	},

	getTotalStars: function ()
	{
		var stars = this.get('stars') || {};
		var total = 0;
		for (var k in stars)
			total += stars[k];
		return total;
	},

	// --- Бесконечный режим ---

	updateEndlessHigh: function (level)
	{
		if (level > this.get('endlessHighLevel'))
			this.set('endlessHighLevel', level);
	},

	// --- Ежедневный вызов ---

	isDailyCompleted: function ()
	{
		var today = new Date().toISOString().split('T')[0];
		return this.get('dailyCompleted') === today;
	},

	completeDaily: function ()
	{
		var today = new Date().toISOString().split('T')[0];
		this.set('dailyCompleted', today);
	},

	// --- Магазин ---

	hasPurchased: function (itemId)
	{
		var list = this.get('purchased') || [];
		return list.indexOf(itemId) !== -1;
	},

	addPurchase: function (itemId)
	{
		var list = this.get('purchased') || [];
		if (list.indexOf(itemId) === -1)
		{
			list.push(itemId);
			this.set('purchased', list);
		}
	},

	setActiveTheme: function (themeId)
	{
		this.set('activeTheme', themeId);
	},

	getActiveTheme: function ()
	{
		return this.get('activeTheme') || 'default';
	},

	getLiquidColors: function ()
	{
		var theme = this.getActiveTheme();
		if (theme !== 'default' && CONFIG.THEME_COLORS[theme])
			return CONFIG.THEME_COLORS[theme];
		return CONFIG.LIQUID_COLORS;
	},

	// --- Статистика / Достижения ---

	getStat: function (key)
	{
		var stats = this.get('stats') || {};
		return stats[key] || 0;
	},

	setStat: function (key, value)
	{
		var stats = this.get('stats') || {};
		stats[key] = value;
		this.set('stats', stats);
	},

	incStat: function (key, amount)
	{
		var v = this.getStat(key) + (amount || 1);
		this.setStat(key, v);

		// Проверяем достижения при каждом инкременте
		this._checkAchievements(key, v);
	},

	isAchievementUnlocked: function (id)
	{
		var list = this.get('achievementsUnlocked') || [];
		return list.indexOf(id) !== -1;
	},

	_checkAchievements: function (field, value)
	{
		var defs = CONFIG.ACHIEVEMENTS;
		var unlocked = this.get('achievementsUnlocked') || [];
		var newlyUnlocked = [];

		for (var i = 0; i < defs.length; i++)
		{
			var a = defs[i];
			if (a.field !== field) continue;
			if (unlocked.indexOf(a.id) !== -1) continue;

			// Особые проверки
			var checkVal = value;
			if (a.field === 'totalStars')
				checkVal = this.getTotalStars();
			if (a.field === 'themesBought')
				checkVal = (this.get('purchased') || []).length;

			if (checkVal >= a.goal)
			{
				unlocked.push(a.id);
				this.addCoins(a.reward);
				newlyUnlocked.push(a);
			}
		}

		if (newlyUnlocked.length > 0)
		{
			this.set('achievementsUnlocked', unlocked);
			// Отправляем событие для UI
			if (typeof this.onAchievementUnlocked === 'function')
			{
				for (var j = 0; j < newlyUnlocked.length; j++)
					this.onAchievementUnlocked(newlyUnlocked[j]);
			}
		}
	},

	checkAllAchievements: function ()
	{
		var defs = CONFIG.ACHIEVEMENTS;
		for (var i = 0; i < defs.length; i++)
		{
			var a = defs[i];
			var val = this.getStat(a.field);
			if (a.field === 'totalStars') val = this.getTotalStars();
			if (a.field === 'themesBought') val = (this.get('purchased') || []).length;
			this._checkAchievements(a.field, val);
		}
	},
};
