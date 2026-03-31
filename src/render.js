var Render =
{
	canvas: null,
	ctx: null,
	tubePositions: [],
	dpr: 1,

	tubeW: 44,
	tubeH: 160,
	tubeGap: 12,
	tubePadding: 20,

	_anim: null,
	_popups: [],
	_hintAnim: null,
	_hintStart: 0,
	_idleAnim: null,
	_idleTime: 0,
	_bubbles: [],

	// Для анимации выбора (плавный подъём)
	_selectionOffsets: {},
	_selectionTarget: {},

	init: function (canvasId)
	{
		this.canvas = document.getElementById(canvasId);
		if (!this.canvas) return;
		this.ctx = this.canvas.getContext('2d');
		this.dpr = window.devicePixelRatio || 1;
		this.tubeW = CONFIG.TUBE_WIDTH;
		this.tubeH = CONFIG.TUBE_HEIGHT;
		this.tubeGap = CONFIG.TUBE_GAP;
		this._popups = [];
		this._bubbles = [];
		this._selectionOffsets = {};
		this._selectionTarget = {};
		this.calcLayout();
		this._startIdleLoop();
		this._bindResize();
	},

	_bindResize: function ()
	{
		if (this._resizeObserver)
			this._resizeObserver.disconnect();

		if (typeof ResizeObserver === 'undefined') return;

		var self = this;
		this._resizeObserver = new ResizeObserver(function ()
		{
			if (!Game.isAnimating)
			{
				self.calcLayout();
				self.drawAll();
			}
		});
		this._resizeObserver.observe(this.canvas);
	},

	calcLayout: function ()
	{
		var total = Game.tubes.length;
		if (total === 0) return;

		// Сбрасываем inline-стиль — пусть CSS (grid 1fr) определит размер ячейки
		this.canvas.style.width = '';
		this.canvas.style.height = '';

		// offsetWidth/Height вызывают синхронный reflow и возвращают CSS-размер.
		// Если ноль — экран ещё скрыт; откладываем через RAF.
		var availW = this.canvas.offsetWidth;
		var availH = this.canvas.offsetHeight;

		if (availW === 0 || availH === 0)
		{
			var self = this;
			requestAnimationFrame(function () { self.calcLayout(); self.drawAll(); });
			return;
		}

		var maxPerRow = 7;
		var rows, perRow;

		if (total <= maxPerRow)
		{
			rows = 1;
			perRow = total;
		}
		else
		{
			rows = 2;
			perRow = Math.ceil(total / 2);
		}

		var pad      = this.tubePadding;
		var topH     = 20;   // место для подписи над трубками
		var rowGapY  = 20;
		var aspect   = CONFIG.TUBE_HEIGHT / CONFIG.TUBE_WIDTH;

		// Вписываем трубки в availW × availH с сохранением пропорции
		var maxTubeW = Math.floor((availW - pad * 2 - (perRow - 1) * this.tubeGap) / perRow);
		var maxTubeH = Math.floor((availH - pad * 2 - topH - (rows - 1) * rowGapY) / rows);

		var tubeW = Math.min(maxTubeW, Math.floor(maxTubeH / aspect));
		var tubeH = Math.round(tubeW * aspect);

		tubeW = Math.max(28, tubeW);
		tubeH = Math.max(90, tubeH);

		this.tubeW = tubeW;
		this.tubeH = tubeH;

		this.canvas.width  = availW * this.dpr;
		this.canvas.height = availH * this.dpr;
		this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

		this.tubePositions = [];

		for (var i = 0; i < total; i++)
		{
			var row = rows === 1 ? 0 : Math.floor(i / perRow);
			var col = rows === 1 ? i : i % perRow;
			var itemsInRow = row === 0 ? perRow : total - perRow;
			var rw = itemsInRow * tubeW + (itemsInRow - 1) * this.tubeGap;
			var offsetX = (availW - rw) / 2;

			var x = offsetX + col * (tubeW + this.tubeGap);
			var y = pad + topH + row * (tubeH + rowGapY);

			this.tubePositions.push({ x: x, y: y, index: i });
		}
	},

	clear: function ()
	{
		if (!this.ctx) return;
		this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
	},

	// === Idle-loop ===

	_startIdleLoop: function ()
	{
		if (this._idleAnim) return;
		var self = this;

		function loop(ts)
		{
			self._idleTime = ts;
			// Плавная анимация выбора
			self._tickSelectionOffsets();
			if (!self._anim && !self._hintAnim)
				self.drawAll(ts);
			self._idleAnim = requestAnimationFrame(loop);
		}

		this._idleAnim = requestAnimationFrame(loop);
	},

	stopIdleLoop: function ()
	{
		if (this._idleAnim)
		{
			cancelAnimationFrame(this._idleAnim);
			this._idleAnim = null;
		}
	},

	// Плавная анимация подъёма/опускания при выборе
	_tickSelectionOffsets: function ()
	{
		for (var i = 0; i < Game.tubes.length; i++)
		{
			var target = (Game.selectedTube === i) ? -14 : 0;
			var cur = this._selectionOffsets[i] || 0;
			this._selectionOffsets[i] = cur + (target - cur) * 0.18;
			if (Math.abs(this._selectionOffsets[i]) < 0.1 && target === 0)
				this._selectionOffsets[i] = 0;
		}
	},

	// === Рисовка ===

	drawAll: function (time)
	{
		if (!this.ctx) return;
		var t = time || this._idleTime || performance.now();
		this.clear();

		for (var i = 0; i < Game.tubes.length; i++)
		{
			var pos = this.tubePositions[i];
			if (!pos) continue;
			var isBombTarget = Game.bombMode;
			this.drawTube(pos.x, pos.y, Game.tubes[i], i, isBombTarget, t);
		}

		this._drawBubbles(t);
		this._drawPopups();
	},

	// === Пробирка ===

	drawTube: function (x, y, tube, tubeIndex, isBombTarget, time, topDrainFrac, waveDampen)
	{
		var ctx = this.ctx;
		var w = this.tubeW;
		var h = this.tubeH;
		var cap = CONFIG.TUBE_CAPACITY;
		var segH = (h - 16) / cap;
		var radius = w / 2;
		var offsetY = this._selectionOffsets[tubeIndex] || 0;
		var drawY = y + offsetY;
		var t = time || 0;
		var isSelected = (Game.selectedTube === tubeIndex);
		var drainFrac = topDrainFrac || 0;
		var wDamp = waveDampen || 0;

		// Тень под пробиркой
		ctx.save();
		ctx.fillStyle = 'rgba(0,0,0,0.12)';
		ctx.beginPath();
		ctx.ellipse(x + w / 2, y + h + 4, w / 2 + 2, 4, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		// Подсветка при выборе
		if (isSelected)
		{
			var glowPulse = 0.6 + 0.4 * Math.sin(t * 0.004);
			ctx.save();
			ctx.shadowColor = CONFIG.COLORS.selectionGlow;
			ctx.shadowBlur = 18 + 8 * glowPulse;
			ctx.strokeStyle = 'rgba(124, 92, 255, ' + (0.3 + 0.2 * glowPulse) + ')';
			ctx.lineWidth = 2;
			this._tubeShape(x, drawY, w, h, radius);
			ctx.stroke();
			ctx.restore();
		}

		if (isBombTarget)
		{
			var bombPulse = 0.5 + 0.5 * Math.sin(t * 0.006);
			ctx.save();
			ctx.shadowColor = CONFIG.COLORS.bombGlow;
			ctx.shadowBlur = 10 + 6 * bombPulse;
			ctx.strokeStyle = 'rgba(239, 68, 68, ' + (0.3 + 0.2 * bombPulse) + ')';
			ctx.lineWidth = 2;
			this._tubeShape(x, drawY, w, h, radius);
			ctx.stroke();
			ctx.restore();
		}

		// Фон стекла (прозрачность с внутренним градиентом)
		ctx.save();
		var glassGrad = ctx.createLinearGradient(x, drawY, x + w, drawY);
		glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
		glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
		glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
		glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
		ctx.fillStyle = glassGrad;
		this._tubeShape(x, drawY, w, h, radius);
		ctx.fill();
		ctx.restore();

		// === Жидкость (группировка по цветовым полосам) ===
		var colors = Progress.getLiquidColors();
		var tubeInnerBottom = drawY + h;

		if (tube.length > 0)
		{
			// Группируем последовательные сегменты одного цвета в «полосы»
			var bands = [];
			var bi = 0;
			while (bi < tube.length)
			{
				var bandColorIdx = tube[bi];
				var bandStart = bi;
				while (bi < tube.length && tube[bi] === bandColorIdx) bi++;
				bands.push({ colorIdx: bandColorIdx, startSeg: bandStart, count: bi - bandStart });
			}

			for (var bIdx = 0; bIdx < bands.length; bIdx++)
			{
				var band = bands[bIdx];
				var isRainbow = (band.colorIdx === CONFIG.RAINBOW_COLOR_IDX);
				var color = isRainbow ? '#fff' : (colors[band.colorIdx] || '#888');
				var isFirstBand = (bIdx === 0);
				var isLastBand = (bIdx === bands.length - 1);

				var bandBottomY = drawY + h - radius - band.startSeg * segH;
				var bandTopY = drawY + h - radius - (band.startSeg + band.count) * segH;
				var bandHeight = bandBottomY - bandTopY;

				// Частичное опустошение верхней полосы при переливании
				if (isLastBand && drainFrac > 0)
				{
					bandTopY += segH * drainFrac;
					bandHeight = bandBottomY - bandTopY;
					if (bandHeight <= 0) continue;
				}

				ctx.save();
				ctx.beginPath();
				this._tubeShape(x, drawY, w, h, radius);
				ctx.clip();

				// Форма полосы
				ctx.beginPath();
				if (isLastBand)
				{
					// Верх полосы — мениск с волнами (затухают при wDamp → 1)
					var wS1 = t * 0.0018 + tubeIndex * 1.7;
					var wS2 = t * 0.0028 + tubeIndex * 2.5;
					var wS3 = t * 0.0013 + tubeIndex * 0.9;
					var waveScale = 1 - wDamp;
					var baseAmp = 1.8 * waveScale;
					var meniscusDepth = 2.5 * waveScale;

					ctx.moveTo(x - 1, bandTopY + meniscusDepth + baseAmp + 2);
					for (var wx = 0; wx <= w; wx += 1)
					{
						var nx = wx / w;
						var meniscus = meniscusDepth * (4 * (nx - 0.5) * (nx - 0.5));
						var wave = Math.sin(wS1 + wx * 0.2) * baseAmp
							+ Math.sin(wS2 + wx * 0.14) * (baseAmp * 0.4)
							+ Math.sin(wS3 + wx * 0.3) * (baseAmp * 0.2);
						ctx.lineTo(x + wx, bandTopY + meniscus + wave + baseAmp + 1);
					}
				}
				else
				{
					// Верх полосы — плоский (перекрытие 1px)
					ctx.moveTo(x - 1, bandTopY - 1);
					ctx.lineTo(x + w + 1, bandTopY - 1);
				}

				if (isFirstBand)
				{
					// Низ полосы — скруглённое дно пробирки
					ctx.lineTo(x + w + 1, drawY + h - radius);
					ctx.arcTo(x + w + 1, tubeInnerBottom + 1, x + radius, tubeInnerBottom + 1, radius);
					ctx.arcTo(x - 1, tubeInnerBottom + 1, x - 1, drawY + h - radius, radius);
				}
				else
				{
					// Низ полосы — плоский (перекрытие 1px)
					ctx.lineTo(x + w + 1, bandBottomY + 1);
					ctx.lineTo(x - 1, bandBottomY + 1);
				}
				ctx.closePath();

				// Единый вертикальный градиент на всю полосу
				var gradTop = bandTopY;
				var gradBot = isFirstBand ? tubeInnerBottom : bandBottomY;

				if (isRainbow)
				{
					// Радужный переливающийся градиент
					var rOff = t * 0.001;
					var rainGrad = ctx.createLinearGradient(x, gradTop, x + w, gradBot);
					rainGrad.addColorStop(0, 'hsl(' + ((rOff * 60) % 360) + ',90%,60%)');
					rainGrad.addColorStop(0.2, 'hsl(' + ((rOff * 60 + 72) % 360) + ',90%,60%)');
					rainGrad.addColorStop(0.4, 'hsl(' + ((rOff * 60 + 144) % 360) + ',90%,60%)');
					rainGrad.addColorStop(0.6, 'hsl(' + ((rOff * 60 + 216) % 360) + ',90%,60%)');
					rainGrad.addColorStop(0.8, 'hsl(' + ((rOff * 60 + 288) % 360) + ',90%,60%)');
					rainGrad.addColorStop(1, 'hsl(' + ((rOff * 60 + 360) % 360) + ',90%,60%)');
					ctx.fillStyle = rainGrad;
				}
				else
				{
					var liqGrad = ctx.createLinearGradient(x, gradTop, x, gradBot);
					liqGrad.addColorStop(0, this._lightenColor(color, 0.1));
					liqGrad.addColorStop(0.4, color);
					liqGrad.addColorStop(1, this._darkenColor(color, 0.78));
					ctx.fillStyle = liqGrad;
				}
				ctx.fill();

				// Горизонтальный блик
				var hGrad = ctx.createLinearGradient(x, bandTopY, x + w, bandTopY);
				hGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
				hGrad.addColorStop(0.12, 'rgba(255,255,255,0.10)');
				hGrad.addColorStop(0.3, 'rgba(255,255,255,0.0)');
				hGrad.addColorStop(0.8, 'rgba(255,255,255,0.0)');
				hGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
				ctx.fillStyle = hGrad;
				ctx.fill();

				// Каустики
				var cOff = tubeIndex * 37 + bIdx * 13;
				var cx1 = x + w * (0.25 + 0.2 * Math.sin(t * 0.0008 + cOff));
				var cy1 = bandTopY + bandHeight * (0.35 + 0.15 * Math.cos(t * 0.001 + cOff));
				var cr1 = w * 0.2 + w * 0.06 * Math.sin(t * 0.0015 + cOff);
				var causG = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, cr1);
				causG.addColorStop(0, 'rgba(255,255,255,0.14)');
				causG.addColorStop(1, 'rgba(255,255,255,0.0)');
				ctx.fillStyle = causG;
				ctx.fill();

				if (bandHeight > 20)
				{
					var cx2 = x + w * (0.7 + 0.15 * Math.cos(t * 0.0012 + cOff + 2));
					var cy2 = bandTopY + bandHeight * (0.6 + 0.1 * Math.sin(t * 0.0009 + cOff + 1));
					var cr2 = w * 0.15;
					var causG2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cr2);
					causG2.addColorStop(0, 'rgba(255,255,255,0.08)');
					causG2.addColorStop(1, 'rgba(255,255,255,0.0)');
					ctx.fillStyle = causG2;
					ctx.fill();
				}

				// Линия раздела между РАЗНЫМИ цветами
				if (!isFirstBand)
				{
					ctx.strokeStyle = 'rgba(0,0,0,0.15)';
					ctx.lineWidth = 0.8;
					ctx.beginPath();
					ctx.moveTo(x, bandBottomY);
					ctx.lineTo(x + w, bandBottomY);
					ctx.stroke();
				}

				ctx.restore();
			}

			// Пузырьки от верхнего сегмента
			if (tube.length > 0 && Math.random() > 0.975)
			{
				var lastBand = bands[bands.length - 1];
				var bubTopY = drawY + h - radius - (lastBand.startSeg + lastBand.count) * segH;
				var bubBotY = drawY + h - radius - lastBand.startSeg * segH;
				this._bubbles.push({
					x: x + 3 + Math.random() * (w - 6),
					y: bubBotY - 2,
					targetY: bubTopY + 6,
					r: 0.8 + Math.random() * 2.2,
					speed: 0.12 + Math.random() * 0.35,
					wobble: Math.random() * Math.PI * 2,
					life: 1,
				});
			}
		}

		// Обводка пробирки
		ctx.save();
		ctx.strokeStyle = isBombTarget ? CONFIG.COLORS.bombGlow : CONFIG.COLORS.tubeStroke;
		ctx.lineWidth = isBombTarget ? 2 : 1.5;
		this._tubeShape(x, drawY, w, h, radius);
		ctx.stroke();
		ctx.restore();

		// Стеклянный блик (изогнутая блестящая полоска)
		ctx.save();
		ctx.beginPath();
		this._tubeShape(x, drawY, w, h, radius);
		ctx.clip();

		ctx.globalAlpha = 0.09;
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.moveTo(x + 3, drawY + 6);
		ctx.quadraticCurveTo(x + 2, drawY + h * 0.5, x + 5, drawY + h - 20);
		ctx.lineTo(x + 7, drawY + h - 20);
		ctx.quadraticCurveTo(x + 4, drawY + h * 0.5, x + 5, drawY + 6);
		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.restore();

		// Горлышко с утолщением
		ctx.save();
		ctx.strokeStyle = CONFIG.COLORS.tubeStroke;
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(x - 3, drawY);
		ctx.lineTo(x - 3, drawY + 10);
		ctx.moveTo(x + w + 3, drawY);
		ctx.lineTo(x + w + 3, drawY + 10);
		ctx.stroke();

		// Верхние «ободки» горлышка
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x - 4, drawY);
		ctx.lineTo(x + w + 4, drawY);
		ctx.stroke();
		ctx.restore();

		// Заморозка — ледяная корка поверх пробирки
		if (tubeIndex >= 0 && Game.isFrozen(tubeIndex))
		{
			ctx.save();
			ctx.beginPath();
			this._tubeShape(x, drawY, w, h, radius);
			ctx.clip();

			// Голубоватый оверлей
			ctx.fillStyle = 'rgba(140, 220, 255, 0.15)';
			ctx.fill();

			// Кристаллики инея
			var iceCount = 8;
			for (var ic = 0; ic < iceCount; ic++)
			{
				var icX = x + 3 + (w - 6) * (ic / iceCount) + Math.sin(t * 0.001 + ic * 2) * 2;
				var icY = drawY + 15 + (h - 30) * ((ic * 0.618) % 1) + Math.cos(t * 0.0012 + ic) * 2;
				var icR = 2 + Math.sin(t * 0.002 + ic * 1.5) * 1;
				var icAlpha = 0.3 + 0.2 * Math.sin(t * 0.003 + ic);

				ctx.fillStyle = 'rgba(200, 240, 255, ' + icAlpha + ')';
				ctx.beginPath();
				// Снежинка — 6 лучей
				for (var ray = 0; ray < 6; ray++)
				{
					var angle = ray * Math.PI / 3;
					ctx.moveTo(icX, icY);
					ctx.lineTo(icX + Math.cos(angle) * icR, icY + Math.sin(angle) * icR);
				}
				ctx.lineWidth = 0.8;
				ctx.strokeStyle = 'rgba(200, 240, 255, ' + icAlpha + ')';
				ctx.stroke();
			}

			// Ледяная обводка
			ctx.restore();
			ctx.save();
			ctx.strokeStyle = 'rgba(140, 220, 255, 0.5)';
			ctx.lineWidth = 2;
			ctx.shadowColor = 'rgba(140, 220, 255, 0.6)';
			ctx.shadowBlur = 10;
			this._tubeShape(x, drawY, w, h, radius);
			ctx.stroke();
			ctx.restore();
		}

		// Магнит-режим — пурпурное свечение на всех пробирках
		if (tubeIndex >= 0 && Game.magnetMode && tube.length > 0)
		{
			var magPulse = 0.5 + 0.5 * Math.sin(t * 0.005);
			ctx.save();
			ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
			ctx.shadowBlur = 12 + 6 * magPulse;
			ctx.strokeStyle = 'rgba(168, 85, 247, ' + (0.3 + 0.2 * magPulse) + ')';
			ctx.lineWidth = 2;
			this._tubeShape(x, drawY, w, h, radius);
			ctx.stroke();
			ctx.restore();
		}
	},

	_tubeShape: function (x, y, w, h, r)
	{
		var ctx = this.ctx;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + h - r);
		ctx.arcTo(x, y + h, x + r, y + h, r);
		ctx.arcTo(x + w, y + h, x + w, y + h - r, r);
		ctx.lineTo(x + w, y);
	},

	// === Пузырьки ===

	_drawBubbles: function (time)
	{
		var ctx = this.ctx;

		for (var i = this._bubbles.length - 1; i >= 0; i--)
		{
			var b = this._bubbles[i];
			b.y -= b.speed;
			b.x += Math.sin(time * 0.004 + b.wobble) * 0.4;
			b.life -= 0.006;

			if (b.y <= b.targetY || b.life <= 0)
			{
				this._bubbles.splice(i, 1);
				continue;
			}

			var alpha = b.life * 0.5;
			ctx.save();
			ctx.globalAlpha = alpha;

			// Кольцо пузырька
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
			ctx.lineWidth = 0.6;
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
			ctx.stroke();

			// Блик (полумесяц)
			ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
			ctx.beginPath();
			ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
			ctx.fill();

			// Второй блик
			if (b.r > 1.5)
			{
				ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
				ctx.beginPath();
				ctx.arc(b.x + b.r * 0.2, b.y + b.r * 0.3, b.r * 0.15, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.restore();
		}
	},

	// === Утилиты цвета ===

	_darkenColor: function (hex, factor)
	{
		if (!hex || hex.length < 7) return hex;
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		r = Math.round(r * factor);
		g = Math.round(g * factor);
		b = Math.round(b * factor);
		return '#' + (r < 16 ? '0' : '') + r.toString(16) + (g < 16 ? '0' : '') + g.toString(16) + (b < 16 ? '0' : '') + b.toString(16);
	},

	_lightenColor: function (hex, factor)
	{
		if (!hex || hex.length < 7) return hex;
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		r = Math.min(255, Math.round(r + (255 - r) * factor));
		g = Math.min(255, Math.round(g + (255 - g) * factor));
		b = Math.min(255, Math.round(b + (255 - b) * factor));
		return '#' + (r < 16 ? '0' : '') + r.toString(16) + (g < 16 ? '0' : '') + g.toString(16) + (b < 16 ? '0' : '') + b.toString(16);
	},

	_hexToRgba: function (hex, a)
	{
		var r = parseInt(hex.slice(1, 3), 16);
		var g = parseInt(hex.slice(3, 5), 16);
		var b = parseInt(hex.slice(5, 7), 16);
		return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	},

	hitTest: function (cx, cy)
	{
		var hitPadding = 8;
		for (var i = 0; i < this.tubePositions.length; i++)
		{
			var pos = this.tubePositions[i];
			var oY = this._selectionOffsets[i] || 0;
			if (cx >= pos.x - hitPadding &&
				cx <= pos.x + this.tubeW + hitPadding &&
				cy >= pos.y + oY - hitPadding &&
				cy <= pos.y + oY + this.tubeH + hitPadding)
				return i;
		}
		return -1;
	},

	clientToCanvas: function (clientX, clientY)
	{
		var rect = this.canvas.getBoundingClientRect();
		return {
			x: (clientX - rect.left) * (this.canvas.width / this.dpr / rect.width),
			y: (clientY - rect.top) * (this.canvas.height / this.dpr / rect.height),
		};
	},

	// ============================================================
	// АНИМАЦИЯ ПЕРЕЛИВАНИЯ
	// ============================================================

	animatePour: function (fromIdx, toIdx, count, onComplete)
	{
		var self = this;
		var duration = 800;
		var startTime = null;

		var fromPos = this.tubePositions[fromIdx];
		var toPos = this.tubePositions[toIdx];
		if (!fromPos || !toPos) { if (onComplete) onComplete(); return; }

		var toTube = Game.tubes[toIdx];
		var fromTube = Game.tubes[fromIdx];
		var colorIdx = toTube[toTube.length - 1];
		var colors = Progress.getLiquidColors();
		var color = colors[colorIdx] || '#888';
		var colorDark = this._darkenColor(color, 0.65);
		var colorLight = this._lightenColor(color, 0.35);

		var segH = (this.tubeH - 16) / CONFIG.TUBE_CAPACITY;
		var baseCount = toTube.length - count;
		var w = this.tubeW;

		var fromCX = fromPos.x + w / 2;
		var toCX = toPos.x + w / 2;
		var pourDir = toCX > fromCX ? 1 : -1;

		var particles = [];
		var splashes = [];
		var foam = [];

		function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
		function easeOutBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
		function easeOutElastic(t) { if (t === 0 || t === 1) return t; return Math.pow(2, -10*t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1; }

		function frame(ts)
		{
			if (!startTime) startTime = ts;
			var elapsed = ts - startTime;
			var progress = Math.min(elapsed / duration, 1);
			self.clear();
			var ctx = self.ctx;

			// === Фазы ===
			// 0 → 0.10: наклон
			// 0.10 → 0.80: поток
			// 0.80 → 1.00: возврат с отскоком
			var tiltT = Math.min(progress / 0.10, 1);
			var streamT = Math.max(0, Math.min((progress - 0.07) / 0.73, 1));
			var returnT = Math.max(0, (progress - 0.80) / 0.20);

			var maxTilt = pourDir * 0.52;
			var tiltAngle;
			if (progress < 0.80)
				tiltAngle = easeInOut(tiltT) * maxTilt;
			else
				tiltAngle = (1 - easeOutBack(returnT)) * maxTilt;

			// Плавный подъём источника при наклоне
			var srcLift = easeInOut(tiltT) * 8 * (progress < 0.80 ? 1 : (1 - returnT));

			// === Рисуем пробирки ===
			for (var i = 0; i < Game.tubes.length; i++)
			{
				var pos = self.tubePositions[i];
				if (!pos) continue;

				if (i === fromIdx)
				{
					var srcR = [];
					var drain = easeInOut(streamT) * count;
					var drained = Math.floor(drain);
					var srcDrainFrac = drain - drained;

					for (var fi = 0; fi < fromTube.length; fi++) srcR.push(fromTube[fi]);
					for (var ri = 0; ri < count - drained; ri++) srcR.push(colorIdx);

					ctx.save();
					var pvX = pos.x + w / 2;
					var pvY = pos.y + self.tubeH * 0.22;
					ctx.translate(pvX, pvY - srcLift);
					ctx.rotate(tiltAngle);
					ctx.translate(-pvX, -(pvY - srcLift));
					self.drawTube(pos.x, pos.y - srcLift, srcR, -1, false, ts, srcDrainFrac);
					ctx.restore();
				}
				else if (i === toIdx)
				{
					var fillAmt = easeInOut(streamT) * count;
					var filled = Math.floor(fillAmt);
					var fillFrac = fillAmt - filled;

					// Собираем все сегменты включая частично заполненный —
					// всё рисуется единой системой полос, без швов
					var dstSegs = toTube.slice(0, baseCount + filled);
					var dstDrain = 0;

					if (streamT > 0 && filled < count && fillFrac > 0)
					{
						// Добавляем частичный сегмент в массив
						dstSegs.push(colorIdx);
						// drainFrac = сколько «срезать» сверху (1 - fillFrac)
						dstDrain = 1 - fillFrac;
					}

					self.drawTube(pos.x, pos.y, dstSegs, -1, false, ts, dstDrain);

					// Пена на поверхности при заливке
					if (streamT > 0.1 && streamT < 0.95)
					{
						var foamSlotBot = pos.y + self.tubeH - (w / 2) - (baseCount + filled) * segH;
						var foamFY = foamSlotBot - segH * fillFrac;
						for (var fi2 = 0; fi2 < 3; fi2++)
						{
							var foamX = pos.x + 3 + Math.random() * (w - 6);
							var foamY2 = foamFY + (Math.random() - 0.5) * 4;
							foam.push({
								x: foamX, y: foamY2,
								r: 1.5 + Math.random() * 2,
								life: 0.4 + Math.random() * 0.3,
							});
						}
					}
				}
				else
				{
					self.drawTube(pos.x, pos.y, Game.tubes[i], i, false, ts);
				}
			}

			// === Поток воды ===
			if (streamT > 0 && streamT < 1)
			{
				var sA = streamT < 0.06 ? streamT / 0.06 : (streamT > 0.94 ? (1 - streamT) / 0.06 : 1);

				// Точка выхода (с учётом наклона и подъёма)
				var pvX2 = fromPos.x + w / 2;
				var pvY2 = fromPos.y + self.tubeH * 0.22;
				var exitLocalX = pourDir * (w / 2 + 2);
				var exitLocalY = -(pvY2 - fromPos.y) - srcLift + 2;
				var cosA = Math.cos(tiltAngle);
				var sinA = Math.sin(tiltAngle);
				var exitX = pvX2 + exitLocalX * cosA - exitLocalY * sinA;
				var exitY = (pvY2 - srcLift) + exitLocalX * sinA + exitLocalY * cosA;

				var entryX = toPos.x + w / 2;
				var entryY = toPos.y + 6;

				// Гравитационная парабола: stream «падает» под действием гравитации
				// Высота дуги зависит от расстояния
				var dist = Math.abs(exitX - entryX);
				var arcH = Math.max(25, dist * 0.35);
				var cp1X = exitX + pourDir * dist * 0.2;
				var cp1Y = exitY - arcH;
				var cp2X = entryX - pourDir * dist * 0.1;
				var cp2Y = entryY - arcH * 0.3;

				// Ширина потока: сужается в полёте, расширяется при ударе
				var wTop = 5 + Math.sin(ts * 0.01) * 1;
				var wBot = 7 + Math.sin(ts * 0.008) * 1.5;

				// Рисуем 2D «ленту» вдоль кривой вместо одной линии
				var steps = 24;
				var prevPt = null;
				var ptList = [];

				for (var si = 0; si <= steps; si++)
				{
					var st = si / steps;
					var it = 1 - st;
					// Кубическая Безье
					var px = it*it*it*exitX + 3*it*it*st*cp1X + 3*it*st*st*cp2X + st*st*st*entryX;
					var py = it*it*it*exitY + 3*it*it*st*cp1Y + 3*it*st*st*cp2Y + st*st*st*entryY;
					// Ширина плавно меняется от wTop к wBot
					var sw = wTop + (wBot - wTop) * st;
					// Турбулентность
					var turb = Math.sin(ts * 0.008 + st * 12) * 1.5 * st;
					ptList.push({ x: px + turb, y: py, w: sw });
				}

				// Основной поток (заливка вдоль ленты)
				ctx.save();
				ctx.globalAlpha = sA * 0.88;

				// Левая сторона ленты
				ctx.beginPath();
				ctx.moveTo(ptList[0].x - ptList[0].w / 2, ptList[0].y);
				for (var li = 1; li < ptList.length; li++)
					ctx.lineTo(ptList[li].x - ptList[li].w / 2, ptList[li].y);
				// Правая сторона (обратно)
				for (var ri2 = ptList.length - 1; ri2 >= 0; ri2--)
					ctx.lineTo(ptList[ri2].x + ptList[ri2].w / 2, ptList[ri2].y);
				ctx.closePath();

				// Градиент вдоль потока
				var streamGrad = ctx.createLinearGradient(exitX, exitY, entryX, entryY);
				streamGrad.addColorStop(0, color);
				streamGrad.addColorStop(0.5, self._lightenColor(color, 0.05));
				streamGrad.addColorStop(1, self._darkenColor(color, 0.85));
				ctx.fillStyle = streamGrad;
				ctx.fill();

				// Блик по центру ленты
				ctx.beginPath();
				ctx.moveTo(ptList[0].x - ptList[0].w * 0.15, ptList[0].y);
				for (var bli = 1; bli < ptList.length; bli++)
					ctx.lineTo(ptList[bli].x - ptList[bli].w * 0.1, ptList[bli].y);
				for (var bri = ptList.length - 1; bri >= 0; bri--)
					ctx.lineTo(ptList[bri].x + ptList[bri].w * 0.05, ptList[bri].y);
				ctx.closePath();
				ctx.fillStyle = 'rgba(255,255,255,0.15)';
				ctx.fill();

				ctx.globalAlpha = 1;
				ctx.restore();

				// Мелкие частицы по потоку
				if (Math.random() > 0.4)
				{
					var rT = Math.random();
					var rIdx = Math.floor(rT * (ptList.length - 1));
					var rPt = ptList[rIdx];
					particles.push({
						x: rPt.x + (Math.random() - 0.5) * rPt.w * 1.5,
						y: rPt.y + (Math.random() - 0.5) * 4,
						vx: (Math.random() - 0.5) * 1,
						vy: 0.3 + Math.random() * 2,
						life: 0.5 + Math.random() * 0.4,
						size: 0.8 + Math.random() * 2,
					});
				}

				// Всплеск при входе
				if (Math.random() > 0.45)
				{
					splashes.push({
						x: entryX + (Math.random() - 0.5) * w * 0.7,
						y: entryY + Math.random() * 8,
						vx: (Math.random() - 0.5) * 3,
						vy: -2 - Math.random() * 3.5,
						life: 0.6 + Math.random() * 0.3,
						size: 1 + Math.random() * 2.5,
					});
				}
			}

			// === Частицы ===
			for (var pi = particles.length - 1; pi >= 0; pi--)
			{
				var p = particles[pi];
				p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
				if (p.life <= 0) { particles.splice(pi, 1); continue; }
				ctx.save();
				ctx.fillStyle = self._hexToRgba(color, p.life * 0.4);
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			// === Брызги ===
			for (var si2 = splashes.length - 1; si2 >= 0; si2--)
			{
				var s = splashes[si2];
				s.x += s.vx; s.y += s.vy; s.vy += 0.22; s.vx *= 0.97; s.life -= 0.02;
				if (s.life <= 0) { splashes.splice(si2, 1); continue; }
				ctx.save();
				ctx.globalAlpha = s.life * 0.6;
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
				ctx.fill();
				// Белый блик
				ctx.fillStyle = 'rgba(255,255,255,0.5)';
				ctx.beginPath();
				ctx.arc(s.x - s.size * 0.2, s.y - s.size * 0.2, s.size * 0.2, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			// === Пена ===
			for (var fI = foam.length - 1; fI >= 0; fI--)
			{
				var f = foam[fI];
				f.life -= 0.015;
				if (f.life <= 0) { foam.splice(fI, 1); continue; }
				ctx.save();
				ctx.globalAlpha = f.life * 0.35;
				ctx.fillStyle = 'rgba(255,255,255,0.6)';
				ctx.beginPath();
				ctx.arc(f.x, f.y, f.r * f.life, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			self._drawBubbles(ts);
			self._drawPopups();

			if (progress < 1)
				self._anim = requestAnimationFrame(frame);
			else
			{
				self._anim = null;
				self.drawAll(ts);
				if (onComplete) onComplete();
			}
		}

		this._anim = requestAnimationFrame(frame);
	},

	// ============================================================
	// КОМБО-ПОПАПЫ
	// ============================================================

	showComboPopup: function (tubeIdx, comboLevel)
	{
		var pos = this.tubePositions[tubeIdx];
		if (!pos) return;
		this._popups.push({
			x: pos.x + this.tubeW / 2,
			y: pos.y - 10,
			text: 'x' + comboLevel,
			startTime: performance.now(),
			duration: 900,
		});
	},

	_drawPopups: function ()
	{
		var ctx = this.ctx;
		var now = performance.now();
		var alive = [];

		for (var i = 0; i < this._popups.length; i++)
		{
			var p = this._popups[i];
			var el = now - p.startTime;
			var pr = Math.min(el / p.duration, 1);
			if (pr >= 1) continue;

			var alpha = 1 - pr * pr;
			var oY = -40 * pr;
			var scale = 1 + 0.5 * Math.sin(pr * Math.PI);

			ctx.save();
			ctx.font = 'bold ' + Math.round(18 * scale) + 'px Inter, sans-serif';
			ctx.textAlign = 'center';
			ctx.shadowColor = 'rgba(255, 200, 50, 0.7)';
			ctx.shadowBlur = 12;
			ctx.fillStyle = 'rgba(255, 210, 60, ' + alpha + ')';
			ctx.fillText(p.text, p.x, p.y + oY);
			ctx.restore();

			alive.push(p);
		}
		this._popups = alive;
	},

	// ============================================================
	// ПОДСКАЗКА — анимированный «призрак» перелива
	// ============================================================

	drawHint: function (fromIdx, toIdx)
	{
		var self = this;
		this._hintStart = performance.now();
		if (this._hintAnim) cancelAnimationFrame(this._hintAnim);

		// Предварительные данные для подсказки
		var fromPos = this.tubePositions[fromIdx];
		var toPos = this.tubePositions[toIdx];
		if (!fromPos || !toPos) return;

		var colors = Progress.getLiquidColors();
		var tube = Game.tubes[fromIdx];
		if (!tube || tube.length === 0) return;
		var hintColor = colors[tube[tube.length - 1]] || '#888';

		var hintParticles = [];

		function loop()
		{
			var elapsed = performance.now() - self._hintStart;
			if (elapsed > 3500)
			{
				self._hintAnim = null;
				self.drawAll();
				return;
			}

			self.drawAll();

			var ctx = self.ctx;
			var w = self.tubeW;
			var pulse = 0.5 + 0.5 * Math.sin(elapsed / 250);

			// === Источник: пульсирующий ореол + «подпрыгивание» ===
			var srcBounce = Math.sin(elapsed / 400) * 3;
			var srcAlpha = 0.25 + 0.25 * pulse;

			// Внешний glow на источнике
			ctx.save();
			ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
			ctx.shadowBlur = 16 + 10 * pulse;
			ctx.strokeStyle = 'rgba(34, 197, 94, ' + srcAlpha + ')';
			ctx.lineWidth = 2.5;
			self._tubeShape(fromPos.x, fromPos.y + srcBounce, w, self.tubeH, w / 2);
			ctx.stroke();
			ctx.restore();

			// Второй glow (расширяющееся кольцо)
			var ringPulse = (elapsed % 1500) / 1500;
			var ringAlpha = 0.3 * (1 - ringPulse);
			var ringScale = 1 + ringPulse * 0.3;
			ctx.save();
			ctx.globalAlpha = ringAlpha;
			ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
			ctx.lineWidth = 1.5;
			var rcx = fromPos.x + w / 2;
			var rcy = fromPos.y + self.tubeH / 2;
			ctx.beginPath();
			ctx.ellipse(rcx, rcy, (w / 2 + 6) * ringScale, (self.tubeH / 2 + 6) * ringScale, 0, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();

			// === Приёмник: призрачная заливка + пульс ===
			var dstAlpha = 0.12 + 0.12 * pulse;
			ctx.save();
			ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
			ctx.shadowBlur = 10 + 5 * pulse;
			ctx.strokeStyle = 'rgba(34, 197, 94, ' + (dstAlpha + 0.1) + ')';
			ctx.lineWidth = 2;
			self._tubeShape(toPos.x, toPos.y, w, self.tubeH, w / 2);
			ctx.stroke();
			ctx.restore();

			// Призрачная «предпросмотр» жидкости в приёмнике
			var seg = Game.getTopSegments(fromIdx);
			if (seg.count > 0)
			{
				var segH = (self.tubeH - 16) / CONFIG.TUBE_CAPACITY;
				var toLen = Game.tubes[toIdx].length;
				var freeSpace = CONFIG.TUBE_CAPACITY - toLen;
				var pourCount = Math.min(seg.count, freeSpace);

				ctx.save();
				ctx.beginPath();
				self._tubeShape(toPos.x, toPos.y, w, self.tubeH, w / 2);
				ctx.clip();

				for (var gi = 0; gi < pourCount; gi++)
				{
					var ghostSlot = toLen + gi;
					var ghostBot = toPos.y + self.tubeH - (w / 2) - ghostSlot * segH;
					var ghostTop = ghostBot - segH;

					var ghostAlpha = 0.08 + 0.12 * pulse;
					ctx.fillStyle = self._hexToRgba(hintColor, ghostAlpha);
					ctx.fillRect(toPos.x, ghostTop, w, segH);

					// Волнистая верхняя граница для верхнего призрачного сегмента
					if (gi === pourCount - 1)
					{
						ctx.fillStyle = self._hexToRgba(hintColor, ghostAlpha * 0.7);
						ctx.beginPath();
						for (var gwx = 0; gwx <= w; gwx += 2)
						{
							var gwy = Math.sin(elapsed * 0.003 + gwx * 0.2) * 2;
							if (gwx === 0)
								ctx.moveTo(toPos.x, ghostTop + gwy);
							else
								ctx.lineTo(toPos.x + gwx, ghostTop + gwy);
						}
						ctx.lineTo(toPos.x + w, ghostTop + 4);
						ctx.lineTo(toPos.x, ghostTop + 4);
						ctx.closePath();
						ctx.fill();
					}
				}
				ctx.restore();
			}

			// === Анимированная дуга с частицами ===
			var ax = fromPos.x + w / 2;
			var ay = fromPos.y - 10 + srcBounce;
			var bx = toPos.x + w / 2;
			var by = toPos.y - 10;

			var cpx = (ax + bx) / 2;
			var cpy = Math.min(ay, by) - 30 - 5 * Math.sin(elapsed * 0.002);

			// «Бегущая» точка по кривой
			var runnerT = (elapsed % 1200) / 1200;
			var rI = 1 - runnerT;
			var runX = rI * rI * ax + 2 * rI * runnerT * cpx + runnerT * runnerT * bx;
			var runY = rI * rI * ay + 2 * rI * runnerT * cpy + runnerT * runnerT * by;

			// Пунктирная дуга
			ctx.save();
			ctx.strokeStyle = 'rgba(34, 197, 94, ' + (0.25 + 0.15 * pulse) + ')';
			ctx.lineWidth = 2;
			ctx.setLineDash([8, 5]);
			ctx.lineDashOffset = -elapsed * 0.03;
			ctx.beginPath();
			ctx.moveTo(ax, ay);
			ctx.quadraticCurveTo(cpx, cpy, bx, by);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.restore();

			// Бегущий шарик
			ctx.save();
			ctx.fillStyle = self._hexToRgba(hintColor, 0.6 + 0.3 * pulse);
			ctx.shadowColor = hintColor;
			ctx.shadowBlur = 12;
			ctx.beginPath();
			ctx.arc(runX, runY, 4, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();

			// Частицы от бегущего шарика
			if (Math.random() > 0.5)
			{
				hintParticles.push({
					x: runX, y: runY,
					vx: (Math.random() - 0.5) * 1.5,
					vy: (Math.random() - 0.5) * 1.5,
					life: 0.6,
					size: 1.5 + Math.random() * 1.5,
				});
			}

			// Рисуем частицы
			for (var hpi = hintParticles.length - 1; hpi >= 0; hpi--)
			{
				var hp = hintParticles[hpi];
				hp.x += hp.vx; hp.y += hp.vy; hp.life -= 0.02;
				if (hp.life <= 0) { hintParticles.splice(hpi, 1); continue; }
				ctx.save();
				ctx.fillStyle = self._hexToRgba(hintColor, hp.life * 0.4);
				ctx.beginPath();
				ctx.arc(hp.x, hp.y, hp.size * hp.life, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			// Наконечник стрелки у приёмника
			var angle = Math.atan2(by - cpy, bx - cpx);
			ctx.save();
			ctx.fillStyle = 'rgba(34, 197, 94, ' + (0.4 + 0.3 * pulse) + ')';
			ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
			ctx.shadowBlur = 6;
			ctx.beginPath();
			ctx.moveTo(bx, by);
			ctx.lineTo(bx - 12 * Math.cos(angle - 0.35), by - 12 * Math.sin(angle - 0.35));
			ctx.lineTo(bx - 12 * Math.cos(angle + 0.35), by - 12 * Math.sin(angle + 0.35));
			ctx.closePath();
			ctx.fill();
			ctx.restore();

			self._hintAnim = requestAnimationFrame(loop);
		}

		this._hintAnim = requestAnimationFrame(loop);
	},

	// === Тост достижения ===

	showAchievementToast: function (achievement)
	{
		var name = i18n.t('achieve.' + achievement.id);
		this._popups.push({
			x: this.canvas.width / this.dpr / 2,
			y: 40,
			text: achievement.icon + ' ' + name,
			startTime: performance.now(),
			duration: 2000,
		});
	},

	cancelHint: function ()
	{
		if (this._hintAnim)
		{
			cancelAnimationFrame(this._hintAnim);
			this._hintAnim = null;
		}
	},
};
