/**
 * Локализация.
 * Все переводимые тексты — здесь. Элементы с атрибутом data-i18n="ключ"
 * переводятся автоматически при вызове i18n.apply().
 */
var i18n =
{
	_lang: 'ru',

	_map:
	{
		ru: 'ru', be: 'ru', kk: 'ru', uk: 'ru', uz: 'ru',
		en: 'en', tr: 'en', de: 'en', fr: 'en', es: 'en',
		pt: 'en', it: 'en', ar: 'en', he: 'en', ja: 'en',
		ko: 'en', zh: 'en',
	},

	_texts:
	{
		ru:
		{
			'game.title':          'Разлей-ка цвет',
			'btn.play':            'Играть',
			'btn.pause':           'Пауза',
			'btn.resume':          'Продолжить',
			'btn.menu':            'Меню',
			'btn.restart':         'Заново',
			'btn.next-level':      'Следующий уровень',
			'btn.undo':            'Отменить',
			'btn.extra-tube':      '📺 Доп. пробирка',
			'btn.restart-level':   'Начать заново',
			'btn.hint':            '💡 Подсказка',
			'btn.bomb':            '💣 Бомба',
			'btn.endless':         'Бесконечный режим',
			'btn.daily':           'Испытание дня',
			'btn.shop':            'Магазин',
			'btn.how-to-play':     'Как играть',
			'btn.levels':          'Уровни',
			'btn.close':           'Закрыть',
			'btn.buy':             'Купить',
			'game-over.title':     'Игра окончена',
			'score.label':         'Очки',
			'score.result':        'Очки:',
			'level.label':         'Уровень',
			'level.complete':      'Уровень пройден!',
			'moves.label':         'Ходы',
			'combo.label':         'Комбо',
			'stars.label':         'Звёзды',
			'daily.completed':     'Уже пройдено сегодня!',
			'daily.completed-desc': 'Возвращайся завтра за новым испытанием!',
			'daily.reward':        'Награда за испытание дня!',
			'endless.record':      'Рекорд',
			'shop.title':          'Магазин',
			'shop.coins':          'Монеты',
			'shop.owned':          'Куплено',
			'shop.selected':       'Выбрано',
			'shop.not-enough':     'Недостаточно монет',
			'shop.cat.themes':     'Темы',
			'shop.cat.boosts':     'Бустеры',
			'how.title':           'Как играть',
			'how.step1':           'Нажми на пробирку, чтобы выбрать её',
			'how.step2':           'Нажми на другую пробирку, чтобы перелить цвет',
			'how.step3':           'Переливать можно только одинаковый цвет сверху',
			'how.step4':           'Заполни каждую пробирку одним цветом, чтобы пройти уровень',
			'how.tip':             'Используй подсказки и бомбы, если застрял!',
			'levels.title':        'Уровни',
			'levels.locked':       'Заблокирован',
			'btn.magnet':          '🧲 Магнит',
			'btn.freeze':          '🧊 Заморозка',
			'btn.timed':           'На время',
			'timed.title':         'На время!',
			'timed.bonus':         'Бонус за время',
			'timed.expired':       'Время вышло!',
			'timed.expired-desc':  'Доигрывай без бонуса',
			'achieve.title':       'Достижения',
			'achieve.first_steps': 'Первые шаги',
			'achieve.speedster':   'Скоростной',
			'achieve.combo_master': 'Комбо-мастер',
			'achieve.collector':   'Коллекционер',
			'achieve.marathon':    'Марафонец',
			'achieve.bomber':      'Бомбардир',
			'achieve.stargazer':   'Звездочёт',
			'achieve.magnet_master': 'Магнит-мастер',
			'achieve.ice_king':    'Ледяной король',
			'achieve.time_warrior': 'Воин времени',
			'achieve.rainbow_rider': 'Радужный наездник',
			'achieve.perfectionist': 'Перфекционист',
			'achieve.daily_fan':   'Фанат дня',
			'achieve.hint_free':   'Без подсказок',
			'achieve.unstoppable': 'Неудержимый',
			'achieve.desc.first_steps': 'Пройди 5 уровней',
			'achieve.desc.speedster':   'Пройди уровень менее чем за 10 ходов',
			'achieve.desc.combo_master': 'Набери комбо x5',
			'achieve.desc.collector':   'Купи 3 темы',
			'achieve.desc.marathon':    'Пройди 10 уровней подряд',
			'achieve.desc.bomber':      'Используй бомбу 10 раз',
			'achieve.desc.stargazer':   'Собери 50 звёзд',
			'achieve.desc.magnet_master': 'Используй магнит 5 раз',
			'achieve.desc.ice_king':    'Заморозь 20 пробирок',
			'achieve.desc.time_warrior': 'Пройди 5 уровней на время',
			'achieve.desc.rainbow_rider': 'Перелей 10 радужных сегментов',
			'achieve.desc.perfectionist': 'Получи 3 звезды 10 раз',
			'achieve.desc.daily_fan':   'Пройди 7 испытаний дня',
			'achieve.desc.hint_free':   'Пройди 10 уровней без подсказок',
			'achieve.desc.unstoppable': 'Пройди 50 уровней',
		},
		en:
		{
			'game.title':          'Liquix color',
			'btn.play':            'Play',
			'btn.pause':           'Pause',
			'btn.resume':          'Resume',
			'btn.menu':            'Menu',
			'btn.restart':         'Restart',
			'btn.next-level':      'Next Level',
			'btn.undo':            'Undo',
			'btn.extra-tube':      '📺 Extra Tube',
			'btn.restart-level':   'Restart Level',
			'btn.hint':            '💡 Hint',
			'btn.bomb':            '💣 Bomb',
			'btn.endless':         'Endless Mode',
			'btn.daily':           'Daily Challenge',
			'btn.shop':            'Shop',
			'btn.how-to-play':     'How to Play',
			'btn.levels':          'Levels',
			'btn.close':           'Close',
			'btn.buy':             'Buy',
			'game-over.title':     'Game Over',
			'score.label':         'Score',
			'score.result':        'Score:',
			'level.label':         'Level',
			'level.complete':      'Level Complete!',
			'moves.label':         'Moves',
			'combo.label':         'Combo',
			'stars.label':         'Stars',
			'daily.completed':     'Already completed today!',
			'daily.completed-desc': 'Come back tomorrow for a new challenge!',
			'daily.reward':        'Daily challenge reward!',
			'endless.record':      'Record',
			'shop.title':          'Shop',
			'shop.coins':          'Coins',
			'shop.owned':          'Owned',
			'shop.selected':       'Selected',
			'shop.not-enough':     'Not enough coins',
			'shop.cat.themes':     'Themes',
			'shop.cat.boosts':     'Boosts',
			'how.title':           'How to Play',
			'how.step1':           'Tap a tube to select it',
			'how.step2':           'Tap another tube to pour the color',
			'how.step3':           'You can only pour matching colors on top',
			'how.step4':           'Fill each tube with one color to complete the level',
			'how.tip':             'Use hints and bombs if you get stuck!',
			'levels.title':        'Levels',
			'levels.locked':       'Locked',
			'btn.magnet':          '🧲 Magnet',
			'btn.freeze':          '🧊 Freeze',
			'btn.timed':           'Time Attack',
			'timed.title':         'Time Attack!',
			'timed.bonus':         'Time bonus',
			'timed.expired':       'Time\'s up!',
			'timed.expired-desc':  'Keep playing without bonus',
			'achieve.title':       'Achievements',
			'achieve.first_steps': 'First Steps',
			'achieve.speedster':   'Speedster',
			'achieve.combo_master': 'Combo Master',
			'achieve.collector':   'Collector',
			'achieve.marathon':    'Marathon',
			'achieve.bomber':      'Bomber',
			'achieve.stargazer':   'Stargazer',
			'achieve.magnet_master': 'Magnet Master',
			'achieve.ice_king':    'Ice King',
			'achieve.time_warrior': 'Time Warrior',
			'achieve.rainbow_rider': 'Rainbow Rider',
			'achieve.perfectionist': 'Perfectionist',
			'achieve.daily_fan':   'Daily Fan',
			'achieve.hint_free':   'No Hints',
			'achieve.unstoppable': 'Unstoppable',
			'achieve.desc.first_steps': 'Complete 5 levels',
			'achieve.desc.speedster':   'Complete a level in under 10 moves',
			'achieve.desc.combo_master': 'Reach combo x5',
			'achieve.desc.collector':   'Buy 3 themes',
			'achieve.desc.marathon':    'Complete 10 levels in a row',
			'achieve.desc.bomber':      'Use bomb 10 times',
			'achieve.desc.stargazer':   'Collect 50 stars',
			'achieve.desc.magnet_master': 'Use magnet 5 times',
			'achieve.desc.ice_king':    'Freeze 20 tubes',
			'achieve.desc.time_warrior': 'Complete 5 timed levels',
			'achieve.desc.rainbow_rider': 'Pour 10 rainbow segments',
			'achieve.desc.perfectionist': 'Get 3 stars 10 times',
			'achieve.desc.daily_fan':   'Complete 7 daily challenges',
			'achieve.desc.hint_free':   'Complete 10 levels without hints',
			'achieve.desc.unstoppable': 'Complete 50 levels',
		},
	},

	setLang: function (code)
	{
		this._lang = this._map[code] || 'en';
		document.documentElement.lang = this._lang;
	},

	detectFromBrowser: function ()
	{
		try
		{
			var code = (navigator.language || 'ru').split('-')[0];
			this.setLang(code);
		}
		catch (e) { this._lang = 'ru'; }
	},

	t: function (key)
	{
		var dict = this._texts[this._lang] || this._texts['ru'] || {};
		return dict[key] || (this._texts['ru'] && this._texts['ru'][key]) || key;
	},

	lang: function ()
	{
		return this._lang;
	},

	apply: function ()
	{
		var els = document.querySelectorAll('[data-i18n]');
		for (var i = 0; i < els.length; i++)
		{
			var el = els[i];
			var key = el.getAttribute('data-i18n');
			var attr = el.getAttribute('data-i18n-attr');
			var text = this.t(key);

			if (attr)
				el.setAttribute(attr, text);
			else
				el.textContent = text;
		}

		document.title = this.t('game.title');
	},
};
