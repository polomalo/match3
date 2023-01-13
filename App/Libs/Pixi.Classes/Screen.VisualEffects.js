_.chunk = function(arr, len) {

	let chunks = [],
	i = 0,
	n = arr.length;

	while (i < n) {

		chunks.push(arr.slice(i, i += len));

	}

	return chunks;

};

_.mapKeys = function(object, func) {

	let result = {};

	_.each(object, (value, key) => {

		result[func(value, key)] = value;

	});

	return result;

};

Class.Mixin(Screen, {

	//Изменение volume для звуков и видео
	//Первый параметр имя ассета или объект ассета или массив имён или объектов ассетов
	//Если speed = false то без плавности - моментальное изменение звука в указанное значение
	//Если speed = 1 то 200ms время по умолчанию, если speed 2 то 100ms время изменения и т. д.
	//volume может быть 'default' - это значение из Assets
	volumeTo(medias, volume, speed = 1, delay = 0, options = {}, next) {

		options.media = true;

		return this.tweenOrSet(medias, speed, delay, options, next, asset => {

			if (volume === 'default') volume = asset.volume;

			let media = asset.sound || asset.video;

			media.volume = volume;

		}, (asset, time, ease) => {

			if (volume === 'default') volume = App.Assets[asset.name].volume;

			let media = asset.sound || asset.video;
            media = !media ? asset : media;

			this.stopTween(media._volumeTween);
			media._volumeTween = this.tween({
				to: ['volume', volume, time, 0, ease]
			}, media);

		});

	},

	fadeTo(containers, alpha, speed, delay = 0, options = {}, next) {

		containers = this.getContainers(containers);

		//Предусматриваем сокращённое указание next вместо delay или options параметра если они не нужны
		if (typeof delay === 'function') {

			next = delay;
			delay = 0

		} else if (typeof options === 'function') {

			next = options;
			options = {};

		}

		options.ease = options.ease || "Linear.none";

		if (!speed) {

			_.each(containers, container => {

				if (typeof container === 'string') container = this[container];

				if (delay === 0) {
					container.alpha = 0;
					container.visible = false;
				} else {
					setTimeout(() => {
						container.alpha = 0;
						container.visible = false;
					}, delay);
				}

			});

		} else {

			this.animate(delay, containers, {alpha, duration: 0.2 / speed, ease: options.ease}, next);

		}
	},

	//Короткое трясение
	//Часто используется для начисления очков или для привлечение внимания на изменение какого-либо значения
	pulse(container, scale = 1.3, intensity = 3, speed = 1, delay = 0, next) {

		if (typeof container === 'string') container = this[container];

		let scale_x = 1;
		let scale_y = 1;

		if (typeof container === 'object' && container.scale) {

			scale_x = container.scale.x;
			scale_y = container.scale.y;

		}

		if (typeof container === 'object' && container.params && container.params.scale) {

			let scl = container.params.scale;
			if (!this.isArray(scl)) scl = [scl, scl];

			scale_x = scl[0];
			scale_y = scl[1];

		}

		return this.animate(
			delay,					container, {'scale': [scale_x * (1 + ((scale - 1) / 4)), scale_y * (1 + ((scale - 1) / 4))], duration: 0.1 / speed, ease: "power2.inOut"},
			delay + 0.1 / speed, 	container, {'scale': [scale_x, scale_y], duration: 0.5 / speed, ease: `elastic.out(${1 * scale}, ${1 / intensity})`}
		);

	},

	//Постоянное изменение скейла туда-сюда
	//Используется для кнопок на которые нужно нажать пользователю сейчас, в том числе и для CTA
	pulsation(container, scale = 1.05, speed = 1, delay = 0) {

		if (typeof container === 'string') container = this[container];

		let start_scale_x = 1;
		let start_scale_y = 1;

		if (container.scale) {

			start_scale_x = container.scale.x;
			start_scale_y = container.scale.y;

		}

		let scale_x_to = () => {

			let scale_x = 1;
			if (container.params && 'scale' in container.params) scale_x = container.params.scale[0] === undefined ? container.params.scale : container.params.scale[0];
			else scale_x = start_scale_x;

			return scale_x * scale

		};

		let scale_y_to = () => {

			let scale_y = 1;
			if (container.params && 'scale' in container.params) scale_y = container.params.scale[1] === undefined ? container.params.scale : container.params.scale[1];
			else scale_y = start_scale_y;

			return scale_y * scale

		};

		let scale_x_next = () => {

			let scale_x = 1;
			if (container.params && 'scale' in container.params) scale_x = container.params.scale[0] === undefined ? container.params.scale : container.params.scale[0];
			else scale_x = start_scale_x;

			return scale_x

		};

		let scale_y_next = () => {

			let scale_y = 1;
			if (container.params && 'scale' in container.params) scale_y = container.params.scale[1] === undefined ? container.params.scale : container.params.scale[1];
			else scale_y = start_scale_y;

			return scale_y

		};

		return this.animate(
			0, container, {scale: [scale_x_to, scale_y_to], d: 0.3 / speed, ease: Sine.easeInOut},
			'>', container, {scale: [scale_x_next, scale_y_next], d: 0.3 / speed, ease: Sine.easeInOut},
			{repeat: -1, delay: delay / 1000}
		);

	},

	//Хаотическое смещение положения вокруг одного места
	//Может использоваться для создания помех / неровностей для других анимаций создававя более реалистичные движения или как необычная альтернатива pulsation для кнопок
	chaoticMotion(container, scale = 1, speed = 1) {

		if (!this.isArray(scale)) scale = [scale, scale];

		if (typeof container === 'string') container = this[container];

		let pos_x = 0;
		let pos_y = 0;

		if (typeof container === 'object' && container.position) {

			pos_x = container.position.x;
			pos_y = container.position.y;

		}

		let animate = this.animate(
			0.00, container, {x: () => pos_x + this.random(-10, 10) * scale[0], y: () => pos_y + this.random(-10, 10) * scale[1], d: 0.2 / speed, ease: "sine.inOut"},
			{repeat: -1, repeatRefresh: true}
		);

		return animate;

	},

	//Хаотическое мигание alpha
	chaoticAlphaMotion(container, min_alpha = 0, max_alpha = 1, speed = 1) {

		if (typeof container === 'string') container = this[container];

		return this.animate(
			0, container, {alpha: () => { return this.randomFloat(min_alpha, max_alpha); }, d: 200 / 1000 / speed, ease: Power1.easeInOut},
			{repeat: -1, repeatRefresh: true}
		);

	},

	tweenSine(obj, param, period = 2, magnitude = 50, periodOffset = 0) {
		if (!obj) return;
		if (!(param in obj)) return;

		let i = (periodOffset / period) * 2 * Math.PI;
		let init_val = obj[param];
		let last_val = init_val;

		let animation = this.animate(
			0.00, {p: 0}, {p: 1, d: 1, onUpdate: () => {

					let dt = this.updateTimeOffset / 1000;

					if (dt) {
						i += (dt / period) * 2 * Math.PI;
						i = i % (2 * Math.PI);

						if (obj[param] !== last_val) init_val += obj[param] - last_val;

						obj[param] = init_val + Math.sin(i) * magnitude;
						last_val = obj[param];
					}
				}}
		);

		animation.repeat(-1);

		return animation;
	},

	//Частицы разлетаются в виде фонтана сначала вверх потом под действием гравитации вниз и в стороны
	fountainEmitter(container, particles, options = {}) {

		if (typeof container === 'string') container = this[container];

		if (!this.isArray(particles)) particles = [particles];

		if (options['count'] === undefined) options['count'] = 10;
		if (options['interval'] === undefined) options['interval'] = 100;
		if (options['limit'] === undefined) options['limit'] = false;
		if (options['particleSpeed'] === undefined) options['particleSpeed'] = [[-300, 300], [-500, -500]];
		if (options['particleAcceleration'] === undefined) options['particleAcceleration'] = [0, 500];
		if (options['lifetime'] === undefined) options['lifetime'] = 3500;

		let emitter = this.buildChild(container, {type: 'emitter', count: options.count, interval: options.interval, limit: options.limit, particleSpeed: options.particleSpeed, particleAcceleration: options.particleAcceleration, images: function(emitter) {

			if (typeof particles[0] === 'string') {

				return this.buildChild(emitter, {type: 'sprite', image: this.sample(particles), position: [0, 0], scale: this.randomFloat(0.5, 1.5), blendMode: PIXI.BLEND_MODES.SCREEN});

			} else if (typeof particles[0] === 'object') {

				return this.sample(particles);

			} else if (typeof particles[0] === 'function') {

				return particles[0].call(this, emitter);

			}

		}, particleTween: function() {

			return {
				set: ['alpha', 0],
				to: ['alpha', 1, 100],
				next: ['alpha', 0, 100, options['lifetime']]
			};

		}});

		emitter.emit();

		emitter.skipUpdate = false;

		return emitter;

	},

	//Частицы разлетаются из одной точки в разные стороны в виде сферы и быстро гаснут
	sphereBurstEmitter(container, particles, options = {}) {

		if (typeof container === 'string') container = this[container];

		if (!this.isArray(particles)) particles = [particles];

		if (options['count'] === undefined) options['count'] = 200;
		if (options['interval'] === undefined) options['interval'] = 100;
		if (options['limit'] === undefined) options['limit'] = false;
		if (options['lifetime'] === undefined) options['lifetime'] = 3500;
		if (options['endScale'] === undefined) options['endScale'] = 0;
		if (options['endAlpha'] === undefined) options['endAlpha'] = 0;
		if (options['endPositionOffset'] === undefined) options['endPositionOffset'] = [0, 0];
		if (options['targetDistance'] === undefined) options['targetDistance'] = [300, 300];

		let emitter = this.buildChild(container, {type: 'emitter', count: options.count, limit: options.limit, images: function() {

			if (typeof particles[0] === 'string') {

				return this.buildChild(emitter, {type: 'sprite', image: this.sample(particles), rotation: Math.random() * Math.PI * 2, alpha: 0.8 +  Math.random() * 0.2});

			} else if (typeof particles[0] === 'object') {

				return this.sample(particles);

			} else if (typeof particles[0] === 'function') {

				return particles[0].call(this, emitter);

			}

		}, particleTween: function(sprite) {

			let pos = this.getPointInsideEllipse(options['targetDistance'][0], options['targetDistance'][1]);

			pos[0] += options['endPositionOffset'][0];
			pos[1] += options['endPositionOffset'][1];

			let dist = 5 * Math.sqrt(Math.pow(pos[0], 2) + Math.pow(pos[1], 2));

			let angle = Math.atan2(pos[1], pos[0]);

			let time = _.random(1000, 2000);

			let scale = 0.5 +  Math.random() * 0.5;

			let rotation = Math.random() * Math.PI * 2;

			return {
				set: [
					['scale', 0]
				],
				to: [
					['scale', scale, time*0.2, 0, Back.easeOut.config(1.2)],
					['rotation', sprite.rotation + rotation*0.2, time*0.2],
					['position', pos, time*0.2, 0, Power1.easeIn]
				],
				next: [
					['scale', options['endScale'], time*0.8],
					['rotation', sprite.rotation + rotation*0.8, time*0.8],
					['position', [dist * Math.cos(angle), dist * Math.sin(angle)], time * 0.8, 0, Power1.easeOut],
					['alpha', options['endAlpha'], time*0.1, time*0.7]
				]
			}

		}});

		emitter.emit();

		emitter.skipUpdate = false;

		return emitter;

	},

	//Эффект землетрясения
	earthquake(containers, scale = 1, quake_time = 50, total_time = 1000, delay = 0, next) {

		if (!this.isArray(containers)) containers = [containers];

		const offsets = [-3 * App.PixelRatio, -1.5 * App.PixelRatio, 0, 1.5 * App.PixelRatio, 3 * App.PixelRatio];

		const positions = [];

		this.each(containers, (container) => {
			if (typeof container === 'string') container = this[container];
			positions.push({x: container.position.x, y: container.position.y});
		});

		let count = 0;

		const f = () => {

			const offset_x = _.sample(offsets);
			const offset_y = _.sample(offsets);

			this.each(containers, (container, i) => {

				this.tween(['position', [positions[i].x + offset_x * scale, positions[i].y + offset_y * scale], quake_time, 0, Bounce.easeIn], container, () => {

					if (count * quake_time >= total_time) {

						c();

					} else {

						f();

					}

				});

			});

			count++;

		};

		const c = () => {

			this.each(containers, (container, i) => {

				this.tween(['position', [positions[i].x, positions[i].y], quake_time, 0, Bounce.easeIn], container, () => {

					if (next) {

						next.call(this);
						next = null;

					}

				});

			});

		};

		this.timeout(f, delay || 0);

	},

	//Анимация руки для туториала указывающей что нужно нажать на кнопку
	//Спрайт руки нужно положить так, чтобы 0 0 позиция указывала на кнопку
	tutorialHandButtonPressAnimation(containers, speed = 1, delay = 0) {

		if (typeof containers === 'string') containers = this[containers];

		this.tween({set: ['alpha', 0]}, containers);

		this.timeout(() => {

			this.tween({
				set: [
					['position', [50, 50]],
					['scale', 1],
					['alpha', 0]
				],
				to: [
					['position', [0, 0], 500 / speed, 0, Power2.easeInOut],
					['scale', 0.8, 500 / speed, 0, Power2.easeInOut],
					['alpha', 1, 200 / speed]
				],
				next: [
					['scale', 0.7, 300 / speed, 0, Power2.easeInOut],
					['alpha', 0, 400 / speed, 500 / speed]
				],
				loop: true
			}, containers)

		}, delay);

	},

	//Запускает анимацию или синхронно устанавивает значения для массива спрайтов
	tweenOrSet(containers, speed, delay, options, next, set_fn, tween_fn) {

		//Предусматриваем сокращённое указание next вместо options параметра если options не нужны
		if (typeof options === 'function') {

			next = options;
			options = {};

		}

		//По умолчанию плавный ease
		options.ease = options.ease || Power1.easeInOut;

		return this.syncOrTimeout(delay, () => {

			containers = this.getContainers(containers);

			_.each(containers, container => {

				if (speed === false) {

					set_fn(container);

				} else {

					tween_fn(container, 200 / speed, (typeof options.ease === 'string') ? EaseLookup.find(options.ease) : options.ease);

				}

			});

			if (next) this.timeout(next, 200 / speed);

		});

	},

	//Выполняет функцию через таймаут, а если таймаут 0, то синхронно, без всяких таймаутов
	syncOrTimeout(timeout, fn) {

		if (timeout > 0) return this.timeout(fn, timeout);
		else return fn();

	},

	//Возвращает массив объектов спрайтов раскрывая записи указывающие на спрайты (строковые имена, ссылки на дочерние элементы и т.д.)
	//Пример: ["sprite 1", this["sprite 2"], "sprite 3:children", "sprite 4:chars", "sound asset name:sound", "video asset name:video"]
	//Вернёт: [this["sprite 1"], this["sprite 2"], ...this["sprite 3"].children, ...this["sprite 4"].chars, App.Assets["sound asset name"].sound, App.Assets["video asset name"].video]
	getContainers(containers, options = {}) {

		if (!this.isArray(containers)) containers = [containers];

		let result = [];

		for (let i=0, l=containers.length; i<l; i++) {

			if (typeof containers[i] === 'string') {

				if (containers[i].indexOf(":") !== -1) {

					let split = containers[i].split(':');

					let name = split[0];
					let modifier = split[1];

					if (modifier === 'sound') {

						if (App.Assets[name] && App.Assets[name].sound) result.push(App.Assets[name].sound);
						else console.error(`VisualEffects: sound asset '${name}' not available.`);

					} else if (modifier === 'video') {

						if (App.Assets[name] && App.Assets[name].video) result.push(App.Assets[name].video);
						else console.error(`VisualEffects: video asset '${name}' not available.`);

					} else {

						if (this[name]) {

							if (this[name][modifier]) result = result.concat(this[name][modifier]);
							else console.error(`VisualEffects: modifier '${modifier}' not found in container '${name}'.`);

						} else {

							console.error(`VisualEffects: container '${name}' not found.`);

						}

					}

				} else {

					if (this[containers[i]]) result.push(this[containers[i]]);
					else console.error(`VisualEffects: container '${containers[i]}' not found.`);

				}

			} else {

				result.push(containers[i]);

			}

		}

		if (options.randomize) result = _.shuffle(result);

		return result;

	},

	/*
	*   Этот метод вернёт gsap Timeline экземпляр,
	*   который можно отменить целиком,
	*   поставить каллбэк по завершении
	*   или запустить в обратном направлении
	*
	*	this.animate(
	*		0.00, "sprite name", {positionPortrait: [0, 300], d: 2, needSaveInParams: true}, // needSaveInParams для сохранения позиции при ресайзе(если указано несколько контейнеров например с :children не тестил как это работает, да и эта настпройка не предусмотрела для кучи контейнеров)
	*		0.00, "sprite name", {alpha: 0, scale: 2, position: [100, 200]}, //без duration это будет работать через gsap .set метод
	*		0.00, "sprite name", {alpha: 1, position: [0, 0], duration: 0.2}, //с duration это будет анимироваться 200мс
	*		0.30, "sprite name", {alpha: 1}, //это будет запущено через 300мс с момента вызова метода this.animate
	*		0.00, "sprite name", {alpha: 0, d: 0.2}, //d - это сокращение для duration
	*		0.00, ["sprite name 1", "sprite name 2:children", "text chars sprite:words"], {alpha: 1}, //Спрайты можно указывать массивом, а также ссылаться на их потомков (включая lines, words, chars для TextChars спрайтов)
	*		0.00, "sprite name", {scale: 0, d: 0.2}, //в этом случае scale.x и scale.y установятся в 0
	*		0.00, "sprite name", {scale: [1, 0.5], d: 0.2}, //в этом случае scale.x установится в 1, а scale.y в 0.5
	*		0.00, "sprite name", {scale: {x: 1, y: 0.5}, d: 0.2}, //можно указать и объектом
	*		0.00, "sprite name", {position: ["+=100", "-=100"], scale: "*=0.5", d: 0.2}, //можно использовать '+=', '-=' и '*=' для указания относительных изменений от текущего значения (position: ["*=0.5", "*=0.5"] работать не будет, а просто position: "*=0.5" будет)
	*		0.00, "sprite name", {scale: "default", d: 0.2}, //можно указать значение по умолчанию указанное в sprite.params.scale (то что написано в Containers секции объекта Screen)
	*		0.00, "text sprite", {text: 1000, d: 1}, //так можно анимировать увеличение числа от текущего значения до 1000 в течение одной секунды
	*		0.00, "sprite name", {position: [100, 100], d: 0.2, ease: "power1.inOut"}, //так можно указать ease функцию и любые другие параметры для gsap
	*		0.00, "sprite name:children", {alpha: 0, d: 0.2, stagger: 0.5}, //так можно анимировать последовательно каждый спрайт из списка через 0.5 сек один за другим
	*		0.00, "sprite name", {positionPortrait: [100, 100], positionLandscape: [200, 200], d: 0.2}, //так можно указать разные данные для landscape и portrait ориентации (также можно дописывать iPhone, iPhoneX, iPad для разных пропорций экрана, IOS, Android и другое)
	*		0.00, "sprite name", {position: [100, 100], d: 0.2, onUpdate: () => {...}}, //так можно указать каллбэк на каждый шаг анимации
	*		">", "sprite name", {position: [100, 100], d: 0.2}, //так можно указать что эта анимация должна начаться сразу после предыдущей
	*	  	">1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся через секунду после завершения предыдущей анимации
	*	   	">-1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся за одну секунду до завершения предыдущей анимации
	*	   	"<", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся одновременно с предыдущей анимацией
	*	   	"<1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся через секунду после начала предыдущей анимациии
	*		() => {...} //последним аргументом можно указать функцию-каллбэк, которая будет запущена по завершении всех анимаций
	*	);
	*
	* */
	animate(...args) {

		//Опции таймлайна по умолчанию
		const timelineOptions = {
			delay: 0,
			paused: false,
			defaults: {duration: 0.2, ease: "power1.inOut", overwrite: "auto"},
			onUpdate: () => {},
			onComplete: () => {},
			callbackScope: this,
			autoRemoveChildren: false
		};

		const propsShortening = {
			"t": "type",
			"d": "duration",
			"e": "ease"
		};

		//Свойства-объекты (PIXI.ObservablePoint), которые не смогут просто так анимироваться через gsap
		const observablePointProperties = ["position", "scale", "pivot", "skew"];

		//Свойства-настройки, которые не нужно анимировать
		//Здесь отсутсвуют параметры связанные с callback функциями, так как мы всё время используем timeline и можно назначать каллбэки на сам таймлайн.
		const specialProperties = ["duration", "ease", "delay", "yoyo", "repeat", "stagger", "overwrite", "data", "id", "immediateRender", "inherit", "lazy", "repeatDelay", "repeatRefresh", "reversed", "runBackwards", "startAt", "yoyoEase", "keyframes", "onUpdate", "onRepeat"];

		//Свойства анимирующиеся через методы целевого объекта
		const functionProperties = {
			text: {
				get: (target) => {return target.getText ? target.getText() : target.text},
				set: (target, value) => {target.setText ? target.setText(value) : target.text = value},
				precision: 2
			}
		};

		//Значения по умолчанию для свойств при отсутствии значения в .params и указании анимировать в "default"
		const propsDefaults = {
			"position": [0, 0], //Не указывать тут объекты так как они не будут склонированы
			"scale": [1, 1],
			"pivot": [0, 0],
			"skew": [0, 0],
			"alpha": 1,
			"rotation": 0,
			"angle": 0
		};

		//Если первый параметр не число и не строка (либо строка начинающаяся с буквы = имя спрайта) и количество параметров меньше или равно трём - считаем что использован упрощённый синтаксис для одной простой анимации
		if (args.length <= 3 && typeof args[0] !== "number" && (typeof args[1] !== "string" || /^[a-zA-Z]+$/.test(args[1].charAt(0)))) {

			//Вставим в начало пропущенный параметр времени начала первой анимации
			args.splice(0, 0, 0.00);

		}

		//Если количество параметров не делится на три и последний параметр undefined - удалим его (на случай если на месте callback функции передаётся undefined)
		if (args.length % 3 !== 0 && !args[args.length - 1]) {

			args.length--;

		}

		//Если количество параметров не делится на три и последний параметр функция - считаем эту функцию каллбэком по завершении всех анимаций
		if (args.length % 3 !== 0 && typeof args[args.length - 1] === "function") {

			timelineOptions.onComplete = args[args.length - 1];
			args.length--;

		}

		//Если количество параметров не делится на три и последний параметр объект - считаем этот объект параметрами таймлайна
		if (args.length % 3 !== 0 && typeof args[args.length - 1] === "object") {

			_.extend(timelineOptions, args[args.length - 1]);
			args.length--;

		}

		let timeline = gsap.timeline(timelineOptions);

		//Определяем ускорение анимаций
		let timeScale = timelineOptions.timeScale || 1;

		if (Settings[`tween-factor-${this.Name}`]) timeScale = 1 / Settings[`tween-factor-${this.Name}`];
		else if (Settings[`tween-factor-other`]) timeScale = 1 / Settings[`tween-factor-other`];

		timeline.timeScale(timeScale);

		let animations = _.chunk(args, 3);

		_.each(animations, animation => {

			let timeOffset = animation[0];
			let targets = animation[1];
			let values = animation[2];

			let timeOffsetNumber = parseFloat(timeOffset);

			if (!isNaN(timeOffsetNumber)) timeOffset = timeOffsetNumber;

			values = MRAID.processDynamicProperties(values);

			//Переименовываем сокращения (d в duration, t в type и т.д.)
			values = _.mapKeys(values, (value, key) => propsShortening[key] || key);

			//Получаем ссылки на объекты спрайтов
			targets = this.getContainers(targets, {randomize: !!values.randomize});

			//Если нет duration и не указан type считаем что тип set
			if (!("duration" in values) && !values["type"]) values["type"] = "set";
			if (!("overwrite" in values)) values["overwrite"] = "auto";

			if ("randomize" in values) delete values.randomize;

			let spriteValues = _.omit(values, ["save", "type"]);

			//Анимируем отдельно каждый таргет и каждое свойство если:
			// указано анимировать в значение по умолчанию "default"
			// указано анимировать умножая текущее значение "*=0.5"
			// указано анимировать значение через метод целевого объекта
			//Потому что в этих ситуациях нам нужно взять конретное текущее значение свойства у целевого объекта,
			//а если целевых объектов несколько, то это невозможно - нужно сделать так, чтобы целевой объект был один.
			_.each(_.keys(_.omit(spriteValues, specialProperties)), key => {

				let value = spriteValues[key];

				let isObservablePointProperty = observablePointProperties.includes(key);
				let functionProperty = functionProperties[key];
				let isDefaultValue = value === "default";
				let isMultipliedValue = _.isString(value) && value.indexOf('*=') === 0;
				let multiplier = isMultipliedValue ? parseFloat(value.substr(2)) : 1;

				if (functionProperty || isDefaultValue || isMultipliedValue) {

					_.each(targets, target => {

						if (functionProperty) {

							//Клонируем чтобы каллбэки не попали в другие анимации этого же таймлайна
							values = _.clone(values);

							//Создаём временное свойство целевого объекта
							let temporaryPropertyName = `_animate_value_${key}`;

							//Устанавливаем первоначальное значение во временное свойство целевого объекта
							target[temporaryPropertyName] = Number.parseFloat(functionProperty.get(target)) || 0.00;

							//На каждое обновление этой анимации установим значение анимируемого свойства из временного свойства
							values.onUpdate = () => {console.log(target[temporaryPropertyName]); functionProperty.set(target, target[temporaryPropertyName].toFixed(2));};

							delete spriteValues[key];

							key = temporaryPropertyName;

						} else if (isDefaultValue) {

							value = propsDefaults[key];

							if (target.params && key in target.params) value = target.params[key];

							delete spriteValues[key];

						} else if (isMultipliedValue) {

							if (isObservablePointProperty) value = {x: target[key].x * multiplier, y: target[key].y * multiplier};
							else value = target[key] * multiplier;

							delete spriteValues[key];

						}

						if (isObservablePointProperty) this.animateTimelineObservablePoint(timeline, [target], key, value, timeOffset, values, specialProperties);
						else this.animateTimelineProperties(timeline, [target], _.extend({[`${key}`]: value}, _.pick(values, specialProperties)), timeOffset, values);

					});

				}

			});

			//Если есть position, scale и подобные свойства - нужно изменить targets и анимировать x y
			observablePointProperties.forEach(observablePointProp => {

				//Если есть position, scale и подобные свойства
				if (observablePointProp in spriteValues) {

					this.animateTimelineObservablePoint(timeline, targets, observablePointProp, spriteValues[observablePointProp], timeOffset, values, specialProperties);

					delete spriteValues[observablePointProp];

				}

			});

			//Все свойства могли быть уже обработаны выше если они имеют значение "default" или являются ObservablePoint
			if (_.size(_.omit(spriteValues, specialProperties)) > 0) {

				this.animateTimelineProperties(timeline, targets, spriteValues, timeOffset, values);

			}

		});

		return timeline;

	},

	animateTimelineObservablePoint(timeline, targets, observablePointProp, observablePointValues, timeOffset, options, specialProperties) {

		//Значение должно быть указано как число или массив из двух чисел или объект со свойствами x и y

		//Если число
		if (_.isNumber(observablePointValues)) observablePointValues = {x: observablePointValues, y: observablePointValues};
		//Если массив
		else if (_.isArray(observablePointValues)) observablePointValues = {x: observablePointValues[0], y: observablePointValues[1]};

		_.extend(observablePointValues, _.pick(options, specialProperties));

		//Целевым объектом анимации должен быть объект типа PIXI.ObservablePoint
		let observablePointTargets = _.map(targets, container => container[observablePointProp]);

		this.animateTimelineProperties(timeline, observablePointTargets, observablePointValues, timeOffset, options);

	},

	animateTimelineProperties(timeline, targets, props, timeOffset, options = {}) {

		// console.log('animateTimelineProperties', targets, props, timeOffset, options);

		for (let key in props) if (!props.hasOwnProperty(key)) console.log(`${key} -> ${props['key']}`);

		if (options.type === "set") {

			timeline.set(targets, props, timeOffset);

			//Добавим манипуляции с visible если анимируем alpha
			if ("alpha" in props) {

				if (props.alpha > 0) _.each(targets, target => target.visible = true);
				if (props.alpha === 0) _.each(targets, target => target.visible = false);

			}

		} else {

			timeline.to(targets, props, timeOffset);

			//Добавим манипуляции с visible если анимируем alpha

			//В предыдущей версии при наличии alpha перезаписывалась функция onComplete если она указывалась в отдельной анимации
			//this.animate(
			// 	0, 'logo', { alpha: 1, position: ['+=0', '-=300'], d: 2, onComplete: () => console.log('QWe') <-- не выполнялось },
			//	'>', 'logo', { alpha: 1, position: ['+=0', '+=300'], d: 2 }
			// );
			//Сложилось впечатление что эту функцию никто так и не планировал использовать, а использовали только после всех анимаций
			//я отсоединил alpha и needSaveInParams чтобы они не перезаписывали колбэк(это был костыль как по мне)
			//и сейчас можно писать так
			//this.animate(
			// 	0, 'logo', { needSaveInParams: true, alpha: 1, positionPortrait: [200, 200], d: 2, onComplete: () => console.log('QWe') <-- теперь выполняется },
			//	'>', 'logo', { alpha: 0, position: ['+=0', '+=300'], d: 2, onComplete: () => console.log('QWe') }
			// );



			props.onStart = () => {
				if ("alpha" in props) {
					if (props.alpha > 0) _.each(targets, target => target.visible = true);
				}
			};

			props.onComplete = () => {
				if ("alpha" in props) {
					if (props.alpha === 0) _.each(targets, target => target.visible = false);
				}

				if ("needSaveInParams" in props) {
					const propsNeedUpdates = ["rotation", "position", "scale", "rotationLandscape", "rotationPortrait", "rotationLandscapeIPhoneX", "rotationLandscapeIPad", "rotationPortraitIPhoneX", "rotationPortraitIPad", "positionLandscape", "positionPortrait", "positionLandscapeIPad", "positionLandscapeIPhoneX", "positionPortraitIPad", "positionPortraitIPhoneX", "scaleLandscape", "scalePortrait", "scalePortraitIPhoneX", "scalePortraitIPad", "scaleLandscapeIPhoneX", "scaleLandscapeIPad"];

					if (targets[0] instanceof PIXI.Container) {

						this.applyParams(targets[0].name, _.pick(props, propsNeedUpdates));
						
					}
				}
				if (options.onComplete) {
					options.onComplete();
				}


			};



		}

	},

	stopAnimation(gsapTimeline) {

		if (gsapTimeline) gsapTimeline.kill();

	},

	checkAnimationCondition(options) {

		if (!options || !options.condition) return true;

		let condition = options.condition;

		if (condition.landscape && !App.IsLandscape) return false;
		if (condition.portrait && !App.IsPortrait) return false;

		if (condition.iPhone && MRAID.size.proportionDevice !== 'iPhone') return false;
		if (condition.iPhoneX && MRAID.size.proportionDevice !== 'iPhoneX') return false;
		if (condition.iPad && MRAID.size.proportionDevice !== 'iPad') return false;

		return true;

	}

});
