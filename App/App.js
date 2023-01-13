var App = new Game({

	Engine: 'Pixi',

	MaximumPixiCanvasSize: 2048 * 2048,

	MoveWhenInside: true,

	prepare() {

		//Преобразуем ассеты перед их загрузкой (удаляем условные, если условие не сработало, разрешаем зависимые от настроек ассеты и т.д.)
		MRAID.processAssets();

		//Здесь можно написать код, который выполнится перед загрузкой ассетов

		// Линейная интерполяция. Возвращает значение между value1 и value2 в зависимости от amount, которое может быть 0..1
		Math.lerp = function (value1, value2, amount) { return value1 + (value2 - value1) * amount; };
		// Обратная линейная интерполяция - возвращает значение 0..1
		// Удобно использовать в сочетании с линейной, когда нужно менять один параметр в зависимости от другого. Например:
		// let heroSpeed = Math.lerp( 150, 360, Math.unlerp( this.MIN_GAME_SPEED, this.MAX_GAME_SPEED, this.currentGameSpeed ) )
		Math.unlerp = function (value1, value2, amount) { return (amount - value1) / (value2 - value1); };
		// Квадратичная интерполяция. Возвращает значение между "a" и "c" с учётом веса "b", в зависимости от "x" (0..1)
		// Т.е. график функции выглядит, как кривая безье первого порядка, в которой кривизна определяется "b"
		// Удобно использовать для управляемого движения объекта по "параболической" кривой
		Math.qarp = function (a, b, c, x) { return Math.lerp(Math.lerp(a, b, x), Math.lerp(b, c, x), x); };
		Math.clamp = function(x, b, c) { return Math.max(b, Math.min(c, x)); };

		// возвращает угол в радианах в пределах Math.PI * 2,
		// т.е. например, если а = Math.PI * 2 + 0.523599 (360 + 30 град.), то Math.clampAngle(Math.PI * 2 + 0.523599) вернёт 0.52359 (30 град.)
		Math.clampAngle = (a) => {
			a %= Math.PI * 2;
			if (a < 0) a += Math.PI * 2;
			return a;
		};

		_.chunk = function(arr, len) {

		  var chunks = [],
			  i = 0,
			  n = arr.length;

		  while (i < n) {
			chunks.push(arr.slice(i, i += len));
		  }

		  return chunks;
		}

	},

	ready() {

		//2020.03.08 cacheScreenTextures блокирует запуск рекламы в некоторых случаях (проект Mao Mao)
		//if (this.Engine === 'Pixi') this.cacheScreenTextures();

		if (Settings['start-on'] === 'load') {

			App.startGame();

		} else if (Settings['start-on'] === 'ready') {

			MRAID.onReady(function() {

				App.startGame();

			});

		} else if (Settings['start-on'] === 'viewable' || Settings['start-on'] === 'after-video' || typeof Settings["start-on"] === "undefined") {

			MRAID.onViewable(function() {

				App.startGame();

			});

		} else if (Settings['start-on'] === 'interaction') {

			let startButton = document.getElementById('start-button');
			if (startButton){
				setTimeout(() => {
					startButton.hidden = false;
					startButton.onclick =  function (e) {
						e.stopPropagation();
						startButton.hidden = true;
						App.startGame();
					};
				}, 1000);

			}

		}

	},

	startGame() {

		App.injectRenderer();

		MRAID.showApp();

        App.resize();

		Loader.hideLoadProgress();

        if (Settings["video"] && App["Video"]) {

        	App["Video"].show();

		} else {

			if (Settings["cta-only"] === true || Settings["cta-only"] === undefined) App.CallToAction.show();
			else App.Gameplay.show();

			if (Settings["top-banner"] && App["TopBanner"]) App["TopBanner"].show();
			if (Settings["bottom-banner"] && App["BottomBanner"]) App["BottomBanner"].show();

		}

		App.startTicker();

	}

});