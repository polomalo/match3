//-----------------------------------------------------------------------------
// Filename : Game.Pixi.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Game.js
//-----------------------------------------------------------------------------
// Pixi based game logic
//-----------------------------------------------------------------------------

Class.Mixin(Game, {

	IsCreateGame: true,
	MaximumPixiCanvasSize: 2048 * 2048,

	MoveWhenInside: false,
	ClearBeforeRender: false,
	Antialias: false,
	RoundPixels: false,

	StageBackgroundColor: 0x000000,

	/*
	//Add this section to game where you want to use 3d
	World: {
		antialias: true,
		alpha: true,
		events: true,
		camera: {
			type: 'PerspectiveCamera',
			params: {fov: 45, near: 10, far: 5000, position: [400, 500, 2000]}
		},
		camera: {
			type: 'OrthographicCamera',
			params: {left: -500, right: 500, top: 500, bottom: -500, near: 0.1, far: 5000, position: [400, 500, 2000]}
		},
		controls: {
			type: 'OrbitControls',
			params: {rotateSpeed: 0.15, enableZoom: false, enableDamping: true, dampingFactor: 0.1, enablePan: false, minOperatingState: 15}
		},
		controls: {
			type: 'TrackballControls',
			params: {rotateSpeed: 5.0, zoomSpeed: 1.2, panSpeed: 0.8, noZoom: false, noPan: false, staticMoving: true, dynamicDampingFactor: 0.3}
		}
	},
	*/

	preparePixiEngine() {

		//Pixi v4 observable point adjust (2018.10.25)
		if (typeof PIXI === 'object' && !PIXI.ObservablePoint.prototype.clone) PIXI.ObservablePoint.prototype.clone = PIXI.Point.prototype.clone;

		PIXI.settings.PRECISION_FRAGMENT = Settings["precision-fragment"] || PIXI.settings.PRECISION_FRAGMENT;

	},

	loadPixiImages(loader, assets) {

		if (assets && assets.length > 0 && typeof PIXI === 'object') {

			if (!loader.pixiLoader) {

				PIXI.gif && PIXI.Loader.registerPlugin(PIXI.gif.AnimatedGIFLoader);

				loader.pixiLoader = new PIXI.Loader();
				
			}

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.Loader();

			this.each(assets, function(asset) {

				let url = asset.url;

				if (Settings["version"]) if (url.indexOf('data:') !== 0) url += "?v=" + Settings["version"];

				loader.pixiLoader.add(asset.name, url, {crossOrigin: "*"});

			});

		} else {

			loader.states['image'] = 'ready';

			loader.check();

		}

	},

	loadPixiAtlases(loader, assets) {

		if (assets && assets.length > 0) {

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.Loader();

			this.each(assets, function(asset) {

				let url = asset.url;

				if (asset.pako) asset.json = JSON.parse(pako.inflate(asset.pako, {to: 'string'}));

				if (asset.json) {

					if (asset.image.indexOf('data:') !== 0) {

						url = url.substr(0, url.lastIndexOf('/')) + '/' + asset.image + (Settings["version"] ? "?v=" + Settings["version"] : '');

					} else {

						url = asset.image;

					}

					loader.pixiLoader.add(asset.name, url, {crossOrigin: "*"})

				} else {

					if (Settings["version"]) if (url.indexOf('data:') !== 0) url += "?v=" + Settings["version"];

					loader.pixiLoader.add(asset.name, url, {crossOrigin: "*"});

				}

			});

		} else {

			loader.states['atlas'] = 'ready';

			loader.check();

		}

	},

	loadPixiBitmapFonts(loader, assets) {

		if (assets && assets.length > 0) {

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.Loader();

			this.each(assets, function(asset) {

				loader.pixiLoader.add(asset.name, asset.url, {crossOrigin: "*"})

			});

		} else {

			loader.states['bitmap-font'] = 'ready';

			loader.check();

		}

	},

	loadPixiSources(loader) {

		if (loader.pixiLoader) {

			loader.pixiLoader.on("progress", function () {

				Broadcast.call('Assets Preload Progress', [loader]);

			});

			loader.pixiLoader.load((pixi_loader, resources) => {

				this.each(resources, (item, index) => {

					App.resources[index] = item;

					if (App.Assets[index]) {

						App.Assets[index].data = item;
						App.Assets[index].state = 'loaded';

					} else {

						App.Assets[index] = {
							data: item,
							state: 'loaded'
						};

					}

				});

				loader.states['image'] = 'ready';
				loader.states['atlas'] = 'ready';
				loader.states['bitmap-font'] = 'ready';

				loader.check();

			});

		}

	},

	createPixi() {

		if (this.IsCreateGame) {

			let options = {
				width: 300,
				height: 300,
				clearBeforeRender: this.ClearBeforeRender,
				antialias: this.Antialias,
				roundPixels: this.RoundPixels,
				transparent: (this.StageBackgroundColor === false),
				backgroundColor: this.StageBackgroundColor,
				forceCanvas: !!Settings["force-canvas-renderer"]
			};

			this.Renderer = PIXI.autoDetectRenderer(options);

			if (this.Renderer.view.parentNode) this.Renderer.view.parentNode.removeChild(this.Renderer.view);

			this.Renderer.plugins.interaction.moveWhenInside = this.MoveWhenInside;

			this.Stage = new PIXI.Container();

			this.Stage.interactive = true;
			this.Stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

			this.createEmptyTexture();

			this.addPixiRendererEvents();

			this.addPixiVisibilityEvents();

			this.initialMute = Settings['sounds-mute'];

		}

	},

	injectPixiRenderer() {

		document.body.appendChild(this.Renderer.view);

	},

	startPixiTicker() {

		PIXI.Ticker.shared.add(this.update, this);

	},

	updatePixi() {

		if (this.Renderer) this.Renderer.render(this.Stage);

	},

	//Draw all textures first time, so all textures will be cached in memory and animation will be more smooth
	cacheScreenTextures() {

		let container = new PIXI.Container();

		this.each(PIXI.utils.TextureCache, (texture, name) => {

			if (!texture._drawed) {

				let sprite = new PIXI.Sprite(texture);

				sprite.alpha = 0.001;

				container.addChild(sprite);

				texture._drawed = true;

			}

		});

		this.each(this.Screens, function(screen) {

			this.each(screen.Assets, function(asset) {

				if (asset.type === 'web-font' && !asset._drawed) {

					let sprite = new PIXI.Text('test 123', {fontFamily: asset.name, fontSize: '50px', fill: 0xff0000});

					sprite.alpha = 0.001;

					container.addChild(sprite);

					asset._drawed = true;

				}

			});

		});

		this.Renderer.render(container);

	},

	resizePixi(force) {

		let width = window.innerWidth,
			height = window.innerHeight,
			left = 0,
			top = 0;

		if (window.MRAID) {

			let size = MRAID.getSize();

			width = size.width;
			height = size.height;
			left = size.left;
			top = size.top;

		}

		this.IsLandscape = width > height;

		this.IsPortrait = !this.IsLandscape;

		this.Width = width * this.PixelRatio;
		this.Height = height * this.PixelRatio;

		if (this.Width * this.Height > this.MaximumPixiCanvasSize) {

			let scale = this.MaximumPixiCanvasSize / (this.Width * this.Height);

			this.Width *= scale;
			this.Height *= scale;

		}

		MRAID.log('resizePixi', this.Width, this.Height);

		Broadcast.call("Game Resize", [force]);

		if (this.Renderer) this.Renderer.resize(this.Width, this.Height);

		if (this.Renderer) {

			this.Renderer.view.style.position = 'fixed';
			this.Renderer.view.style.width = width + 'px';
			this.Renderer.view.style.height = height + 'px';
			this.Renderer.view.style.left = left + 'px';
			this.Renderer.view.style.top = top + 'px';

			//2022.01.21 Если указан фиксированный размер канваса и он больше экрана то скроллирования не будет при fixed позиции
			if (!Settings["publisher-settings"] || !Settings["publisher-settings"]["fixed-size"]) this.Renderer.view.style.position = 'static';

		}

	},

	addPixiRendererEvents() {

		if (App.IsTouchDevice) {

			this.Stage.on("touchstart", function(e) {

				Broadcast.call("Stage Press Down", [App.Stage, e]);

			}, false);

			this.Stage.on("touchend", function(e) {

				Broadcast.call("Stage Press Up", [App.Stage, e]);

			}, false);

			this.Stage.on("touchmove", function(e) {

				Broadcast.call("Stage Press Move", [App.Stage, e]);

			}, false);

		} else {

			this.Stage.on("mousedown", function(e) {

				Broadcast.call("Stage Press Down", [App.Stage, e]);

			}, false);

			this.Stage.on("mouseup", function(e) {

				Broadcast.call("Stage Press Up", [App.Stage, e]);

			}, false);

			this.Stage.on("mousemove", function(e) {

				Broadcast.call("Stage Press Move", [App.Stage, e]);

			}, false);

		}

	},

	addPixiVisibilityEvents() {

		Broadcast.on("MRAID Resumed", () => {

			this.paused = false;
			this.Stage.interactive = true;
			this.Stage.interactiveChildren = true;
			this.Stage.renderable = true;

			this.Screens.forEach((screen) => screen.resume());

			Settings['sounds-mute'] = this.initialMute;

			this.checkPixiSoundsMute();

		}, "add pixi visibility events");

		Broadcast.on("MRAID Paused", () => {

			this.paused = true;
			this.Stage.interactive = false;
			this.Stage.interactiveChildren = false;
			this.Stage.renderable = false;

			this.Screens.forEach((screen) => screen.pause());

			Settings['sounds-mute'] = 'muted';

			this.checkPixiSoundsMute();

		}, "add pixi visibility events");

		Broadcast.on("MRAID Viewable,MRAID Hidden", () => {

			this.checkPixiSoundsMute();

		}, "add pixi visibility events");

		Broadcast.on("Interaction", () => {

			this.checkPixiSoundsMute();

			Broadcast.off("Interaction", "Sounds mute check");

		}, "add pixi visibility events");

		this.checkPixiSoundsMute();

	},

	checkPixiSoundsMute() {

		MRAID.log('checkPixiSoundsMute', Settings["sounds-mute"] || "viewable", MRAID.isViewable, MRAID.firstInteractionOccurred);

		if (window.Howler) {

			if (Settings["sounds-mute"] !== "none" && !MRAID.isViewable) return this.muteSounds();

			if (Settings["sounds-mute"] === "interaction" && !MRAID.firstInteractionOccurred) return this.muteSounds();

			if (Settings["sounds-mute"] === "muted") return this.muteSounds();

			return this.unmuteSounds();

		}

	},

	muteSounds() {

		MRAID.log('muteSounds');

		Howler.mute(true);

		_.each(App.Assets, (asset) => {

			if (asset.type === 'video' && asset.video) asset.video.muted = true;

		});

	},

	unmuteSounds() {

		MRAID.log('unmuteSounds');

		Howler.mute(false);

		_.each(App.Assets, (asset) => {

			if (asset.type === 'video' && asset.video && asset.video.userPlayOccured) asset.video.muted = false;

		});

	},

	createEmptyTexture() {

		let canvas = document.createElement('canvas');

		canvas.width = 1;
		canvas.height = 1;

		this.emptyTexture = PIXI.Texture.from(canvas);

	}

});