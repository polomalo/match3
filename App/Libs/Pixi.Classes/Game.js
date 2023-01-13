//-----------------------------------------------------------------------------
// Filename : Game.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Abstract Pixi game constructor with main functionality
//-----------------------------------------------------------------------------
/**
 en: This class creates Pixi application and canvas element
 ru: Этот класс создаёт приложение Pixi и канвас

 en: Example of usage:
 ru: Пример использования:

	 var App = new Game({

		prepare: function() {

			en://This function will be called before Pixi application and canvas element will be created.
			ru://Эта функция будет вызвана перед тем как приложение Pixi и канвас будут созданы.

		},

		ready: function () {

			en://This function will be called after Pixi application will be created and after all game assets will be loaded.
			ru://Эта функция будет вызвана после того как приложение Pixi и канвас будут созданы и все изображения, текстуры, шрифты и прочее будут загружены.

		}

	});

 @class Game
 @constructor
 @param {Object} properties &nbsp;
 en: Object with a set of methods and properties for the resulting instance of Game class
 ru: Объект с методами и свойствами создаваемого экземпляра Game
 */
const Game = new Class({

	Engine: 'Pixi',

	PixelRatio: window.devicePixelRatio || 1,

	IsTouchDevice: (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)),

	Width: 1920, //Real size of game canvas in pixels (calculated dynamically when window resize)
	Height: 1080, //Real size of game canvas in pixels (calculated dynamically when window resize)

	IsLandscape: true, //Current orientation (calculated from current Width and Height of game)
	IsPortrait: false, //Current orientation (calculated from current Width and Height of game)

	Assets: {},

	Screens: [], //Array of game screen objects

	start() {

		MRAID.log('App start');

		this.resources = {};

		if (this.prepare) this.prepare();

		this.prepareEngine();

		App.Loader = App.loadAssets(null, () => {

			MRAID.track("Assets Loaded");

			App.create();

			App.processAssets();

			setTimeout(() => {

				App.DelayedLoader = App.loadAssets(null, () => {

					Broadcast.call("Delayed Assets Loaded");

					App.processAssets();

				}, {strategy: 'delayed'});

			}, 200);

		}, {strategy: 'preload'});

	},

	prepareEngine() {

		if (this.Engine === 'Pixi') this.preparePixiEngine();

	},

	loadAssets(assets, next, options) {

		MRAID.log('App loadAssets');

		if (!options) options = {};

		const loader = {
			sources: {},
			states: {},
			check: (assets, name) => {

				if (assets && name) {

					loader.states[name] = 'ready';

					this.each(assets, asset => {

						if (!App.Assets[asset.name] || App.Assets[asset.name].state !== 'loaded') loader.states[name] = 'loading';

					});

				}

				let result = true;

				this.each(loader.states, m => {if (m !== 'ready') result = false;});

				if (result) {

					this.each(loader.sources.atlas, asset => {

						if (asset.json && !asset.spritesheet) {

							if (window.PIXI) {

								asset.spritesheet = new PIXI.Spritesheet(asset.data.texture.baseTexture, asset.json);
								asset.spritesheet.parse(() => {});

							}

						}

					});

					loader.loadCompleted = true;

					if (next) {

						next.call(this);

						next = null;

					}

				}

				Broadcast.call('Assets Preload Progress', [loader]);

			}

		};

		this.extractAssetsForLoad(loader, assets, next, options);

		this.loadImages(loader, loader.sources['image']);

		this.loadAtlases(loader, loader.sources['atlas']);

		this.loadBitmapFonts(loader, loader.sources['bitmap-font']);

		this.loadWebFonts(loader, loader.sources['web-font']);

		this.loadSounds(loader, loader.sources['sound']);

		this.loadDOMImages(loader, loader.sources['dom-image']);

		this.loadTexts(loader, loader.sources['text']);

		this.loadVideos(loader, loader.sources['video']);

		this.loadThreeModel([...(loader.sources['three-fbx'] || []), ...(loader.sources['three-glb'] || [])]).then(() => {

			loader.states['three-fbx'] = 'ready';
			loader.states['three-glb'] = 'ready';

			this.loadSources(loader);

		});

		return loader;

	},

	extractAssetsForLoad(loader, assets, next, options) {

		this.each(Settings.Assets, function(asset, name) {

			asset.name = name;

			if (assets && !this.contains(assets, name)) return;

			if (asset.type === "custom") return;

			if (!asset.url && this.contains(['image', 'texture', 'sound', 'font'], asset.type)) return;

			if (asset.type === "sound") {

				if (!asset.loadStrategy) {

					if (Settings["sounds"] === true) asset.loadStrategy = 'preload';
					else if (Settings["sounds"] === false) return;
					else if (Settings["sounds"] === "delayed" || typeof Settings["sounds"] === "undefined") asset.loadStrategy = 'delayed';

				}

			}

			if (!asset.loadStrategy) {

				if (options.strategy !== 'preload') return;

			} else {

				if (options.strategy !== asset.loadStrategy) return;

			}

			if (App.Assets[name] && App.Assets[name].state !== 'prepared') {

				if (App.Assets[name].state === 'loaded') console.warn('Asset already loaded. Check "' + name + '" asset for multiple load.');

				else if (App.Assets[name].state === 'loading') console.warn('Asset already loading. Check "' + name + '" asset for multiple load.');

				else throw new Error('Asset names in all screens must be unique. Check "' + name + '" asset definition in "' + screen.Name + '" screen.');

			} else if (!App.Assets[name]) {

				App.Assets[name] = asset;

				asset.state = 'prepared';

			}

			if (asset.type === 'json') {

				asset.type = 'text';

				asset.parseJson = true;

			}

			//Allow disable assets on removing url
			if (asset.url) {

				if (typeof asset.url === 'function') asset.url = asset.url.call(App);

				if (asset.url.indexOf('http') !== 0 && asset.url.indexOf('data:') !== 0) asset.url = (Settings["assets-path"] || '') + asset.url;

				if (!loader.states[asset.type]) {

					loader.states[asset.type] = 'initialized';

					loader.sources[asset.type] = [];

				}

				loader.sources[asset.type].push(asset);

			}

		});

		if (Settings["video"]) {

			let asset = App.Assets["#start-video"] = {name: "#start-video", type: "video", url: Settings["video"], "loadTillCanPlay": true, "state": "prepared"};

			if (asset.url.indexOf('http') !== 0 && asset.url.indexOf('data:') !== 0) asset.url = (Settings["assets-path"] || '') + asset.url;

			loader.states[asset.type] = 'initialized';

			if (!loader.sources[asset.type]) loader.sources[asset.type] = [];

			loader.sources[asset.type].push(asset);

		}

	},

	loadImages(loader, assets) {

		if (this.Engine === 'Pixi') this.loadPixiImages(loader, assets);

	},

	loadAtlases(loader, assets) {

		if (this.Engine === 'Pixi') this.loadPixiAtlases(loader, assets);

	},

	loadBitmapFonts(loader, assets) {

		if (this.Engine === 'Pixi') this.loadPixiBitmapFonts(loader, assets);

	},

	loadWebFonts(loader, assets) {

		if (assets && assets.length > 0) {

			const _this = this;

			window.WebFontConfig = {
				custom: {
					families: assets.map(function (asset) {
						return asset.name;
					}),
					urls: assets.map(function (asset) {
						return asset.url;
					})
				},
				active: function() {

					_this.each(assets, function(asset) {

						App.Assets[asset.name].state = 'loaded';

					});

					loader.states['web-font'] = 'ready';

					loader.check();

				},
				inactive: function () {

					_this.each(assets, function (asset) {

						App.Assets[asset.name].state = 'loaded';

					});

					loader.states['web-font'] = 'ready';

					loader.check();

				},
				fontactive: function(name) {

					if (!Settings["disable-fonts-dom-preload"]) {

						var el = document.createElement('div');

						el.id = name;

						el.style.fontFamily = name;
						el.style.position = 'fixed';
						el.style.top = 0;
						el.style.visibility = 'hidden';

						el.innerHTML = 'AbCdE 12345';

						document.body.appendChild(el);

					}

				},
				fontinactive: function(familyName, fvd) {

					MRAID.log("failed " + familyName + " " + fvd);

				},
				timeout: 5000
			};

			if (window.WebFont) window.WebFont.load(window.WebFontConfig);

			else {

				(function(d) {
					var wf = d.createElement('script'), s = d.scripts[0];
					wf['crs'.split('').reverse().join('')] = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
					wf.async = true;
					s.parentNode.insertBefore(wf, s);
				})(document);

			}

		} else {

			loader.states['font'] = 'ready';

			loader.check();

		}

	},

	loadSounds(loader, assets) {

		if (assets && assets.length > 0) {

			if (!window.Howler) throw new Error('Howler.js not found.');

			this.each(assets, asset => {

				asset.sound = new Howl({
					src: asset.url,
					html5: MRAID.ios && MRAID.safari,
					xhr: {
						withCredentials: true
					},
					onload: () => {

						asset.state = 'loaded';

						loader.states['sound'] = 'ready';

						this.each(assets, asset => {

							if (!App.Assets[asset.name] || App.Assets[asset.name].state !== 'loaded') loader.states['sound'] = 'loading';

						});

						loader.check();

					}
				});

			});

		} else {

			loader.states['sound'] = 'ready';

			loader.check();

		}

	},

	loadDOMImages(loader, assets) {

		if (assets && assets.length > 0) {

			this.each(assets, function(asset) {

				var img = new Image();
				img.src = asset.url;

				//TODO: Add dom images load event (test if image already loaded in css, load event will not work)
				asset.state = 'loaded';

			});

			//TODO: Wait dom images before load complete callback (test if image already loaded in css, load event will not work)

			loader.states['dom-image'] = 'ready';

			loader.check();

		} else {

			loader.states['dom-image'] = 'ready';

			loader.check();

		}

	},

	loadTexts(loader, assets) {

		if (assets && assets.length > 0) {

			var _this = this;

			this.each(assets, function(asset) {

				if (asset.pako) asset.json = JSON.parse(pako.inflate(asset.pako, { to: 'string' }));

				if (asset.text) {

					App.Assets[asset.name].data = asset.text;
					App.Assets[asset.name].state = 'loaded';

				} else if (asset.json) {

					App.Assets[asset.name].data = asset.json;
					App.Assets[asset.name].state = 'loaded';

				} else {

					var xhr = new XMLHttpRequest();

					var url = asset.url;

					if (Settings["version"]) if (url.indexOf('data:') !== 0) url += "?v=" + Settings["version"];

					xhr.open('GET', url, true);

					xhr.send();

					xhr.onprogress = function(event) {

						asset.progress = event.loaded / event.total;

						Broadcast.call('Assets Preload Progress', [loader]);

					};

					xhr.onload = function () {

						App.Assets[asset.name].data = xhr.responseText;
						App.Assets[asset.name].state = 'loaded';

						if (App.Assets[asset.name].parseJson) {

							App.Assets[asset.name].text = xhr.responseText;

							App.Assets[asset.name].data = JSON.parse(xhr.responseText);

						}

						loader.states['text'] = 'ready';

						_this.each(assets, function (asset) {

							if (!App.Assets[asset.name] || App.Assets[asset.name].state !== 'loaded') loader.states['text'] = 'loading';

						});

						loader.check();

					};

				}

			});

			loader.states['text'] = 'ready';

			this.each(assets, function(asset) {

				if (!App.Assets[asset.name] || App.Assets[asset.name].state !== 'loaded') loader.states['text'] = 'loading';

			});

			loader.check();

		} else {

			loader.states['text'] = 'ready';

			loader.check();

		}

	},

	loadVideos(loader, assets) {

		if (assets && assets.length > 0) {

			this.each(assets, asset => {

				if (asset.pako) asset.url = pako.inflate(asset.pako, {to: 'string'});

				let url = asset.url;

				if (url.indexOf('data:') !== 0) {

					if (Settings["version"]) url += "?v=" + Settings["version"];

				}

				asset.url = url;

				if (asset["jsmpeg"]) {

					MRAID.log('jsmpeg video created', Math.floor(Date.now() / 1000));

					if (asset["jsmpeg-preload"]) {

						clearInterval(asset.LoadedInterval);
						asset.LoadedInterval = setInterval(() => {

							MRAID.log('jsmpeg video loaded check', 'needed: ' + (asset["jsmpeg-preload"] * 100) + '%', 'loaded: ' + Math.round(asset.video.source.loadedSize / asset.video.source.fileSize * 100) + '%', asset.video.source.loadedSize, asset.video.source.fileSize);

							if (asset["jsmpeg-preload"] <= asset.video.source.loadedSize / asset.video.source.fileSize) {

								if (asset.state !== 'loaded') {

									asset.state = 'loaded';

									load_video();

									loader.check(assets, 'video');

									clearInterval(asset.LoadedInterval);

								}

							}

						}, 100);

					}

					asset.video = new JSMpeg.Player(
						url.replace('.mp4', '.ts'),
						{
							loop: false,
							autoplay: false,
							audio: false, //2020.04.07 видео jsmpeg вместе с аудио глючит - быстро проигрывается в хроме и сафари вначале (поэтому грузим аудио отдельно)
							disableGl: !!Settings['force-canvas-renderer'],
							disableWebAssembly: true,
							progressive: !asset["base64"],
							throttled: !!asset["throttled"],
							chunkSize: asset["chunkSize"] || (512 * 1024),
							decodeFirstFrame: true,
							onSourceEstablished: () => {

								MRAID.log('jsmpeg video onSourceEstablished', Math.floor(Date.now() / 1000));

							},
							onSourceCompleted: () => {

								MRAID.log('jsmpeg video onSourceCompleted', Math.floor(Date.now() / 1000));

								asset.video.stop();

								if (asset.state !== 'loaded') {

									asset.state = 'loaded';

									load_video();

									loader.check(assets, 'video');

								}

								setTimeout(() => {

									// TODO: need tests (maybe timestamps.length !== frames count)
									asset.video.duration = asset.video.video.timestamps.length / asset.video.video.frameRate;

								}, 0);

								//2020.04.07 аудио убрали из jsmpeg видео из-за лага ускорения
								/*Broadcast.once('Document Press Down', () => {

									asset.video.audioOut.unlock(() => {

										MRAID.log('JSMpeg video sound unlocked on IOS.');

									});

								}, Date.now() + '');*/

							}
						});

				} else {

					asset.video = document.createElement("video");
					asset.video.setAttribute('muted', 'muted');
					asset.video.setAttribute('playsinline', 'playsinline');
					asset.video.setAttribute('webkit-playsinline', 'webkit-playsinline');
					asset.video.setAttribute('preload', 'auto');

					asset.video.crossOrigin = "anonymous";

					if (asset["loadTillCanPlay"] || asset["loadAsVideoTag"]) {

						asset.video.addEventListener(MRAID.ios ? 'loadedmetadata' : 'canplay', function video_can_play() {

							asset.video.removeEventListener(MRAID.ios ? 'loadedmetadata' : 'canplay', video_can_play);

							if (!asset["loadTillCanPlay"]) {

								asset.state = 'loaded';

								MRAID.log('mark assets video as loaded after loaded metadata (loadAsVideoTag)', asset.name);

								load_video();

								loader.check(assets, 'video');

							}

							MRAID.log('xhr canplay', asset.name);

							//Waiting real video play to avoid ios black screen in the start of video play
							asset.video.addEventListener('timeupdate', function video_time_update() {

								MRAID.log('xhr timeupdate', asset.name, asset.video.currentTime);

								if (asset.video.currentTime > 0.1) {

									asset.video.removeEventListener('timeupdate', video_time_update);

									MRAID.log('xhr timeupdate end', asset.name);

									asset.video.pause();

									asset.video.currentTime = 0;

									if (asset["loadTillCanPlay"]) {

										asset.state = 'loaded';

										MRAID.log('mark assets video as loaded after timeupdate (loadTillCanPlay)', asset.name);

										load_video();

										loader.check(assets, 'video');

									}

								}

							});

							// 2019.07.25 video play() not worked on ios (not sure but this help in mostly situations)
							// 2020.03.28 изменено с целью удаления тормозов на macos,
							// тормоза пропадают если видео остановить и заново запустить,
							// но опять всё это сомнительно и не точно
							// (больше помогло то что ниже - добавление видео в DOM)
							if (asset["forceLoadOnEveryClick"]) {

								document.addEventListener(App.IsTouchDevice ? "touchstart" : "mousedown", function video_first_click() {

									MRAID.log('load video interaction', asset.video.userPlayOccured, asset.video.currentTime);

									if (!asset.video.userPlayOccured) {

										asset.video.muted = true;
										asset.video.play();

										MRAID.log('load video interaction play() to force preload');

									} else {

										document.removeEventListener(App.IsTouchDevice ? "touchstart" : "mousedown", video_first_click);

									}

								});

							}

							asset.video.muted = true;
							asset.video.play();

						});

						//Will load later one by another
						//asset.video.src = asset.url;
						//asset.video.load();

					} else {

						const xhr = asset.xhr = new XMLHttpRequest();

						if (asset.video.canPlayType("video/mp4")) xhr.open('GET', url.replace('.webm', '.mp4'), true);
						else xhr.open('GET', url.replace('.mp4', '.webm'), true);

						xhr.onprogress = function(event) {

							asset.progress = event.loaded / event.total;

							Broadcast.call('Assets Preload Progress', [loader]);

						};

						xhr.onload = function() {

							MRAID.log('xhr onload', asset.name);

							asset.video.addEventListener(MRAID.ios ? 'loadedmetadata' : 'canplay', function video_can_play() {

								asset.video.removeEventListener(MRAID.ios ? 'loadedmetadata' : 'canplay', video_can_play);

								MRAID.log('xhr canplay', asset.name);

								//Waiting real video play to avoid ios black screen in the start of video play
								asset.video.addEventListener('timeupdate', function video_time_update() {

									MRAID.log('xhr timeupdate', asset.name, asset.video.currentTime);

									if (asset.video.currentTime > 0.1) {

										asset.video.removeEventListener('timeupdate', video_time_update);

										MRAID.log('xhr timeupdate end', asset.name);

										asset.video.pause();

										asset.video.currentTime = 0;

										asset.state = 'loaded';

										load_video();

										loader.check(assets, 'video');

									}

								});

								asset.video.muted = true;
								asset.video.play();

							});

							asset.objectUrl = URL.createObjectURL(xhr.response);

							asset.video.src = asset.objectUrl;

							asset.video.load();

						};

						xhr.responseType = "blob";

						//Will load later one by another
						//xhr.send();

					}

					// 2020.03.28 это сделано с целью удаления тормозов на macos похоже что видео должно быть в DOM - иначе не предзагружается
					asset.video.style.width = '100px';
					asset.video.style.height = '100px';
					asset.video.style.zIndex = '100';
					asset.video.style.visibility = 'hidden';
					asset.video.style.pointerEvents = 'none';
					asset.video.style.position = 'absolute';
					asset.video.style.left = '0px';
					asset.video.style.top = '0px';

					document.body.appendChild(asset.video);

				}

			});

			const load_video = () => {

				for (let i=0; assets[i]; i++) {

					let asset = assets[i];

					if (asset.state !== 'loading' && asset.state !== 'loaded') {

						if (asset["jsmpeg"]) {

							if (!asset["jsmpeg-preload"]) {

								asset.state = 'loaded';

								MRAID.log('mark assets video as loaded', asset.name);

								load_video();

								loader.check(assets, 'video');

							}

						} else if (asset["loadTillCanPlay"] === true || asset["loadAsVideoTag"]) {

							asset.video.src = asset.url;
							asset.video.load();

							MRAID.log('set assets video src', asset.name, asset.url);

						} else if (asset["loadTillCanPlay"] === "delayed") {

							asset.video.src = asset.url;
							asset.video.load();

							MRAID.log('set assets video src delayed', asset.name, asset.url);

							setTimeout((asset) => {

								asset.state = 'loaded';

								MRAID.log('mark assets video as loaded', asset.name);

								load_video();

								loader.check(assets, 'video');

							}, 10, asset);

						} else if (asset.xhr) {

							asset.xhr.send();

							MRAID.log('mark assets video as loaded', asset.name);

						}

						break;

					}

				}

			};

			load_video();

		}

		loader.check(assets, 'video');

	},

	loadThreeModel(loader, assets) {

		//Should be redeclared in Game.Three.js

		return Promise.resolve();

	},

	processAssets() {

		if (MRAID.isViewable) {

			this.each(App.Assets, asset => {

				if (asset.processed) return;

				this.processAsset(asset);

			});

		} else {

			MRAID.onViewable(() => {

				App.processAssets();

			}, "App Process Assets");

		}

	},

	processAsset(asset) {

		if (asset.type === 'sound' && Settings["sounds"] !== false) {

			//Если загружен - смотрим свойства - иначе ждём
			if (asset.state === 'loaded') {

				if (asset["playOnEvents"]) {

					_.each(asset["playOnEvents"], (event_name) => {

						Broadcast.on(event_name, () => {

							App.Gameplay.playSound(asset.name);

						}, asset);

					});

					if (_.find(asset["playOnEvents"], event_name => {return _.size(MRAID.TrackedEvents[event_name]) > 0})) {

						App.Gameplay.playSound(asset.name);

					}

				}

				if (asset["stopOnEvents"]) {

					_.each(asset["stopOnEvents"], (event_name) => {

						Broadcast.on(event_name, () => {

							App.Gameplay.stopSound(asset.name);

						}, asset);

					});

				}

				asset.processed = true;

			}

		} else {

			asset.processed = true;

		}

	},

	detachAsset(asset) {

		if (!asset) return;

		if (asset.type === 'sound') {

			if (asset.playOnEvents) {

				_.each(asset.playOnEvents, (event_name) => {

					Broadcast.off(event_name, asset);

				});

			}

			if (asset.stopOnEvents) {

				_.each(asset.stopOnEvents, (event_name) => {

					Broadcast.off(event_name, asset);

				});

			}

			asset.sound.stop();

		}

	},

	loadSources(loader) {

		if (this.Engine === 'Pixi') this.loadPixiSources(loader);

	},

	create() {

		this.time = 0;

		if (this.Engine === 'Pixi') this.createPixi();

		this.each(this.Screens, (screen) => {

			screen.build();

		});

		window.addEventListener('resize', () => {

			MRAID.log('Game.js window resize');

			this.resize();

		});

		Broadcast.on("Mraid Resized", () => {

			MRAID.log('Game.js Mraid Resized');

			this.resize();

		}, this);

		this.resize(true);

		this.ready();

		Broadcast.call('Game Ready Hook');

	},

	injectRenderer() {

		if (this.Engine === 'Pixi') this.injectPixiRenderer();

	},

	startTicker() {

		if (this.Engine === 'Pixi') this.startPixiTicker();

	},

	update() {

		let time = Date.now();

		this.timeOffset = time - (this.time || time);

		this.time = time;

		if (Settings["viewport-size-protection"]) {

			if (!this._viewportSizeProtectionTime || this.time - this._viewportSizeProtectionTime > 1000) {

				this._viewportSizeProtectionTime = this.time;

				let old_size = this._vewport_size;

				let new_size = this._vewport_size = MRAID.getSize();

				if (old_size && new_size && (old_size.width !== new_size.width || old_size.height !== new_size.height)) {

					this.resize(true);

				}

			}

		}

		Broadcast.call("Game Update");

		if (this.Engine === 'Pixi') this.updatePixi();

		if (MRAID.stats) MRAID.stats.update();

	},

	resize(force = false) {

		if (this.Engine === 'Pixi') this.resizePixi(force);

	},

	registerScreen(screen) {

		screen.App = this;

		this.Screens.push(screen);

	},

	each(obj, fn, context) {

		if (!obj) return;

		var i;

		if (Array.isArray(obj)) {

			for (i = 0; i < obj.length; i++) {

				fn.call(context || this, obj[i], i);

			}

		} else {

			for (i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) {

				fn.call(context || this, obj[i], i);

			}

		}

	},

	contains(array, obj) {

		if (!array) return false;

		var i = array.length;

		while (i--) {

			if (array[i] === obj) {

				return true;

			}

		}

		return false;

	},

	/**
	 en: Plays specified sound
	 ru: Воспроизводит указанный звуковой файл

	 this.playSound("sound-name");
	 this.playSound("sound-name", {delay: 100});
	 this.playSound("sound-name", {delay: 100, loop: true, volume: 0.5});

	 @public
	 @method playSound
	 @param name {String}
	 en: Name of the preloaded sound asset
	 ru: Имя загруженного звукового ресурса
	 @param options {Object}
	 en: Options object or volume
	 ru: Объект настроек или volume
	 @param next {Function}
	 en: Callback function in which you will receive Howler instance id
	 ru: Функция обратного вызова в которую передастся id экземпляря Howler
	 */
	_playSound(name, options = {}, next = null) {

		MRAID.log('playSound', name, options);

		let asset = App.Assets[name];

		if (asset && asset.sound) {

			//Домножаем громкость на ту что установлена в параметрах ассета
			if (asset.volume) options.volume = (options.volume || 1) * asset.volume;
			if (asset.loop && !("loop" in options)) options.loop = !!asset.loop;

			this.timeout(() => {

				try {

					const soundInstanceId = asset.sound.play();

					if ("volume" in options) asset.sound.volume(options.volume, soundInstanceId);
					if ("loop" in options) asset.sound.loop(options.loop, soundInstanceId);

					if (next) next.call(this, asset.sound, soundInstanceId);

				} catch (e) {

					if (next) next.call(this);

				}

			}, options.delay || 0);

		}

	},

	_stopSound(name) {

		let asset = App.Assets[name];

		if (asset && asset.sound) asset.sound.stop();

	}


});