(function ()
{
	// === Экраны ===

	function showScreen(id)
	{
		var screens = document.querySelectorAll('.screen');
		for (var i = 0; i < screens.length; i++)
			screens[i].classList.remove('is-active');

		var target = document.getElementById(id);
		if (target)
		{
			target.classList.add('is-active');
			target.classList.add('screen--entering');
			target.addEventListener('animationend', function handler()
			{
				target.classList.remove('screen--entering');
				target.removeEventListener('animationend', handler);
			}, { once: true });
		}
	}

	// Показать оверлей поверх игрового экрана (не скрывает screen-game)
	function showGameOverlay(id)
	{
		var overlay = document.getElementById(id);
		if (!overlay) return;
		overlay.classList.add('is-active');
		overlay.classList.add('screen--entering');
		overlay.addEventListener('animationend', function handler()
		{
			overlay.classList.remove('screen--entering');
			overlay.removeEventListener('animationend', handler);
		}, { once: true });
	}

	function hideGameOverlay(id)
	{
		var overlay = document.getElementById(id);
		if (overlay) overlay.classList.remove('is-active');
	}

	// === UI ===

	function isSpecialMode()
	{
		return Game.isEndlessMode || Game.isDailyMode || Game.isTimedMode;
	}

	function updateUI()
	{
		var levelEl = document.getElementById('level-value');
		var movesEl = document.getElementById('moves-value');
		var undoBadge = document.getElementById('undo-badge');
		var topbarCenter = document.getElementById('topbar-center');
		if (levelEl) levelEl.textContent = Game.level;
		if (movesEl) movesEl.textContent = Game.moveCount;
		if (undoBadge) undoBadge.textContent = Game.undosLeft;

		// Скрываем «Уровень» в спецрежимах
		if (topbarCenter) topbarCenter.style.display = isSpecialMode() ? 'none' : '';

		// Сбрасываем freeze-select визуал
		if (!freezeSelectMode)
		{
			var freezeBtn = document.getElementById('btn-freeze');
			if (freezeBtn) freezeBtn.classList.remove('is-active');
		}
	}

	function updateMenuBadge()
	{
		var levelNum = document.getElementById('menu-level-num');
		var totalStars = document.getElementById('menu-total-stars');
		var coinsEl = document.getElementById('menu-coins');
		var fillEl = document.getElementById('menu-progress-fill');

		var level = Progress.get('level') || 1;
		if (levelNum) levelNum.textContent = level;
		if (totalStars) totalStars.textContent = Progress.getTotalStars();
		if (coinsEl) coinsEl.textContent = Progress.get('coins') || 0;

		// Прогресс-бар: заполнение внутри каждой тройки уровней
		if (fillEl)
		{
			var inGroup = ((level - 1) % 3);
			var pct = ((inGroup + 1) / 3) * 100;
			fillEl.style.width = pct + '%';
		}
	}

	function updateSoundIcons()
	{
		var btns = [document.getElementById('btn-sound'), document.getElementById('btn-sound-menu')];
		var muted = SoundManager.isMuted();

		for (var i = 0; i < btns.length; i++)
		{
			var btn = btns[i];
			if (!btn) continue;

			if (btn.querySelector('svg'))
			{
				// Dock SVG-кнопка
				if (muted)
					btn.classList.add('is-active');
				else
					btn.classList.remove('is-active');
			}
			else
			{
				// Emoji-кнопка
				btn.innerHTML = muted ? '&#128263;' : '&#128266;';
				if (muted)
					btn.classList.add('is-active');
				else
					btn.classList.remove('is-active');
			}
		}
	}

	// === Звёзды ===

	function renderStars(count)
	{
		var container = document.getElementById('complete-stars');
		if (!container) return;
		container.innerHTML = '';

		for (var i = 0; i < 3; i++)
		{
			var star = document.createElement('span');
			star.className = 'stars__item';
			star.textContent = '⭐';
			if (i < count)
				star.classList.add('is-earned');
			container.appendChild(star);
		}
	}

	// === Конфетти ===

	function spawnConfetti()
	{
		var container = document.getElementById('confetti-container');
		if (!container) return;
		container.innerHTML = '';

		var colors = ['#7c5cff', '#ff6b9d', '#00d4aa', '#eab308', '#ef4444', '#3b82f6', '#22c55e', '#ec4899'];

		for (var i = 0; i < 28; i++)
		{
			var piece = document.createElement('div');
			piece.className = 'confetti__piece';

			var size = 5 + Math.random() * 10;
			piece.style.setProperty('--piece-color', colors[Math.floor(Math.random() * colors.length)]);
			piece.style.setProperty('--piece-x', (Math.random() * 100) + '%');
			piece.style.setProperty('--piece-delay', (Math.random() * 0.7) + 's');
			piece.style.setProperty('--piece-duration', (1.8 + Math.random() * 1.5) + 's');
			piece.style.setProperty('--piece-size', size + 'px');
			piece.style.setProperty('--piece-spin', (400 + Math.random() * 700) + 'deg');
			piece.style.setProperty('--piece-radius', Math.random() > 0.5 ? '50%' : '2px');

			piece.addEventListener('animationend', function ()
			{
				if (this.parentNode) this.parentNode.removeChild(this);
			});

			container.appendChild(piece);
		}
	}

	function clearConfetti()
	{
		var container = document.getElementById('confetti-container');
		if (container) container.innerHTML = '';
	}

	// === Попап подтверждения рекламы за награду ===

	function showRewardedConfirm(icon, descKey, onConfirm)
	{
		var overlay = document.getElementById('rv-confirm');
		if (!overlay) { onConfirm(); return; }

		var iconEl = document.getElementById('rv-icon');
		var descEl = document.getElementById('rv-desc');
		if (iconEl) iconEl.textContent = icon;
		if (descEl) descEl.textContent = i18n.t(descKey);

		overlay.style.display = 'flex';

		var btnWatch = document.getElementById('rv-btn-watch');
		var btnCancel = document.getElementById('rv-btn-cancel');

		function close() { overlay.style.display = 'none'; }

		if (btnWatch) btnWatch.onclick = function () { close(); onConfirm(); };
		if (btnCancel) btnCancel.onclick = close;
	}

	// === Тосты ===

	var toastTimers = {};

	function showToast(id, duration)
	{
		var toast = document.getElementById(id);
		if (!toast) return;

		toast.classList.remove('is-hiding');
		toast.classList.add('is-visible');

		if (toastTimers[id]) clearTimeout(toastTimers[id]);

		toastTimers[id] = setTimeout(function ()
		{
			toast.classList.add('is-hiding');
			toast.classList.remove('is-visible');
			toastTimers[id] = null;
		}, duration || 3000);
	}

	function showDailyToast() { showToast('toast-daily', 3000); }

	function showTimedToast() { showToast('toast-timed', 3000); }

	function showAchievementToast(achievement)
	{
		var icon = document.getElementById('toast-achieve-icon');
		var title = document.getElementById('toast-achieve-title');
		var desc = document.getElementById('toast-achieve-desc');
		if (icon) icon.textContent = achievement.icon;
		if (title) title.textContent = i18n.t('achieve.' + achievement.id);
		if (desc) desc.textContent = '+' + achievement.reward + ' 🪙';
		showToast('toast-achievement', 3500);
	}

	// === Магазин ===

	var shopCategory = 'themes';

	function renderShop()
	{
		var grid = document.getElementById('shop-grid');
		var coinsEl = document.getElementById('shop-coins');
		if (!grid) return;

		if (coinsEl) coinsEl.textContent = Progress.get('coins') || 0;

		grid.innerHTML = '';
		var items = CONFIG.SHOP_ITEMS;
		var activeTheme = Progress.getActiveTheme();

		for (var i = 0; i < items.length; i++)
		{
			var item = items[i];
			if (item.cat !== shopCategory) continue;

			var isTheme = item.cat === 'themes';
			var owned = isTheme && Progress.hasPurchased(item.id);
			var selected = isTheme && activeTheme === item.id;

			var div = document.createElement('div');
			div.className = 'shop__item';
			if (owned) div.classList.add('is-owned');
			if (selected) div.classList.add('is-selected');
			div.setAttribute('data-item-id', item.id);

			var name = i18n.lang() === 'ru' ? item.nameRu : item.nameEn;

			div.innerHTML =
				'<span class="shop__item-icon">' + item.icon + '</span>' +
				'<span class="shop__item-name">' + name + '</span>' +
				(owned
					? '<span class="shop__item-status">' + (selected ? i18n.t('shop.selected') : i18n.t('shop.owned')) + '</span>'
					: '<span class="shop__item-price">🪙 ' + item.price + '</span>'
				);

			div.addEventListener('click', (function (itm)
			{
				return function () { onShopItemClick(itm); };
			})(item));

			grid.appendChild(div);
		}
	}

	function onShopItemClick(item)
	{
		var owned = Progress.hasPurchased(item.id);

		if (owned)
		{
			if (item.cat === 'themes')
			{
				Progress.setActiveTheme(item.id);
				renderShop();
			}
			return;
		}

		var coins = Progress.get('coins') || 0;
		if (coins < item.price)
			return;

		Progress.addCoins(-item.price);

		// Бустеры — расходуемые, не запоминаем как купленные
		if (item.id === 'boost_undo3')
			Game.undosLeft += 3;
		else if (item.id === 'boost_hint3')
			Game.hintsLeft += 3;
		else if (item.id === 'boost_bomb2')
			Game.bombsLeft += 2;
		else
		{
			// Темы — перманентные
			Progress.addPurchase(item.id);
			if (item.cat === 'themes')
				Progress.setActiveTheme(item.id);
		}

		renderShop();
		updateMenuBadge();
	}

	function bindShopTabs()
	{
		var tabs = document.querySelectorAll('.shop__tab');
		for (var i = 0; i < tabs.length; i++)
		{
			tabs[i].addEventListener('click', function ()
			{
				for (var j = 0; j < tabs.length; j++)
					tabs[j].classList.remove('is-active');
				this.classList.add('is-active');
				shopCategory = this.getAttribute('data-cat');
				renderShop();
			});
		}
	}

	// === Выбор уровня ===

	function renderLevels()
	{
		var grid = document.getElementById('levels-grid');
		if (!grid) return;

		grid.innerHTML = '';
		var maxLevel = Progress.get('level') || 1;
		var total = Math.max(maxLevel + 5, 20);

		for (var lv = 1; lv <= total; lv++)
		{
			var cell = document.createElement('div');
			cell.className = 'levels__cell';

			var stars = Progress.getStarsForLevel(lv);
			var locked = lv > maxLevel;
			var current = lv === maxLevel;

			if (locked) cell.classList.add('is-locked');
			if (current) cell.classList.add('is-current');

			var starsStr = '';
			for (var s = 0; s < 3; s++)
				starsStr += s < stars ? '⭐' : '☆';

			cell.innerHTML =
				'<span class="levels__cell-num">' + lv + '</span>' +
				'<span class="levels__cell-stars">' + starsStr + '</span>';

			if (!locked)
			{
				cell.addEventListener('click', (function (level)
				{
					return function () { startLevel(level); };
				})(lv));
			}

			grid.appendChild(cell);
		}
	}

	function startLevel(level)
	{
		Progress.load();
		Game.isEndlessMode = false;
		Game.isDailyMode = false;
		Game.isTimedMode = false;
		Game._stopTimer();
		Game._rng = null;
		Game.level = level;
		Game.generateLevel(level);
		Render.init('game-canvas');
		Render.drawAll();
		updateUI();
		updateTimerDisplay(-1);
		showScreen('screen-game');
		YandexSDK.gameplayStart();
	}

	// === Смена языка ===

	function updateLangButton()
	{
		var btn = document.getElementById('btn-lang');
		if (btn) btn.textContent = i18n.lang() === 'ru' ? 'RU' : 'EN';
	}

	function toggleLang()
	{
		var newLang = i18n.lang() === 'ru' ? 'en' : 'ru';
		i18n.setLang(newLang);
		i18n.apply();
		updateLangButton();
		updateMenuBadge();
	}

	// === Достижения ===

	function renderAchievements()
	{
		var grid = document.getElementById('achieve-grid');
		if (!grid) return;
		grid.innerHTML = '';

		var defs = CONFIG.ACHIEVEMENTS;
		for (var i = 0; i < defs.length; i++)
		{
			var a = defs[i];
			var unlocked = Progress.isAchievementUnlocked(a.id);
			var current = Progress.getStat(a.field);
			if (a.field === 'totalStars') current = Progress.getTotalStars();
			if (a.field === 'themesBought') current = (Progress.get('purchased') || []).length;
			var pct = Math.min(100, Math.round((current / a.goal) * 100));

			var div = document.createElement('div');
			div.className = 'achieve__item';
			if (unlocked) div.classList.add('is-unlocked');
			else div.classList.add('is-locked');

			div.innerHTML =
				'<span class="achieve__icon">' + a.icon + '</span>' +
				'<div class="achieve__info">' +
					'<div class="achieve__name">' + i18n.t('achieve.' + a.id) + '</div>' +
					'<div class="achieve__desc">' + i18n.t('achieve.desc.' + a.id) + '</div>' +
					'<div class="achieve__progress"><div class="achieve__progress-fill" style="width:' + pct + '%"></div></div>' +
				'</div>' +
				'<span class="achieve__reward">' + (unlocked ? '✅' : '🪙 ' + a.reward) + '</span>';

			grid.appendChild(div);
		}
	}

	// === Таймер ===

	function updateTimerDisplay(remaining)
	{
		var timerEl = document.getElementById('topbar-timer');
		var valueEl = document.getElementById('timer-value');
		if (!timerEl || !valueEl) return;

		if (!Game.isTimedMode)
		{
			timerEl.style.display = 'none';
			return;
		}

		timerEl.style.display = 'flex';
		valueEl.textContent = remaining;

		if (remaining <= 10)
			timerEl.classList.add('is-critical');
		else
			timerEl.classList.remove('is-critical');
	}

	// === Заморозка: режим выбора ===

	var freezeSelectMode = false;

	// === Canvas ===

	function onCanvasTap(e)
	{
		if (Game.isAnimating || Game.isPaused || Game.isGameOver) return;

		var point;
		if (e.touches)
			point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		else
			point = { x: e.clientX, y: e.clientY };

		var coords = Render.clientToCanvas(point.x, point.y);
		var tubeIdx = Render.hitTest(coords.x, coords.y);
		if (tubeIdx === -1) return;

		Render.cancelHint();

		// Режим заморозки
		if (freezeSelectMode)
		{
			Game.toggleFreeze(tubeIdx);
			freezeSelectMode = false;
			Render.drawAll();
			return;
		}

		var prevSelected = Game.selectedTube;
		var result = Game.selectTube(tubeIdx);

		if (result === 'magnet')
		{
			Render.drawAll();
			updateUI();
			if (Game.checkWin())
				onLevelComplete();
			return;
		}

		if (result === 'pour')
		{
			Game.isAnimating = true;
			var lastMove = Game.moveHistory[Game.moveHistory.length - 1];
			var pourCount = lastMove ? lastMove.count : 1;

			Render.animatePour(prevSelected, tubeIdx, pourCount, function ()
			{
				Game.isAnimating = false;
				updateUI();

				if (Game.comboCount > 1)
					Render.showComboPopup(tubeIdx, Game.comboCount);

				Render.drawAll();

				if (Game.checkWin())
					onLevelComplete();
			});
		}
		else if (result === 'bomb')
		{
			Render.drawAll();
			updateUI();
			if (Game.checkWin())
				onLevelComplete();
		}
		else
		{
			Render.drawAll();
		}

		updateUI();
	}

	// === Победа ===

	function onLevelComplete()
	{
		YandexSDK.gameplayStop();

		var special = isSpecialMode();
		var stars = special ? 0 : Game.getStars();

		if (!special)
			Progress.setStars(Game.level, stars);

		var movesEl = document.getElementById('complete-moves');
		var comboEl = document.getElementById('complete-combo');
		var starsEl = document.getElementById('complete-stars');
		var titleEl = document.querySelector('#screen-level-complete .modal__title');

		if (movesEl) movesEl.textContent = Game.moveCount;
		if (comboEl) comboEl.textContent = Game.comboScore > 0 ? '+' + Game.comboScore : '0';

		// Звёзды — только для обычного режима
		if (starsEl) starsEl.style.display = special ? 'none' : '';
		if (!special) renderStars(stars);

		// Заголовок зависит от режима
		if (titleEl)
		{
			if (Game.isEndlessMode)
				titleEl.textContent = i18n.t('endless.win');
			else if (Game.isDailyMode)
				titleEl.textContent = i18n.t('daily.win');
			else if (Game.isTimedMode)
				titleEl.textContent = i18n.t('timed.win');
			else
				titleEl.textContent = i18n.t('level.complete');
		}

		if (stars === 3)
			Progress.incStat('threeStarWins');

		if (Game.comboCount >= 5)
			Progress.incStat('combo5');

		// Начисляем награды в зависимости от режима
		if (Game.isDailyMode)
		{
			Progress.completeDaily();
			Progress.addCoins(CONFIG.DAILY_BONUS_COINS);
			Progress.incStat('dailyWins');
		}
		else if (Game.isEndlessMode)
		{
			Progress.addCoins(CONFIG.COINS_PER_LEVEL);
			Progress.incStat('levelsWon');
			Progress.updateEndlessHigh(Game.endlessLevel);
		}

		if (Game.isTimedMode)
		{
			var bonus = Game.getTimedBonus();
			if (bonus > 0)
				Progress.addCoins(bonus);
			Progress.incStat('timedWins');
			Game._stopTimer();
		}

		// В спецрежимах скрываем «Следующий уровень», оставляем только «Меню»
		var btnNext = document.getElementById('btn-next-level');
		if (btnNext) btnNext.style.display = special ? 'none' : '';

		spawnConfetti();
		showScreen('screen-level-complete');
	}

	// === Кнопки ===

	function bindButton(id, handler)
	{
		var el = document.getElementById(id);
		if (el) el.addEventListener('click', handler);
	}

	function bindButtons()
	{
		// Меню
		bindButton('btn-play', function ()
		{
			Game.isEndlessMode = false;
			Game.isDailyMode = false;
			startGame();
		});

		bindButton('btn-endless', function ()
		{
			Game.initEndless();
			Render.init('game-canvas');
			Render.drawAll();
			updateUI();
			showScreen('screen-game');
			YandexSDK.gameplayStart();
		});

		bindButton('btn-daily', function ()
		{
			if (Progress.isDailyCompleted())
			{
				showDailyToast();
				return;
			}
			Game.initDaily();
			Render.init('game-canvas');
			Render.drawAll();
			updateUI();
			showScreen('screen-game');
			YandexSDK.gameplayStart();
		});

		// Режим на время
		bindButton('btn-timed', function ()
		{
			Game.initTimed();
			Game.onTimerTick = function (remaining) { updateTimerDisplay(remaining); };
			Game.onTimedExpired = function () { showTimedToast(); };
			Render.init('game-canvas');
			Render.drawAll();
			updateUI();
			updateTimerDisplay(Game.timedSeconds);
			showScreen('screen-game');
			YandexSDK.gameplayStart();
		});

		// Модалки
		bindButton('btn-restart', function () { startGame(); });

		bindButton('btn-menu', function ()
		{
			YandexSDK.gameplayStop();
			updateMenuBadge();
			showScreen('screen-menu');
		});

		bindButton('btn-complete-menu', function ()
		{
			clearConfetti();
			updateMenuBadge();
			showScreen('screen-menu');
		});

		bindButton('btn-next-level', function ()
		{
			clearConfetti();

			if (Game.isDailyMode)
			{
				updateMenuBadge();
				showScreen('screen-menu');
				return;
			}

			function goNextLevel()
			{
				if (Game.isEndlessMode)
					Game.nextEndlessLevel();
				else
					Game.nextLevel();

				Render.calcLayout();
				Render.drawAll();
				updateUI();

				if (Game.isTimedMode)
					updateTimerDisplay(Game.getTimedRemaining());

				showScreen('screen-game');
				YandexSDK.gameplayStart();
			}

			goNextLevel();
		});

		// Пауза
		bindButton('btn-pause', function ()
		{
			if (!Game.isGameOver && !Game.isPaused && !Game.isAnimating)
			{
				Game.pause();
				showGameOverlay('screen-pause');
			}
		});

		bindButton('btn-resume', function ()
		{
			Game.resume();
			hideGameOverlay('screen-pause');
		});

		bindButton('btn-pause-menu', function ()
		{
			Game.isPaused = false;
			hideGameOverlay('screen-pause');
			YandexSDK.gameplayStop();
			updateMenuBadge();
			showScreen('screen-menu');
		});

		bindButton('btn-restart-level', function ()
		{
			Game.isPaused = false;
			Game.restartLevel();
			Render.calcLayout();
			Render.drawAll();
			updateUI();
			hideGameOverlay('screen-pause');
			YandexSDK.gameplayStart();
		});

		// Звук — обе кнопки
		function toggleSound()
		{
			SoundManager.toggleMute();
			updateSoundIcons();
		}

		bindButton('btn-sound', toggleSound);
		bindButton('btn-sound-menu', toggleSound);

		// Undo (dock)
		bindButton('btn-undo', function ()
		{
			if (Game.isAnimating) return;

			if (Game.undosLeft > 0)
			{
				if (Game.undo())
				{
					Render.drawAll();
					updateUI();
				}
			}
			else
			{
				showRewardedConfirm('↩️', 'rv.desc.undo', function ()
				{
					YandexSDK.showRewarded(
						function ()
						{
							Game.undosLeft += CONFIG.FREE_UNDOS;
							if (Game.undo()) { Render.drawAll(); updateUI(); }
						},
						function ()
						{
							Game.undosLeft += CONFIG.FREE_UNDOS;
							updateUI();
						}
					);
				});
			}
		});

		// Подсказка (dock)
		bindButton('btn-hint', function ()
		{
			if (Game.isAnimating) return;

			function useHint()
			{
				var move = Game.findBestMove();
				if (move)
				{
					Game.hintMove = move;
					Game.hintsLeft--;
					Game._usedHintThisLevel = true;
					Render.drawHint(move.from, move.to);
				}
			}

			if (Game.hintsLeft > 0)
				useHint();
			else
			{
				showRewardedConfirm('💡', 'rv.desc.hint', function ()
				{
					YandexSDK.showRewarded(
						function () { Game.hintsLeft++; useHint(); },
						function () { Game.hintsLeft++; useHint(); }
					);
				});
			}
		});

		// Доп. пробирка (dock)
		bindButton('btn-extra-tube', function ()
		{
			if (Game.isAnimating || Game.extraTubeUsed) return;

			showRewardedConfirm('🧪', 'rv.desc.extra-tube', function ()
			{
				YandexSDK.showRewarded(
					function ()
					{
						Game.addExtraTube();
						Render.calcLayout();
						Render.drawAll();
					},
					function ()
					{
						Game.addExtraTube();
						Render.calcLayout();
						Render.drawAll();
					}
				);
			});
		});

		// Бомба (dock)
		bindButton('btn-bomb', function ()
		{
			if (Game.isAnimating) return;

			function activateBomb()
			{
				Game.bombMode = true;
				Game.bombsLeft++;
				Render.drawAll();
			}

			showRewardedConfirm('💣', 'rv.desc.bomb', function ()
			{
				YandexSDK.showRewarded(activateBomb, activateBomb);
			});
		});

		// Магнит (dock)
		bindButton('btn-magnet', function ()
		{
			if (Game.isAnimating) return;

			function activateMagnet()
			{
				Game.magnetMode = true;
				Render.drawAll();
			}

			showRewardedConfirm('🧲', 'rv.desc.magnet', function ()
			{
				YandexSDK.showRewarded(activateMagnet, activateMagnet);
			});
		});

		// Заморозка (dock)
		bindButton('btn-freeze', function ()
		{
			if (Game.isAnimating) return;
			freezeSelectMode = !freezeSelectMode;

			var btn = document.getElementById('btn-freeze');
			if (btn)
			{
				if (freezeSelectMode)
					btn.classList.add('is-active');
				else
					btn.classList.remove('is-active');
			}
		});

		// Достижения
		bindButton('btn-achievements', function ()
		{
			renderAchievements();
			showScreen('screen-achievements');
		});

		bindButton('btn-achieve-close', function ()
		{
			showScreen('screen-menu');
		});

		// Магазин
		bindButton('btn-shop', function ()
		{
			renderShop();
			showScreen('screen-shop');
		});

		bindButton('btn-shop-close', function ()
		{
			updateMenuBadge();
			showScreen('screen-menu');
		});

		bindShopTabs();

		// Как играть
		bindButton('btn-how-to-play', function () { showScreen('screen-how'); });
		bindButton('btn-how-close', function () { showScreen('screen-menu'); });

		// Уровни
		bindButton('btn-levels', function ()
		{
			renderLevels();
			showScreen('screen-levels');
		});

		bindButton('btn-levels-close', function ()
		{
			showScreen('screen-menu');
		});

		// Смена языка
		bindButton('btn-lang', toggleLang);

		// Canvas
		var canvas = document.getElementById('game-canvas');
		if (canvas)
			canvas.addEventListener('pointerdown', onCanvasTap);
	}

	// === Платформенные обработчики ===

	function bindPlatformEvents()
	{
		document.addEventListener('visibilitychange', function ()
		{
			if (document.hidden)
				SoundManager.pauseAll();
			else
				SoundManager.resumeAll();
		});

		document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
		document.addEventListener('selectstart', function (e) { e.preventDefault(); });
		document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

		document.addEventListener('touchmove', function (e)
		{
			if (!e.target.closest('.game__canvas') && !e.target.closest('.modal'))
				e.preventDefault();
		}, { passive: false });

		document.addEventListener('keydown', function (e)
		{
			if (e.key !== 'Escape' && e.key !== 'Control') return;

			var gameScreen = document.getElementById('screen-game');
			var pauseScreen = document.getElementById('screen-pause');

			if (gameScreen && gameScreen.classList.contains('is-active'))
			{
				if (!Game.isGameOver && !Game.isPaused && !Game.isAnimating)
				{
					Game.pause();
					showGameOverlay('screen-pause');
				}
				return;
			}

			if (pauseScreen && pauseScreen.classList.contains('is-active'))
			{
				Game.resume();
				hideGameOverlay('screen-pause');
			}
		});
	}

	// === Жизненный цикл ===

	function startGame()
	{
		Progress.load();
		Game.init();
		Render.init('game-canvas');
		Render.drawAll();
		updateUI();
		updateTimerDisplay(-1);
		showScreen('screen-game');
		YandexSDK.gameplayStart();
	}

	function init()
	{
		Progress.load();

		// Определяем язык по браузеру до рендера UI — избегаем мигания языка
		i18n.detectFromBrowser();

		// Подписка на достижения
		Progress.onAchievementUnlocked = function (achievement)
		{
			showAchievementToast(achievement);
		};

		// SDK уточнит язык асинхронно — обновим UI когда загрузится
		YandexSDK.init(function ()
		{
			i18n.apply();
			updateMenuBadge();
			updateLangButton();
			YandexSDK.notifyReady();
		});

		i18n.apply();
		updateMenuBadge();
		updateSoundIcons();
		updateLangButton();
		bindButtons();
		bindPlatformEvents();

		var preloader = document.getElementById('preloader');
		if (preloader)
		{
			preloader.classList.add('is-hiding');
			preloader.addEventListener('animationend', function ()
			{
				preloader.style.display = 'none';
			}, { once: true });
		}

		showScreen('screen-menu');

		// Проверяем достижения при старте (если уже набраны ранее)
		Progress.checkAllAchievements();
	}

	window.showScreen = showScreen;
	window.startGame = startGame;

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', init);
	else
		init();
})();
