var Game =
{
	tubes: [],
	level: 1,
	numColors: 3,
	selectedTube: -1,
	moveHistory: [],
	undosLeft: CONFIG.FREE_UNDOS,
	moveCount: 0,
	score: 0,
	isGameOver: false,
	isPaused: false,
	isAnimating: false,
	extraTubeUsed: false,

	// Комбо
	comboCount: 0,
	comboTimer: null,
	comboScore: 0,

	// Подсказка
	hintsLeft: CONFIG.HINTS_PER_LEVEL,
	hintMove: null,

	// Бомба
	bombsLeft: 0,
	bombMode: false,

	// Магнит
	magnetMode: false,

	// Заморозка
	frozenTubes: {},

	// Режим на время
	isTimedMode: false,
	timedStart: 0,
	timedSeconds: 0,
	timedExpired: false,
	_timerInterval: null,

	// Радужный сегмент
	hasRainbow: false,

	// Достижения: счётчики текущей сессии
	_sessionLevels: 0,
	_usedHintThisLevel: false,

	// Режимы
	isEndlessMode: false,
	endlessLevel: 0,
	isDailyMode: false,

	// Seeded PRNG
	_rng: null,

	init: function ()
	{
		this.level = Progress.get('level') || 1;
		this.score = Progress.get('highScore') || 0;
		this.isGameOver = false;
		this.isPaused = false;
		this.isEndlessMode = false;
		this.isDailyMode = false;
		this.isTimedMode = false;
		this.timedExpired = false;
		this.magnetMode = false;
		this.frozenTubes = {};
		this._rng = null;
		this._sessionLevels = 0;
		this._usedHintThisLevel = false;
		this._stopTimer();
		this.generateLevel(this.level);
	},

	generateLevel: function (level)
	{
		this.selectedTube = -1;
		this.moveHistory = [];
		this.undosLeft = CONFIG.FREE_UNDOS;
		this.moveCount = 0;
		this.isAnimating = false;
		this.extraTubeUsed = false;
		this.comboCount = 0;
		this.comboScore = 0;
		this.hintsLeft = CONFIG.HINTS_PER_LEVEL;
		this.hintMove = null;
		this.bombsLeft = CONFIG.BOMBS_PER_LEVEL;
		this.bombMode = false;
		this.magnetMode = false;
		this.frozenTubes = {};
		this.hasRainbow = false;
		this.rainbowOriginalColor = -1;
		this._usedHintThisLevel = false;

		if (this.comboTimer)
		{
			clearTimeout(this.comboTimer);
			this.comboTimer = null;
		}

		// В бесконечном режиме numColors уже задан в nextEndlessLevel()
		if (!this.isEndlessMode)
		{
			this.numColors = Math.min(
				CONFIG.STARTING_COLORS + Math.floor((level - 1) / 3),
				CONFIG.MAX_COLORS
			);
		}

		var rng = this._rng || Math.random;
		this._buildTubes(rng);
	},

	_buildTubes: function (rng)
	{
		var tubes = [];
		for (var c = 0; c < this.numColors; c++)
		{
			var tube = [];
			for (var s = 0; s < CONFIG.TUBE_CAPACITY; s++)
				tube.push(c);
			tubes.push(tube);
		}

		for (var e = 0; e < CONFIG.EMPTY_TUBES; e++)
			tubes.push([]);

		var totalTubes = tubes.length;
		var shuffleMoves = 200 + this.level * 10;

		for (var m = 0; m < shuffleMoves; m++)
		{
			var from = Math.floor(rng() * totalTubes);
			var to = Math.floor(rng() * totalTubes);
			if (from === to) continue;
			if (tubes[from].length === 0) continue;
			if (tubes[to].length >= CONFIG.TUBE_CAPACITY) continue;
			tubes[to].push(tubes[from].pop());
		}

		if (this._isSolved(tubes))
		{
			this._buildTubes(rng);
			return;
		}

		// Радужный сегмент (джокер) — с уровня RAINBOW_START_LEVEL
		if (!this.isEndlessMode && !this.isDailyMode &&
			this.level >= CONFIG.RAINBOW_START_LEVEL)
		{
			// Заменяем один случайный сегмент на радужный
			var nonEmpty = [];
			for (var ri = 0; ri < tubes.length; ri++)
			{
				for (var rj = 0; rj < tubes[ri].length; rj++)
					nonEmpty.push({ t: ri, s: rj });
			}
			if (nonEmpty.length > 0)
			{
				var pick = nonEmpty[Math.floor(rng() * nonEmpty.length)];
				this.rainbowOriginalColor = tubes[pick.t][pick.s];
				tubes[pick.t][pick.s] = CONFIG.RAINBOW_COLOR_IDX;
				this.hasRainbow = true;
			}
		}

		this.tubes = tubes;
	},

	_isSolved: function (tubes)
	{
		for (var i = 0; i < tubes.length; i++)
		{
			var t = tubes[i];
			if (t.length === 0) continue;
			if (t.length !== CONFIG.TUBE_CAPACITY) return false;

			// Находим первый реальный цвет (не радужный)
			var realColor = -1;
			for (var j = 0; j < t.length; j++)
			{
				if (t[j] !== CONFIG.RAINBOW_COLOR_IDX)
				{
					realColor = t[j];
					break;
				}
			}

			// Пробирка целиком из радужных — ок
			if (realColor === -1) continue;

			// Все не-радужные сегменты должны совпадать с realColor
			for (var k = 0; k < t.length; k++)
			{
				if (t[k] !== CONFIG.RAINBOW_COLOR_IDX && t[k] !== realColor)
					return false;
			}
		}
		return true;
	},

	/**
	 * @param {number} index
	 * @returns {string} 'selected' | 'deselected' | 'pour' | 'invalid' | 'bomb'
	 */
	selectTube: function (index)
	{
		if (this.isAnimating || this.isGameOver || this.isPaused) return 'invalid';
		if (index < 0 || index >= this.tubes.length) return 'invalid';

		// Режим бомбы
		if (this.bombMode)
		{
			if (this.frozenTubes[index]) return 'invalid';
			if (this.useBomb(index))
				return 'bomb';
			return 'invalid';
		}

		// Режим магнита — выбираем цвет из тапнутой пробирки
		if (this.magnetMode)
		{
			if (this.tubes[index].length === 0) return 'invalid';
			if (this.useMagnet(index))
				return 'magnet';
			return 'invalid';
		}

		if (this.selectedTube === -1)
		{
			if (this.tubes[index].length === 0) return 'invalid';
			if (this.frozenTubes[index]) return 'invalid';
			this.selectedTube = index;
			return 'selected';
		}

		if (this.selectedTube === index)
		{
			this.selectedTube = -1;
			return 'deselected';
		}

		if (this.frozenTubes[index])
		{
			// Нельзя лить в замороженную
			this.selectedTube = -1;
			return 'invalid';
		}

		if (this.canPour(this.selectedTube, index))
		{
			this.pour(this.selectedTube, index);
			this.selectedTube = -1;
			return 'pour';
		}

		if (this.tubes[index].length > 0 && !this.frozenTubes[index])
		{
			this.selectedTube = index;
			return 'selected';
		}

		this.selectedTube = -1;
		return 'invalid';
	},

	canPour: function (fromIdx, toIdx)
	{
		var from = this.tubes[fromIdx];
		var to = this.tubes[toIdx];

		if (from.length === 0) return false;
		if (to.length >= CONFIG.TUBE_CAPACITY) return false;
		if (this.frozenTubes[fromIdx] || this.frozenTubes[toIdx]) return false;
		if (to.length === 0) return true;

		var topFrom = from[from.length - 1];
		var topTo = to[to.length - 1];

		// Радужный сегмент совместим с любым цветом
		if (topFrom === CONFIG.RAINBOW_COLOR_IDX || topTo === CONFIG.RAINBOW_COLOR_IDX)
			return true;

		if (topFrom !== topTo) return false;

		return CONFIG.TUBE_CAPACITY - to.length > 0;
	},

	getTopSegments: function (idx)
	{
		var tube = this.tubes[idx];
		if (tube.length === 0) return { color: -1, count: 0 };

		var color = tube[tube.length - 1];
		var count = 1;

		for (var i = tube.length - 2; i >= 0; i--)
		{
			if (tube[i] !== color) break;
			count++;
		}

		return { color: color, count: count };
	},

	pour: function (fromIdx, toIdx)
	{
		var from = this.tubes[fromIdx];
		var to = this.tubes[toIdx];
		var seg = this.getTopSegments(fromIdx);
		var freeSpace = CONFIG.TUBE_CAPACITY - to.length;
		var pourCount = Math.min(seg.count, freeSpace);

		this.moveHistory.push({
			type: 'pour',
			from: fromIdx,
			to: toIdx,
			count: pourCount,
			rainbowConverted: [],
		});

		var lastMove = this.moveHistory[this.moveHistory.length - 1];

		for (var i = 0; i < pourCount; i++)
		{
			var seg2 = from.pop();

			// Радужный сегмент принимает цвет приёмника
			if (seg2 === CONFIG.RAINBOW_COLOR_IDX && to.length > 0)
			{
				var targetColor = to[to.length - 1];
				if (targetColor !== CONFIG.RAINBOW_COLOR_IDX)
				{
					lastMove.rainbowConverted.push({ idx: to.length, origColor: seg2 });
					seg2 = targetColor;
					Progress.incStat('rainbowsPoured');
				}
			}
			// Если льём обычный на радужный — радужный принимает цвет обычного
			else if (to.length > 0 && to[to.length - 1] === CONFIG.RAINBOW_COLOR_IDX && seg2 !== CONFIG.RAINBOW_COLOR_IDX)
			{
				// Конвертируем существующие радужные в верхушке
				for (var ri = to.length - 1; ri >= 0; ri--)
				{
					if (to[ri] === CONFIG.RAINBOW_COLOR_IDX)
					{
						lastMove.rainbowConverted.push({ idx: ri, origColor: CONFIG.RAINBOW_COLOR_IDX });
						to[ri] = seg2;
						Progress.incStat('rainbowsPoured');
					}
					else break;
				}
			}

			to.push(seg2);
		}

		this.moveCount++;
		this._tickCombo();
		this.hintMove = null;
	},

	// --- Комбо ---

	_tickCombo: function ()
	{
		var self = this;
		this.comboCount++;

		if (this.comboTimer)
			clearTimeout(this.comboTimer);

		if (this.comboCount > 1)
			this.comboScore += this.comboCount * CONFIG.COMBO_BONUS_BASE;

		this.comboTimer = setTimeout(function ()
		{
			self.comboCount = 0;
			self.comboTimer = null;
		}, CONFIG.COMBO_TIMEOUT);
	},

	// --- Отмена ---

	undo: function ()
	{
		if (this.moveHistory.length === 0) return false;
		if (this.undosLeft <= 0) return false;
		if (this.isAnimating) return false;

		var move = this.moveHistory.pop();

		if (move.type === 'bomb')
		{
			// Восстанавливаем все сегменты в исходные позиции (в обратном порядке удаления)
			for (var ri = move.removed.length - 1; ri >= 0; ri--)
			{
				var r = move.removed[ri];
				this.tubes[r.tube].splice(r.idx, 0, r.color);
			}
			this.bombsLeft++;
		}
		else
		{
			var from = this.tubes[move.to];
			var to = this.tubes[move.from];
			for (var i = 0; i < move.count; i++)
				to.push(from.pop());
		}

		this.undosLeft--;
		this.moveCount = Math.max(0, this.moveCount - 1);
		this.hintMove = null;
		return true;
	},

	// --- Доп. пробирка ---

	addExtraTube: function ()
	{
		if (this.extraTubeUsed) return false;
		this.tubes.push([]);
		this.extraTubeUsed = true;
		return true;
	},

	// --- Бомба ---

	useBomb: function (tubeIdx)
	{
		var tube = this.tubes[tubeIdx];
		if (tube.length === 0) return false;

		var targetColor = tube[tube.length - 1];
		if (targetColor === CONFIG.RAINBOW_COLOR_IDX) return false;

		// Удаляем все сегменты этого цвета со всей доски (ровно TUBE_CAPACITY штук),
		// чтобы сохранить сбалансированность и проходимость уровня.
		// Если радуга была исходно этого цвета — удаляем и её.
		var removed = [];
		for (var i = 0; i < this.tubes.length; i++)
		{
			for (var j = this.tubes[i].length - 1; j >= 0; j--)
			{
				var seg = this.tubes[i][j];
				var isTarget = seg === targetColor;
				var isOrphanRainbow = seg === CONFIG.RAINBOW_COLOR_IDX &&
					this.rainbowOriginalColor === targetColor;

				if (isTarget || isOrphanRainbow)
				{
					removed.push({ tube: i, idx: j, color: seg });
					this.tubes[i].splice(j, 1);
				}
			}
		}

		this.moveHistory.push({
			type: 'bomb',
			color: targetColor,
			removed: removed,
		});

		this.bombMode = false;
		this.bombsLeft--;
		this.moveCount++;
		this.hintMove = null;
		Progress.incStat('bombsUsed');
		return true;
	},

	// --- Подсказка ---

	findBestMove: function ()
	{
		var bestMove = null;
		var bestScore = -1;

		for (var from = 0; from < this.tubes.length; from++)
		{
			if (this.tubes[from].length === 0) continue;

			for (var to = 0; to < this.tubes.length; to++)
			{
				if (from === to) continue;
				if (!this.canPour(from, to)) continue;

				var score = this._scorePourMove(from, to);
				if (score > bestScore)
				{
					bestScore = score;
					bestMove = { from: from, to: to };
				}
			}
		}

		return bestMove;
	},

	_scorePourMove: function (fromIdx, toIdx)
	{
		var from = this.tubes[fromIdx];
		var to = this.tubes[toIdx];
		var seg = this.getTopSegments(fromIdx);
		var freeSpace = CONFIG.TUBE_CAPACITY - to.length;
		var pourCount = Math.min(seg.count, freeSpace);
		var score = 0;

		// Завершение пробирки (все 4 одного цвета) — высший приоритет
		if (to.length + pourCount === CONFIG.TUBE_CAPACITY)
		{
			var allSame = true;
			for (var i = 0; i < to.length; i++)
			{
				if (to[i] !== seg.color) { allSame = false; break; }
			}
			if (allSame) score += 1000;
		}

		// Перелив на совпадающий цвет лучше чем в пустую
		if (to.length > 0)
			score += 100;

		// Больше сегментов за раз — лучше
		score += pourCount * 10;

		// Полное опустошение источника — хорошо
		if (from.length === pourCount)
			score += 50;

		// Перелив из смешанных пробирок — лучше чем из однородных
		var fromUnique = {};
		for (var j = 0; j < from.length; j++)
			fromUnique[from[j]] = true;
		score += Object.keys(fromUnique).length * 5;

		return score;
	},

	// --- Звёзды ---

	getOptimalMoves: function ()
	{
		return this.numColors * 3;
	},

	getStars: function ()
	{
		var optimal = this.getOptimalMoves();
		var ratio = this.moveCount / optimal;

		if (ratio <= CONFIG.STAR_THRESHOLDS[0]) return 3;
		if (ratio <= CONFIG.STAR_THRESHOLDS[1]) return 2;
		if (ratio <= CONFIG.STAR_THRESHOLDS[2]) return 1;
		return 1;
	},

	// --- Проверка победы ---

	checkWin: function ()
	{
		return this._isSolved(this.tubes);
	},

	nextLevel: function ()
	{
		this.level++;
		this.score += CONFIG.POINTS_PER_LEVEL + this.comboScore;
		Progress.set('level', this.level);
		Progress.updateHighScore(this.score);
		Progress.addCoins(CONFIG.COINS_PER_LEVEL);
		Progress.set('totalMoves', Progress.get('totalMoves') + this.moveCount);
		this._sessionLevels++;
		Progress.incStat('levelsWon');
		if (!this._usedHintThisLevel) Progress.incStat('noHintWins');
		if (this.moveCount < 10) Progress.incStat('fastWins');
		if (this._sessionLevels > (Progress.get('stats') || {}).streakLevels || 0)
			Progress.setStat('streakLevels', this._sessionLevels);

		// Бонус за время
		if (this.isTimedMode)
		{
			var bonus = this.getTimedBonus();
			if (bonus > 0)
				Progress.addCoins(bonus);
			Progress.incStat('timedWins');
			this._stopTimer();
		}

		this._rng = null;
		this.generateLevel(this.level);

		if (this.isTimedMode && !this.timedExpired)
		{
			this.timedSeconds = CONFIG.TIMED_BASE_SECONDS;
			this._startTimer();
		}
	},

	restartLevel: function ()
	{
		if (this.isDailyMode)
			this._initDailyRng();
		else
			this._rng = null;
		this.generateLevel(this.level);
	},

	// --- Бесконечный режим ---

	initEndless: function ()
	{
		this.isEndlessMode = true;
		this.isDailyMode = false;
		this.endlessLevel = 0;
		this._rng = null;
		this.nextEndlessLevel();
	},

	nextEndlessLevel: function ()
	{
		this.endlessLevel++;
		this.numColors = Math.min(
			CONFIG.ENDLESS_START_COLORS + Math.floor((this.endlessLevel - 1) / CONFIG.ENDLESS_COLOR_INCREASE_EVERY),
			CONFIG.MAX_COLORS
		);
		this.level = this.endlessLevel;
		this._rng = null;
		this.generateLevel(this.endlessLevel);
		Progress.updateEndlessHigh(this.endlessLevel);
	},

	// --- Ежедневный вызов ---

	initDaily: function ()
	{
		this.isDailyMode = true;
		this.isEndlessMode = false;
		this.numColors = CONFIG.DAILY_BASE_COLORS;
		this.level = 1;
		this._initDailyRng();
		this.generateLevel(this.level);
	},

	_initDailyRng: function ()
	{
		var seed = new Date().toISOString().split('T')[0];
		this._rng = this._seededRandom(seed);
	},

	_seededRandom: function (seed)
	{
		var h = 0;
		for (var i = 0; i < seed.length; i++)
		{
			h = ((h << 5) - h) + seed.charCodeAt(i);
			h = h & h;
		}

		return function ()
		{
			h |= 0;
			h = h + 0x6D2B79F5 | 0;
			var t = Math.imul(h ^ h >>> 15, 1 | h);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	},

	// --- Магнит ---

	useMagnet: function (tubeIdx)
	{
		var tube = this.tubes[tubeIdx];
		if (tube.length === 0) return false;

		var targetColor = tube[tube.length - 1];
		if (targetColor === CONFIG.RAINBOW_COLOR_IDX) return false;

		// Находим свободную пробирку или ту, что уже содержит только этот цвет
		var destIdx = -1;
		for (var i = 0; i < this.tubes.length; i++)
		{
			if (this.frozenTubes[i]) continue;
			var t = this.tubes[i];
			if (t.length === 0) { destIdx = i; break; }
			var allSame = true;
			for (var j = 0; j < t.length; j++)
			{
				if (t[j] !== targetColor) { allSame = false; break; }
			}
			if (allSame && t.length < CONFIG.TUBE_CAPACITY) { destIdx = i; break; }
		}
		if (destIdx === -1) return false;

		// Собираем все сегменты этого цвета со всех незамороженных пробирок
		var collected = [];
		for (var ci = 0; ci < this.tubes.length; ci++)
		{
			if (this.frozenTubes[ci]) continue;
			for (var cj = this.tubes[ci].length - 1; cj >= 0; cj--)
			{
				if (this.tubes[ci][cj] === targetColor)
				{
					collected.push({ tube: ci, idx: cj });
					this.tubes[ci].splice(cj, 1);
				}
			}
		}

		// Вставляем в целевую пробирку (до лимита)
		var dest = this.tubes[destIdx];
		var placed = 0;
		for (var pi = 0; pi < collected.length && dest.length < CONFIG.TUBE_CAPACITY; pi++)
		{
			dest.push(targetColor);
			placed++;
		}

		this.moveHistory.push({
			type: 'magnet',
			color: targetColor,
			destIdx: destIdx,
			collected: collected,
			placed: placed,
		});

		this.magnetMode = false;
		this.moveCount++;
		this.hintMove = null;
		Progress.incStat('magnetsUsed');
		return true;
	},

	// --- Заморозка ---

	toggleFreeze: function (tubeIdx)
	{
		if (tubeIdx < 0 || tubeIdx >= this.tubes.length) return;
		if (this.frozenTubes[tubeIdx])
		{
			delete this.frozenTubes[tubeIdx];
		}
		else
		{
			this.frozenTubes[tubeIdx] = true;
			Progress.incStat('freezesUsed');
		}
	},

	isFrozen: function (tubeIdx)
	{
		return !!this.frozenTubes[tubeIdx];
	},

	// --- Режим на время ---

	initTimed: function ()
	{
		this.isTimedMode = true;
		this.isEndlessMode = false;
		this.isDailyMode = false;
		this.timedExpired = false;
		this.timedSeconds = CONFIG.TIMED_BASE_SECONDS;
		this._rng = null;
		this.level = Progress.get('level') || 1;
		this.generateLevel(this.level);
		this._startTimer();
	},

	_startTimer: function ()
	{
		this._stopTimer();
		this.timedStart = Date.now();
		var self = this;
		this._timerInterval = setInterval(function ()
		{
			if (self.isPaused || self.isGameOver) return;
			var elapsed = Math.floor((Date.now() - self.timedStart) / 1000);
			var remaining = self.timedSeconds - elapsed;
			if (remaining <= 0 && !self.timedExpired)
			{
				self.timedExpired = true;
				if (typeof self.onTimedExpired === 'function')
					self.onTimedExpired();
			}
			if (typeof self.onTimerTick === 'function')
				self.onTimerTick(Math.max(0, remaining));
		}, 250);
	},

	_stopTimer: function ()
	{
		if (this._timerInterval)
		{
			clearInterval(this._timerInterval);
			this._timerInterval = null;
		}
	},

	getTimedRemaining: function ()
	{
		if (!this.isTimedMode) return -1;
		var elapsed = Math.floor((Date.now() - this.timedStart) / 1000);
		return Math.max(0, this.timedSeconds - elapsed);
	},

	getTimedBonus: function ()
	{
		var remaining = this.getTimedRemaining();
		if (this.timedExpired || remaining <= 0) return 0;
		return remaining * CONFIG.TIMED_BONUS_PER_SECOND;
	},

	// --- Пауза ---

	pause: function ()
	{
		if (this.isGameOver || this.isPaused) return;
		this.isPaused = true;

		if (this.comboTimer)
		{
			clearTimeout(this.comboTimer);
			this.comboTimer = null;
		}

		YandexSDK.gameplayStop();
	},

	resume: function ()
	{
		if (!this.isPaused) return;
		this.isPaused = false;
		// Компенсируем время паузы для таймера
		if (this.isTimedMode && !this.timedExpired)
		{
			var elapsed = Math.floor((Date.now() - this.timedStart) / 1000);
			var remaining = this.timedSeconds - elapsed;
			this.timedSeconds = remaining;
			this.timedStart = Date.now();
		}
		YandexSDK.gameplayStart();
	},
};
