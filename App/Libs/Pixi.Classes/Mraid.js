//-----------------------------------------------------------------------------
// Filename : Mraid.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 11.08.16
// Require: 
//-----------------------------------------------------------------------------
// Simple utility for MRAID (Mobile Rich Media Ad Interface Definitions) apps development
//-----------------------------------------------------------------------------
/**
 en: This global object contains ad networks integration logic and other ad specific code
 ru: Этот глобальный объект содержит интеграционный код для разных рекламный сетей а также другой код для рекламных нужд.

 @class MRAID
 */
const MRAID = {

	mobileDevice: (() => {
		let check = false;
		(a => {if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	})(),

	ios: /mac|ipad|iphone|ipod/i.test(navigator.userAgent) && !window.MSStream,

	android: /android/i.test(navigator.userAgent) && !window.MSStream,

	amazon: /(?:; ([^;)]+) Build\/.*)?\bSilk\/([0-9._-]+)\b(.*\bMobile Safari\b)?/.exec(navigator.userAgent),

	safari: /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent),

	chrome: /chrome/i.test(navigator.userAgent),

	firefox: /firefox/i.test(navigator.userAgent),

	//User chosen locale
	locale: null,

	//Original 'Settings' object data (global 'Settings' object will be changed)
	Settings: {},

	//Statistics of tracked events
	TrackedEvents: {},

	//Holded event
	HoldEvents: {
		MixPanel: [],
		Impression: []
	},

	//mraid visibility state
	isViewable: false,

	//Было ли сделано любое первое нажатие (котрое активирует автовоспроизведение видео)
	firstInteractionOccurred: false,

	start() {

		if (Settings["debug"]) this.enableDebug();

		this.setup();

		Broadcast.once('MRAID Viewable', () => {

			MRAID.trackSendHoldActions();

		}, Date.now() + '');

		this.checkReady(() => {

			MRAID.isReady = true;

			Broadcast.call("MRAID Ready");

			if (Settings["disable-viewable-detection"]) {

				//Ничего не делаем - определение viewable должно сработать через MRAID Ready hook в коде релиза

			//2020.03.18 iron-source stateChange и viewableChange не работают в mraid режиме
			} else if (!window.mraid || Settings["publisher"] === "pocket-math") {

				let visibility_change = "visibilitychange";
				let state = "visibilityState";

				if (typeof document.webkitHidden !== "undefined") {

					visibility_change = "webkitvisibilitychange";
					state = "webkitVisibilityState";

				}

				document.addEventListener(visibility_change, () => this.setViewable(document[state] === 'visible'));

				this.setViewable(document[state] === 'visible');

			} else {

				if (mraid.isViewable) {

					mraid.addEventListener("viewableChange", is_viewable => this.setViewable(is_viewable));

					this.setViewable(mraid.isViewable());

				} else {

					mraid.addEventListener("stateChange", state => this.setViewable(state !== "hidden"));

					this.setViewable(mraid.getState() !== "hidden");

				}

			}

		});

		window.addEventListener("error", e => {

			if (!this.TrackedEvents || !this.TrackedEvents["Error"]) MRAID.track("Error", e.message + ' Url: ' + e.url + ' Line: ' + e.line);

			if (Settings["debug-logger"] === 'custom') MRAID.log('<span style="color:red;">' + e.message + '</span>');

		});

		window.addEventListener("message", e => {

			if (e.data) {

				if (e.data["setSettings"]) this.updateSettings(e.data["setSettings"]);
				else if (e.data["setAssets"]) this.updateAssets(e.data["setAssets"]);

			}

		});

		//2020.03.27 это нужно чтобы пометить что разрешено воспроизведение видео со звуком
		document.addEventListener("mousedown", () => {

			MRAID.markInteraction();

		});

		document.addEventListener("touchstart", () => {

			MRAID.markInteraction();

		});

	},

	resume() {

		Broadcast.call("MRAID Resumed");

	},

	pause() {

		Broadcast.call("MRAID Paused");

	},

	setViewable(viewable, from) {

		MRAID.isViewable = viewable;

		if (MRAID.isViewable) {

			Broadcast.call("MRAID Viewable");
			MRAID.log('MRAID Viewable', from || '');

		} else {

			Broadcast.call("MRAID Hidden");
			MRAID.log('MRAID Hidden', from || '');

		}

	},

	setup() {

		if (!Settings["disable-viewport-changes"]) this.setupViewport();

		if (!Settings["disable-charset-changes"]) this.setupCharset();

		if (!Settings["disable-css-changes"]) this.setupCss();

		//Pixi-sound fix (2018.05.24)
		if (!console.assert) console.assert = () => {};

		//This is ios white lines fix
		Broadcast.on("Game Resize", () => {

			document.body.scrollTop = 0;

			setTimeout(() => {

				document.body.scrollTop = 0;

			}, 2000);

		}, 'scroll top');

		//Prevent context menu on long tap (unable to test some behavior on Firefox)
		window.addEventListener('contextmenu', e => {

			e.preventDefault();

		}, false);

		this.size = this.getSize();

		Broadcast.call("Setup Hook");

		if (Settings["disable-size-detection"]) {

			//Ничего не делаем - определение size должно сработать через Setup Hook в коде релиза

		} else {

			window.addEventListener('resize', () => {

				MRAID.log('Mraid.js window resize');

				MRAID.getSize();
				MRAID.repositionCloseButton();

				Broadcast.call("Mraid Resized");

			}, false);

		}

	},

	setupViewport() {

		this.log('Setup viewport...');

		let element = document.querySelector("meta[name=viewport]");

		if (!element) {

			element = document.createElement("meta");

			element.name = "viewport";
			element.content = "width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.content = "width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";

		}

	},

	setupCharset() {

		this.log('Setup charset...');

		let element = document.querySelector("meta[charset]");

		if (!element) {

			element = document.createElement("meta");

			element.setAttribute("charset", "UTF-8");

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.charset = "UTF-8";

		}

	},

	setupCss() {

		this.log('Setup css...');

		let style = document.createElement("style");
		style.appendChild(document.createTextNode(
			"html, body {" +
				"width: 100%;" +
				"height: 100%;" +
				"padding: 0;" +
				"margin: 0;" +
				"overflow: hidden;" +
				"cursor: default;" +
				"font-family: \"Verdana\", \"Droid Sans\";" +
				"-webkit-touch-callout: none;" +
				"-webkit-text-size-adjust: none;" +
				"-webkit-user-select: none;" +
			"}"
		));

		document.head.appendChild(style);

		//2022.01.21 Если указан фиксированный размер канваса и он больше экрана то нужно разрешить скроллирование
		if (Settings["publisher-settings"] && Settings["publisher-settings"]["fixed-size"]) document.body.style.overflow = 'auto';

	},

	checkReady(next) {

		Broadcast.call("Ready Detection Hook", [next]);

		let readyStateCheckInterval = setInterval(() => {

			if (document.readyState === "complete") {

				MRAID.log('document.readyState === "complete"');

				clearInterval(readyStateCheckInterval);

				MRAID._domReady = true;

				MRAID._checkReady(next);

			}

		}, 10);

		if (Settings["disable-ready-detection"]) {

			//Ничего не делаем - определение ready должно сработать через Ready Detection Hook в коде релиза

		} else if (window.mraid) {

			if (mraid.getState() === 'loading') {

				mraid.addEventListener("ready", function mraid_dom_ready() {

					mraid.removeEventListener("ready", mraid_dom_ready);

					MRAID._mraidReady = true;

					//On some SDK it works only after mraid ready
					if (Settings["custom-close-button"] || Settings["interstitial-timeout"]) {

						if (mraid.usecustomclose) mraid.usecustomclose(true);

						if (mraid.useCustomClose) mraid.useCustomClose(true);

						if (mraid.setExpandProperties) mraid.setExpandProperties({"useCustomClose":true});

					}

					MRAID._checkReady(next);

				});

			} else {

				this._mraidReady = true;

				//On some SDK it works only after mraid ready
				if (Settings["custom-close-button"] || Settings["interstitial-timeout"]) {

					if (mraid.usecustomclose) mraid.usecustomclose(true);

					if (mraid.useCustomClose) mraid.useCustomClose(true);

					if (mraid.setExpandProperties) mraid.setExpandProperties({"useCustomClose":true});

				}

				this._checkReady(next);

			}

		} else {

			this._mraidReady = true;

			this._checkReady(next);

		}

	},

	_checkReady(next) {

		if (this._mraidReady && this._domReady) {

			if (next) next.call(MRAID);

		}

	},

	onReady(next) {

		if (MRAID.isReady) {

			next();

		} else {

			Broadcast.once('MRAID Ready', () => {

				next();

			}, this);

		}

	},

	onViewable(next, index) {

		MRAID.log('MRAID.onViewable()', MRAID.isViewable);

		if (MRAID.isViewable) {

			next();

		} else {

			Broadcast.once('MRAID Viewable', () => {

				next();

			}, index || (Date.now() + ''));

		}

	},

	showApp() {

		MRAID.EndCard = (Settings['end-card'] && App.EndCard) ? App.EndCard : App.CallToAction;

		if (Settings["debug"]) this.enableDebug();

		if (!Settings["disable-close-button-creation"]) this.createCloseButton();

		if (window.mraid) {

			mraid.addEventListener("stateChange", state => {

				MRAID.log('mraid stateChange', state);

				Broadcast.call("MRAID State Changed");

			});

		}

		if (Settings["custom-close-button"] && !Settings["interstitial-timeout"]) MRAID.startCloseButtonTimeout();

		if (Settings["interstitial-timeout"] && !Settings['interstitial-timeout-interaction']) MRAID.startInterstitialTimeout();

		if (Settings["redirect-timeout"]) MRAID.startRedirectTimeout();

		Broadcast.on("Video showed", () => {

			setTimeout(() => MRAID.repositionCloseButton(), 100);

		}, this);

		Broadcast.on("Gameplay showed", () => {

			if (Settings["autoplay-timeout"]) MRAID.startAutoplayTimeout();

			if (Settings["idle-timeout"]) MRAID.startIdleTimeout();

			setTimeout(() => MRAID.repositionCloseButton(), 100);

		}, this);

		Broadcast.on("Gameplay cta click", () => {

			MRAID.track("Click Out - In Game");

			MRAID.open();

		}, this);

		Broadcast.on("Banner cta click", () => {

			MRAID.track("Click Out - Banner");

			MRAID.open();

		}, this);

		Broadcast.on("Game Starts", () => {

			if (Settings["gameplay-timeout"]) MRAID.startGameplayTimeout();

			clearTimeout(this.AutoplayTimeout);

		}, this);

		Broadcast.on(MRAID.EndCard.Name + ' Showed', () => {

			MRAID.track("End Screen Showed");

			MRAID.BlockCTA = true;

			clearTimeout(MRAID.BlockCTATimeout);
			MRAID.BlockCTATimeout = setTimeout(() => {

				MRAID.BlockCTA = false;

			}, Settings["end-screen-click-out-block"] || 1000);

			if (MRAID.EndCard && MRAID.EndCard["MainContainer"] && MRAID.EndCard["MainContainer"].els && MRAID.EndCard["MainContainer"].els["retry-button"]) MRAID.EndCard["MainContainer"].els["retry-button"].style.display = MRAID.isRetryAvailable() ? '' : 'none';

			if (MRAID.EndCard && MRAID.EndCard["try again"]) MRAID.EndCard["try again"].visible = this.isRetryAvailable();

			if (window.TJ_API) {

				TJ_API.objectiveComplete();
				TJ_API.gameplayFinished();

				if (TJ_API.directives.showEndCard) {

					//All is ok

				} else {

					MRAID.EndCard.hide();

				}

			}

		}, this);

		Broadcast.on("CallToAction cta click", () => {

			if (MRAID.BlockCTA) return;

			MRAID.track("Click Out - End Screen");

			MRAID.open();

		}, this);

		Broadcast.on("CallToAction cta all click", () => {

			if (Settings["end-screen-click-out"]) {

				if (MRAID.BlockCTA) return;

				MRAID.track("Click Out - End Screen");

				MRAID.open();

			}

		}, this);

		Broadcast.on("CallToAction try again click", () => {

			if (MRAID.BlockCTA) return;

			MRAID.track("Retry");

		}, this);

		Broadcast.on("Document Press Down", () => {

			MRAID.track("Click");

		}, this);

		MRAID.track("Creative Showed");

	},

	close() {

		MRAID.log('MRAID.close() Is mraid: ' + !!window.mraid + ' Web mode: ' + (Settings["web-mode"] || 'redirect'));

		//Если код закрытия определён при создании релиза
		if (MRAID["releaseClose"]) MRAID["releaseClose"]();

		else if (window.mraid || Settings["web-mode"] === 'mraid') mraid.close();

		else if (Settings["web-mode"] === 'alert') alert('Close!');

		else if (Settings["web-mode"] === 'redirect' || typeof Settings["web-mode"] === "undefined") window.close();

	},

	open() {

		if (!Settings["click-out-multiple"] && this.clickoutTime) return;

		if (Settings["click-out-multiple"] && (Date.now() - (this.clickoutTime || 0) < Settings["click-out-multiple"])) return;

		this.clickoutTime = Date.now();

		MRAID.track('Click Out');

		setTimeout(() => {

			MRAID.log('MRAID.open() Is mraid: ' + !!window.mraid + ' Target url: ' + Settings["target-url"]);

			//Если код перехода определён при создании релиза
			if (MRAID["releaseOpen"]) MRAID["releaseOpen"]();

			else if (Settings['dashboard-preview-mode']) alert(`Action was successfully executed.\n${Settings["target-url"] ? `URL opened: ${Settings["target-url"]}` : 'No url specified.'}`);

			else if (window.ExitApi || Settings["web-mode"] === 'google') ExitApi.exit();

			else if (window.FbPlayableAd || Settings["web-mode"] === 'facebook') FbPlayableAd.onCTAClick();

			else if (window.TJ_API) TJ_API.click();

			else if (window.Liftoff) Liftoff.open();

			else if (Settings["publisher"] === "mintegral") window.install && window.install();

			else if (Settings["publisher"] === "crossinstall") window['tnerap'.split('').reverse().join('')]['egasseMtsop'.split('').reverse().join('')]('click_go', '*'); //split-reverse-join used to prevent Facebook Instant Games checking fail

			else if (Settings["publisher"] === "vungle") window['tnerap'.split('').reverse().join('')]['egasseMtsop'.split('').reverse().join('')]('download', '*'); //split-reverse-join used to prevent Facebook Instant Games checking fail

			else if (Settings["publisher"] === "google") window.open(Settings["target-url"]);

			else if (Settings["publisher"] === "google-play-instant" && window.Android && Settings["target-url"]) Android.launchApplication(Settings["target-url"].substring(Settings["target-url"].indexOf("id=")+3, Settings["target-url"].indexOf("&", Settings["target-url"].indexOf("id="))));

			else if (window.mraid || Settings["web-mode"] === 'mraid') {

				if ((Settings["target-url"].indexOf("play.google.com") > -1 || Settings["target-url"].indexOf("apple.com") > -1) && mraid.openStoreUrl) mraid.openStoreUrl(Settings["target-url"]);

				else mraid.open(Settings["target-url"]);

			} else if (Settings["web-mode"] === 'alert') alert('Open: ' + Settings["target-url"]);

			else if (Settings["web-mode"] === 'redirect') window.location.href = Settings["target-url"];

		}, 200);

	},

	getLocale() {

		if (this.locale) return this.locale;

		const urlParams = new URLSearchParams(window.location.search);

		let locale = (urlParams.get('locale') || navigator.userLanguage || navigator.language || navigator.browserLanguage || navigator.systemLanguage || '').replace('-', '_').toLowerCase().substring(0, 2);
		if (window.FBInstant) locale = FBInstant.getLocale().toLowerCase().substring(0, 2);

		return locale;

	},

	setLocale(locale) {

		this.locale = (locale || "").toLowerCase().substring(0, 2);

	},

	log(...params) {

		if (!Settings["debug"]) return;

		if (params.join(' - ') === this.lastLogParams) return;

		if (Settings["debug-logger"] === "custom") this.customLog.apply(this, params);

		if (Settings["debug-logger"] === "native") if (typeof console === 'object') console.log.apply(console, Array.prototype.slice.call(arguments));

		this.lastLogParams = params.join(' - ');

	},

	showCustomLogger() {

		if (this.customLoggerContainer) {

			this.customLoggerContainer.style.display = '';

			return;

		}

		let container = this.customLoggerContainer = document.createElement("div");

		container.style.position = 'fixed';
		container.style.left = '0px';
		container.style.top = '0px';
		container.style.width = '100%';
		container.style.height = '60%';
		container.style.overflow = 'auto';
		container.style.opacity = '0.5';
		container.style.background = '#ffffff';
		container.style.zIndex = '99999';
		container.style.fontSize = '10px';

		document.body.appendChild(container);

	},

	hideCustomLogger() {

		if (this.customLoggerContainer) this.customLoggerContainer.style.display = 'none';

	},

	customLog() {

		if (!this.customLoggerContainer) return;

		let log = document.createElement("div");

		log.style.maxHeight = '250px';

		log.innerHTML = Date.now() + ': ';

		for (let i=0, l=arguments.length; i<l; i++) {

			if (typeof arguments[i] === 'string' || typeof arguments[i] === 'number') log.innerHTML += arguments[i] + ' ';

			else log.innerHTML += JSON.stringify(arguments[i]) + ' ';

		}

		this.customLoggerContainer.appendChild(log);

	},

	enableDebug() {

		if (Settings["debug-logger"] === 'custom') this.showCustomLogger();

		if (!this.stats && window.Stats) this.stats = new Stats();

		if (this.stats) document.body.appendChild(this.stats.dom);

	},

	disableDebug() {

		this.hideCustomLogger();

		if (this.stats) document.body.removeChild(this.stats.dom);

	},

	processSettings(settings, values) {

		//Нельзя здесь брать размер - он зависит от Settings
		//this.getSize();

		if (values) {

			for (let name in values) if (values.hasOwnProperty(name)) {

				if (settings[name]) {

					if (settings[name]["type"]) settings[name]["value"] = values[name];

					else settings[name] = values[name];

				}

			}

		}

		if (settings['start-time']) return;

		settings['start-time'] = Date.now();

		if (settings["assets-path"] && !settings["assets-path"]["value"] && !settings["assets-path"]["default"]) {

			const scripts = document.getElementsByTagName("script");

			for (let s=0; scripts[s]; s++) {

				const src = scripts[s].src;

				if (src.indexOf('Builds/') > -1 && src.indexOf('loader') > -1 && src.indexOf('.js') > -1 && src.indexOf('file://') === -1) {

					settings["assets-path"]["default"] = src.substr(0, src.indexOf('Builds/'));

					break;

				}

			}

		}

		for (let key in settings) if (settings.hasOwnProperty(key)) {

			const data = settings[key];

			this.Settings[key] = data;

			if (data[",type"]) alert("Warning! ',type' key found in Settings file!");

			if (data && data.type) {

				//Применяем ios android модификаторы (для target-url и всех других)
				this.processDynamicProperties(data);

				settings[key] = ("value" in data) ? data["value"] : data["default"];

				if (Settings['dashboard-preview-mode'] && settings[key] === undefined) settings[key] = data["value:ios"] || data["value:android"] || data["default:ios"] || data["default:android"] || '';

				if (settings[key] === undefined) settings[key] = ({"string": "", "number": 0, "boolean": false, "list": []})[data.type];

				if (data.type === 'select' && settings[key] === '#random') settings[key] = data.values[Math.floor(Math.random() * data.values.length)];

				//Нельзя - это зависит от Settings
				//this.processDynamicProperties(settings[key]);

			}

			else settings[key] = data;

		}

		const track_actions = ['track-mixpanel-actions', 'track-libraries'];

		for (let i=0; track_actions[i]; i++) {

			const setting_key = track_actions[i];

			for (let k in Settings[setting_key]) if (Settings[setting_key].hasOwnProperty(k)) {

				const track_data = Settings[setting_key][k];

				if (k.indexOf(':multiple') > -1) Settings[setting_key][k.replace(':multiple', '')] = track_data;

			}

		}

		if (typeof this.Settings["loading-icon-publisher-styles"]["hideInPortfolio"] !== 'boolean') this.Settings["loading-icon-publisher-styles"]["hideInPortfolio"] = true;

		if ((window.location.hostname === 'mraid.io' || window.location.hostname === 'fatenation.info') && this.Settings["loading-icon-publisher-styles"]["hideInPortfolio"]) {
			Settings["loading-icon-publisher-styles"]["display"] = "none";
		}

		if (Settings["assets-path"] && Settings["assets-path"].charAt(Settings["assets-path"].length - 1) !== '/') Settings["assets-path"] += '/';

		if (Settings["locale"] && Settings["locale"] !== "auto") this.setLocale(Settings["locale"]);

		MRAID.processAssets();

		MRAID.processCSS();

		Broadcast.call("MRAID Process Settings Hook");

	},

	// Подставляем ассеты (изображения) в css стили (чтобы все ассеты были в одном месте и проходили одну и туже обработку для замены, base64 и прочего)
	processCSS() {

		for (let setting_name in MRAID.Settings) if (MRAID.Settings.hasOwnProperty(setting_name)) {

			let setting_params = MRAID.Settings[setting_name];
			let setting_value = Settings[setting_name];

			if (setting_params.type === 'css') {

				for (let style_name in setting_value) if (setting_value.hasOwnProperty(style_name)) {

					if (typeof setting_value[style_name] === 'string') {

						for (let asset_name in Settings.Assets) if (Settings.Assets.hasOwnProperty(asset_name)) {

							if (setting_value[style_name].indexOf(`$${asset_name}$`) > -1) {

								let asset = Settings.Assets[asset_name];

								setting_value[style_name] = setting_value[style_name].replace(`$${asset_name}$`, asset.url);

							}

							//Для условных ассетов которые были загружены все (а не один выбранный) в режиме дашборда
							//Нужно выбрать здесь один подходящий под текущие условия
							else if (Settings["dashboard-preview-mode"] && this.isConditionalAsset(Settings.Assets[asset_name], asset_name)) {

								let main_asset_name = asset_name.split('|')[0];

								if (setting_value[style_name].indexOf(`$${main_asset_name}$`) > -1) {

									let asset = MRAID.getResultingConditionalAsset(main_asset_name);

									setting_value[style_name] = setting_value[style_name].replace(`$${main_asset_name}$`, asset.url);

								}

							}

						}

					}

				}

			}

		}

	},

	processAssets() {

		if (Settings.isAssetsProcessed) return;

		let conditional_assets = {};

		for (let name in Settings.Assets) if (Settings.Assets.hasOwnProperty(name)) {

			let asset = Settings.Assets[name];

			//Если условный ассет (старый синтаксис)
			if (asset["values"] || asset["valueFrom"]) {

				if (asset["values"]) {

					asset["randomValue"] = Math.floor(Math.random() * asset["values"].length);

					if (Settings["dashboard-preview-mode"]) this.duplicateSettingsAssetsForDashboard(name, asset, asset["values"], asset["values"][asset["randomValue"]]);

					asset["url"] = asset["url"].replace("?", asset["values"][asset["randomValue"]]);

				} else if (asset["valueFrom"]) {

					if (asset["valueFrom"] in Settings) {

						if (Settings["dashboard-preview-mode"]) this.duplicateSettingsAssetsForDashboard(name, asset, MRAID.Settings[asset["valueFrom"]]["values"], Settings[asset["valueFrom"]]);

						asset["url"] = asset["url"].replace("?", Settings[asset["valueFrom"]]);

					} else if (asset["valueFrom"] in Settings.Assets) {

						if (!("randomValue" in Settings.Assets[asset["valueFrom"]])) Settings.Assets[asset["valueFrom"]]["randomValue"] = Math.floor(Math.random() * Settings.Assets[asset["valueFrom"]]["values"].length);

						if (Settings["dashboard-preview-mode"]) this.duplicateSettingsAssetsForDashboard(name, asset, Settings.Assets[asset["valueFrom"]]["values"], Settings.Assets[asset["valueFrom"]]["values"][Settings.Assets[asset["valueFrom"]]["randomValue"]]);

						asset["url"] = asset["url"].replace("?", Settings.Assets[asset["valueFrom"]]["values"][Settings.Assets[asset["valueFrom"]]["randomValue"]]);

					}

				}

			}

			//Если условный ассет (новый синтаксис) - группируем их чтобы решить какой ассет выбрать для каждой группы
			//В режиме дашборда грузим все версии ассетов чтобы можно было менять моментально
			if (this.isConditionalAsset(asset, name) && !Settings["dashboard-preview-mode"]) {

				let main_name = this.getConditionalAssetMainName(name);

				if (!conditional_assets[main_name]) conditional_assets[main_name] = [];

				conditional_assets[main_name].push(asset);

				//Удаляем условный ассет - ниже решим какой из группы выбрать ему на замену
				delete Settings.Assets[name];

			}

			//Если видео jsmpeg - нужно добавить отдельно audio файл (видео вместе с аудио глючит - быстро прокручивается вначале 2020.04.07)
			if (asset.type === "video" && asset["jsmpeg"]) {

				Settings.Assets[name + ':sound'] = {"type": "sound", "url": asset["urlAudio"] ? asset["urlAudio"] : asset.url.replace('mp4', 'mp3'), "loadStrategy": "delayed"};

			}

		}

		//Выбираем условный ассет для каждой группы
		for (let main_name in conditional_assets) if (conditional_assets.hasOwnProperty(main_name)) {

			let assets = conditional_assets[main_name];

			//Здесь должен остаться один ассет но возможно из-за ошибок в условиях их будет несколько или ни одного - берём случайный
			if (assets.length > 0) Settings.Assets[main_name] = this.getResultingConditionalAssetFromGroup(assets);

		}

		Settings.isAssetsProcessed = true;

	},

	//Выбираем из списка условных ассетов - один который подходит под текущие условия
	getResultingConditionalAsset(asset_main_name) {

		let assets = [];

		for (let name in Settings.Assets) if (Settings.Assets.hasOwnProperty(name)) {

			let asset = Settings.Assets[name];

			if (this.isConditionalAsset(asset, name)) {

				if (this.getConditionalAssetMainName(name) === asset_main_name) assets.push(asset);

			}

		}

		return this.getResultingConditionalAssetFromGroup(assets);

	},

	getResultingConditionalAssetFromGroup(assets) {

		//Фильтруем ассеты сначала по локали
		assets = assets.filter(asset => this.processAssetConditionLocale(asset, asset["condition"], this.getAssetsConditionStats(assets)));

		//Затем оставшиеся фильтруем по времени активации
		assets = assets.filter(asset => this.processAssetConditionTime(asset, asset["condition"], this.getAssetsConditionStats(assets)));

		//Затем по настройкам
		assets = assets.filter(asset => this.processAssetConditionSetting(asset, asset["condition"], this.getAssetsConditionStats(assets)));

		//Здесь должен остаться один ассет но возможно из-за ошибок в условиях их будет несколько или ни одного - берём случайный
		if (assets.length > 0) return assets[Math.floor(Math.random() * assets.length)];
		else return null;

	},

	isConditionalAsset(asset, asset_name) {

		return (asset_name.indexOf('|') >= 0 && asset["condition"]);

	},

	getConditionalAssetMainName(asset_name) {

		return asset_name.substr(0, asset_name.indexOf('|'));

	},

	getAssetsConditionStats(assets) {

		let stats = {
			locales: [],
			times: []
		};

		assets.forEach(asset => {

			if (asset["condition"]["locale"]) stats["locales"].push(asset["condition"]["locale"]);
			if (asset["condition"]["time"]) stats["times"].push(asset["condition"]["time"]);

		});

		return stats;

	},

	processAssetConditionLocale(asset, condition, stats_data) {

		if (condition["locale"]) {

			console.log('processAssetConditionLocale condition["locale"]', condition["locale"]);

			let current_locale = this.getLocale();
			let locales = stats_data["locales"];

			console.log('processAssetConditionLocale current_locale', current_locale);
			console.log('processAssetConditionLocale locales', locales);

			//Если для текущей локали нет вариации этого ассета берём английский - а если нет и его то первый язык в массиве
			if (!locales.includes(current_locale)) current_locale = locales.includes("en") ? "en" : locales[0];

			console.log('processAssetConditionLocale current_locale', current_locale);

			//Если у текущего ассета не эта локаль - отменяем его
			if (current_locale !== condition["locale"]) return false;

		}

		return true;

	},

	processAssetConditionTime(asset, condition, stats_data) {

		if (condition["time"]) {

			let current_time = (new Date()).toISOString();
			let times = stats_data["times"].sort();

			//Отфильтровываем будущие даты - оставляя все прошедшиев порядке возрастания
			times = times.filter(time => time < current_time);

			//Актуальная дата - последняя (если у текущего ассета не она - значит отменяем ассет)
			if (condition["time"] !== times[times.length - 1]) return false;

		}

		return true;

	},

	processAssetConditionSetting(asset, condition) {

		if (condition["setting"]) {

			let result = true;

			for (let setting_name in condition["setting"]) if (condition["setting"].hasOwnProperty(setting_name)) {

				let setting_value = condition["setting"][setting_name];

				if (!Settings[setting_name] || Settings[setting_name] !== setting_value) result = false;

			}

			return result;

		}

		return true;

	},

	duplicateSettingsAssetsForDashboard(name, asset, values) {

		for (let i=0; i<values.length; i++) Settings.Assets[name + '-' + values[i]] = {type: asset["type"], url: asset["url"].replace("?", values[i]), compress: asset["compress"]};

	},

	updateSettings(values) {

		for (let name in values) if (values.hasOwnProperty(name)) {

			this.updateSetting(name, values[name]);

		}

	},

	updateSetting(name, value) {

		MRAID.log('MRAID.updateSetting', name, value);

		if (name === 'debug') {

			Settings[name] = value;

			if (value) this.enableDebug();

			else this.disableDebug();

		} else if (name === 'debug-logger') {

			Settings[name] = value;

			if (Settings["debug"]) {

				this.disableDebug();

				this.enableDebug();

			}

		} else {

			if (MRAID.Settings[name]) {

				if (value === '#random' && MRAID.Settings[name].values) {

					Settings[name] = _.sample(MRAID.Settings[name].values);

				} else {

					Settings[name] = value;

				}

				if (MRAID.Settings[name]["type"]) Broadcast.call("Setting Changed", [name, value]);

			}

		}

	},

	updateAssets(values) {

		for (let name in values) if (values.hasOwnProperty(name)) {

			this.updateAsset(name, values[name]);

		}

	},

	updateAsset(old_asset_name, new_asset) {

		let old_asset = MRAID.Settings.Assets[old_asset_name];

		//Если ассет нужно отменить / удалить
		if (!new_asset && old_asset) {

			if (old_asset.type === 'sound') {

				App.detachAsset(old_asset);

				delete App.Assets[old_asset_name].sound;

			}

		//Если ассет нужно обновить
		} else if (new_asset) {

			if (new_asset.type === 'image' || new_asset.type === 'texture') {

				if (App.Engine === 'Pixi') {

					let new_sprite_name = old_asset_name + '-' + Date.now();

					Settings.Assets[new_sprite_name] = new_asset;

					//Url может быть одинаковым - нужно предотвратить кэширование
					Settings["version"] = Date.now();

					//Загружаем новый ассет
					App.loadAssets([new_sprite_name], () => {

						App.resources[old_asset_name] = PIXI.utils.TextureCache[old_asset_name] = PIXI.utils.TextureCache[new_sprite_name];

						_.each(App.Screens, (screen) => {

							_.each(screen._childs, (child) => {

								if (child && child.params && child.params.image === old_asset_name) {

									if (child.params.type === 'gif') {

										let buffer = PIXI.gif.AnimatedGIF.fromBuffer(App.resources[new_sprite_name].data);

										child._frames = buffer._frames;

										child.currentFrame = 1;
										child.currentFrame = 0;

									} else {

										child.texture = PIXI.utils.TextureCache[new_sprite_name];

									}

								}

							});

						});

					}, {strategy: new_asset.loadStrategy || 'preload'});

				}

			} else if (new_asset.type === 'sound') {

				App.detachAsset(App.Assets[old_asset_name]);

				let asset = App.Assets[old_asset_name] = Object.assign(App.Assets[old_asset_name] || {name: old_asset_name}, new_asset);

				if (asset.url.indexOf('http') !== 0 && asset.url.indexOf('data:') !== 0 && asset.url.indexOf('file:') !== 0) asset.url = (Settings["assets-path"] || '') + asset.url;

				asset.sound = new Howl({
					src: asset.url + '?v=' + Date.now(),
					html5: MRAID.ios && MRAID.safari,
					xhr: {
						withCredentials: true
					},
					onload() {

						asset.state = 'loaded';

						App.processAsset(asset);

					}
				});

			}

		}

	},

	createCloseButton() {

		var container = this.closeButtonContainer = document.createElement("div");
		container.className = "mraid-close-button-container";
		document.body.appendChild(container);

		var close_button = this.closeButtonEl = document.createElement("div");
		close_button.className = "mraid-close-button";
		container.appendChild(close_button);

		var style = document.createElement("style");
		style.appendChild(document.createTextNode(
			"div.mraid-close-button-container {" +
				"width: 32px;" +
				"height: 32px;" +
				"right: 0px;" +
				"left: 0px;" +
				"margin: auto;" +
				"top: 7px;" +
				"position: fixed;" +
				"font-size: 0px;" +
				"z-index: 300;" +
			"}" +
			"div.mraid-close-button {" +
				"width: 18px;" +
				"height: 18px;" +
				"right: 7px;" +
				"top: 7px;" +
				"position: absolute;" +
				"background-size: 100%;" +
				"background-repeat: no-repeat;" +
				"background-position: center;" +
				"display: none;" +
			"}" +
			"div.mraid-close-button-timer {" +
				"width: 18px;" +
				"height: 18px;" +
				"right: 7px;" +
				"top: 7px;" +
				"position: absolute;" +
				"display: none;" +
			"}"
		));
		document.head.appendChild(style);

		MRAID.extendStyles(container, Settings["close-button-container-styles"]);
		MRAID.extendStyles(close_button, Settings["close-button-styles"]);

		MRAID.repositionCloseButton();

		if (Settings["interstitial-timeout"]) {

			let bar_styles = {
				strokeWidth: 6,
				color: '#FFF',
				trailColor: '#eee',
				trailWidth: 1,
				svgStyle: null
			};

			MRAID.extend(bar_styles, Settings["close-button-bar-styles"]);

			var bar = this.progressBar = new ProgressBar.Circle(container, bar_styles);

			var timer_text = this.timerTextEl = document.createElement("div");

			timer_text.className = "mraid-close-button-timer";

			container.appendChild(timer_text);

			MRAID.extendStyles(timer_text, Settings["close-button-timer-styles"]);

			this.timeBegin = Date.now() - Settings["start-time"];

			MRAID.timerTextEl.style.display = "block";

			this.updateTimer();

			MRAID.updateTimeInterval = setInterval(() => {

				MRAID.updateTimer();

			}, 1000);

			MRAID.onViewable(() => {

				bar.animate(1.0, {
					duration: Settings["interstitial-timeout"]
				}, () => {

					clearInterval(MRAID.updateTimeInterval);

					timer_text.innerText = '';

					MRAID.showCloseButton();

				});

			});

		}

	},

	extend(object1, object2) {

		if (!object1 || !object2) return;

		for (var key in object2) if (object2.hasOwnProperty(key)) {

			object1[key] = object2[key];

		}

	},

	extendStyles(el, styles) {

		if (!el || !styles) return;

		MRAID.processDynamicProperties(styles);

		for (var key in styles) if (styles.hasOwnProperty(key)) {

			if (key === 'data') continue;

			if (typeof styles[key] !== 'string') continue;

			if (styles[key].indexOf('url(') !== -1 && styles[key].indexOf("http") === -1 && styles[key].indexOf("//") === -1 && styles[key].indexOf("data:") === -1 ) {

				styles[key] = styles[key].replace('url(', 'url(' + (Settings["assets-path"] || ''));

			}

			el.style[key] = styles[key];

		}

	},

	showCloseButton() {

		MRAID.isCloseButtonShowed = true;

		Broadcast.call("MRAID Show Close Button");

		MRAID.closeButtonEl.style.display = "block";

		MRAID.track('Close Button Showed');

		MRAID.repositionCloseButton();

		this.closeButtonContainer.addEventListener("click", () => {

			if (App.Video && App.Video.showed) {

				MRAID.track('Skip Video Click');

				if (Settings["cta-only"] === true || Settings["cta-only"] === undefined) MRAID.EndCard.show();

				else App.Gameplay.show();

				App.Video.hide();

			} else {

				MRAID.track('Close Click');

				MRAID.close();

			}

		});

	},

	repositionCloseButton() {

		if (this.closeButtonContainer) {

			if (App.Video && App.Video.showed) this.closeButtonContainer.style.transform = "translate(-" + (this.size.width / 2 - 26) + "px, " + (this.size.top) + "px)";

			else this.closeButtonContainer.style.transform = "translate(" + (this.size.width / 2 - 18) + "px, " + (this.size.top) + "px)";

		}

	},

	track(event, params, is_fire_event) {

		MRAID.log('Track:', event, params || '');

		var i, l;

		if (Settings["track-mixpanel-actions"] && event in Settings["track-mixpanel-actions"] && (!this.TrackedEvents[event] || Settings["track-mixpanel-actions"][event+':multiple'])) {

			if (typeof Settings["track-mixpanel-actions"][event] === 'string') Settings["track-mixpanel-actions"][event] = [Settings["track-mixpanel-actions"][event]];

			for (i=0; Settings["track-mixpanel-actions"][event][i]; i++) {

				if (MRAID.isViewable || Settings["track-events-on-viewable"] === false) {

					this.trackSendActionMixPanel(event, Settings["track-mixpanel-actions"][event][i], params);

				} else {

					this.HoldEvents.MixPanel.push([event, Settings["track-mixpanel-actions"][event][i], params]);

				}

			}

		}

		if (!this.TrackedEvents[event]) this.TrackedEvents[event] = [];

		this.TrackedEvents[event].push(new Date());

		if (is_fire_event !== false) Broadcast.call(event);

	},

	trackSendActionMixPanel(event, action, params) {

		if (Settings["track-mixpanel-key"]) MRAID.log('Track Mixpanel:', event, '###', action, params);

		if (Settings['track-mixpanel-key']) {

			if (Settings['publisher'] === 'facebook-instant-games' && window.FBInstant) this.MixpanelUserId = FBInstant.player.getID();

			if (!this.MixpanelUserId) this.MixpanelUserId = Date.now();

			if (typeof action === "string") event = action;

			let mdata = {
				"event": params ? (event + ' - ' + params) : event,
				"properties":  {"token": Settings['track-mixpanel-key'], "distinct_id": this.MixpanelUserId, "$browser": platform.description}
			};

			let additionalProperties = Settings['track-mixpanel-global-properties'] || {};

			for (let i in additionalProperties) if (additionalProperties.hasOwnProperty(i)) mdata["properties"][i] = additionalProperties[i];

			mdata = Base64.encode(JSON.stringify(mdata));

			let xhr = new XMLHttpRequest();

			xhr.open('GET', 'https://api.mixpanel.com/track/?data=' + mdata + '&ip=1', true);

			xhr.send();

		}

	},

	trackSendHoldActions() {

		var j;

		if (this.HoldEvents.MixPanel.length > 0) {

			for (j=0; this.HoldEvents.MixPanel[j]; j++) this.trackSendActionMixPanel.apply(this, this.HoldEvents.MixPanel[j]);

			this.HoldEvents.MixPanel = [];

		}

	},

	updateTimer() {

		let time = Math.min(Date.now() - Settings["start-time"] - this.timeBegin, Settings["interstitial-timeout"]);

		let text = Math.max(Math.round((Settings["interstitial-timeout"] - time) / 1000) , 0);

		this.timerTextEl.innerText = text || '';

	},

	trackOnce(event, details) {

		if (this.TrackedEvents[event]) return;

		this.track(event, details);

	},

	startCloseButtonTimeout() {

		clearTimeout(this.CloseButtonTimeout);
		this.CloseButtonTimeout = setTimeout(() => {

			MRAID.showCloseButton();

		}, Settings["custom-close-button"]);

	},

	startInterstitialTimeout() {

		clearTimeout(this.InterstitialTimeout);
		this.InterstitialTimeout = setTimeout(() => {

			if (Settings["interstitial-action"] === 'cta') {

				MRAID.track('Interstitial Timeout');

				MRAID.track('Interstitial Timeout - CTA');

				if (App.Gameplay.transferToCTA) App.Gameplay.transferToCTA('interstitial-timeout');

				else if (!MRAID.EndCard.showed) {

					MRAID.track("Game Completed", "fail");

					MRAID.EndCard.result = 'interstitial-timeout';

					MRAID.EndCard.show();

				}

			} else if (Settings["interstitial-action"] === 'redirect') {

				MRAID.track('Interstitial Timeout');
				MRAID.track('Interstitial Timeout - Click Out');
				MRAID.track('Click Out - Interstitial Timeout');

				setTimeout(() => {

					MRAID.open();

				}, 200);

			} else {

				MRAID.track('Interstitial Timeout');

			}

		}, Settings["interstitial-timeout"]);

	},

	startRedirectTimeout() {

		clearTimeout(this.RedirectTimeout);
		this.RedirectTimeout = setTimeout(() => {

			Broadcast.call("Redirect timeout complete");

			this.RedirectTimeoutComplete = true;

			MRAID.track('Redirect Timeout');

			setTimeout(() => {

				MRAID.open();

			}, 200);

		}, Settings["redirect-timeout"]);

	},

	startGameplayTimeout() {

		clearTimeout(this.GameplayTimeout);
		this.GameplayTimeout = setTimeout(() => {

			MRAID.track('Gameplay Timeout');

			if (App.Gameplay.transferToCTA) App.Gameplay.transferToCTA('gameplay-timeout');

			else if (!MRAID.EndCard.showed) {

				MRAID.track("Game Completed", "fail");

				MRAID.EndCard.result = 'gameplay-timeout';

				MRAID.EndCard.show();

			}

		}, Settings["gameplay-timeout"]);

	},

	startAutoplayTimeout() {

		if (MRAID.TrackedEvents["Game Starts"]) return;

		clearTimeout(this.AutoplayTimeout);
		this.AutoplayTimeout = setTimeout(() => {

			MRAID.track('Autoplay Timeout');

			if (App.Gameplay && App.Gameplay.autoplay) App.Gameplay.autoplay('autoplay-timeout');

		}, Settings["autoplay-timeout"]);

	},

	startIdleTimeout() {

		clearTimeout(this.IdleTimeout);
		this.IdleTimeout = setTimeout(() => {

			MRAID.track('Idle Timeout');

			if (App.Gameplay.transferToCTA) App.Gameplay.transferToCTA('idle-timeout');

			else if (!MRAID.EndCard.showed) {

				MRAID.track("Game Completed", "fail");

				MRAID.EndCard.result = 'idle-timeout';

				MRAID.EndCard.show();

			}

		}, Settings["idle-timeout"]);

	},

	markInteraction() {

		if (Settings["idle-timeout"] && !(App.Video && App.Video.showed) && !this.TrackedEvents['Idle Timeout']) this.startIdleTimeout();

		if (Settings['interstitial-timeout-interaction'] && !this.InterstitialTimeout) this.startInterstitialTimeout();

		this.firstInteractionOccurred = true;

		Broadcast.call("Interaction");

	},

	checkInteractions() {

		if (this.Interactions) this.Interactions++;
		else this.Interactions = 1;

		if (Settings["redirect-clicks"]) {

			if (this.Interactions >= Settings["redirect-clicks"]) {

				Broadcast.call("Redirect clicks complete");

				this.RedirectClicksComplete = true;

				setTimeout(() => {

					MRAID.open();

				}, 200);

			}

		}

	},

	markMeaningfulInteraction() {

		if (!this.meaningfulInteractionId) this.meaningfulInteractionId = 0;

		this.meaningfulInteractionId++;

		MRAID.track("Interaction");
		MRAID.track("Interaction " + this.meaningfulInteractionId);

		MRAID.markInteraction();
		MRAID.checkInteractions();

		clearTimeout(this.AutoplayTimeout);

	},

	isRetryAvailable() {

		if (Settings["cta-only"] === true || Settings["cta-only"] === undefined) return false;
		if (typeof Settings["try-again"] === "undefined") return true;

		return (!MRAID.TrackedEvents['Retry'] && Settings['try-again'] > 0) || (MRAID.TrackedEvents['Retry'] && MRAID.TrackedEvents['Retry'].length < Settings['try-again']);

	},

	/**
	 en: This method copy all properties, which contains "Landscape" or "Portrait" strings in it's name into
	 en: the same properties but without these strings. And use current {{#crossLink "Game/Orientation:property"}}orientation{{/crossLink}}
	 en: of a current {{#crossLink "Game"}}{{/crossLink}} instance for choose which property value to use.
	 ru: Этот метод копирует все свойства переданного объекта, которые содержат "Landscape" или "Portrait" в
	 ru: такие же свойства, но без "Landscape" и "Portrait". Какое именно свойство использовать зависит
	 ru: от текущей ориентации экрана App.Orientation

	 en: Usually it uses only internal inside {{#crossLink "Screen/applyChildParams:method"}}{{/crossLink}}, but can be used as public method as well.
	 ru: Обычно этот метод используется только внутри класса Screen (во время создания дерева спрайтов, изменения размеров экрана и ориентации).

	 var object = {
			scalePortrait: 1,
			scaleLandscape: 2,
			positionPortrait: [200, 300],
			positionLandscape: [250, 250],
			image: 'background.png'
		};

	 this.processDynamicProperties(object);

	 en: If MRAID.size.orientation === "landscape" this given object will look like:
	 ru: Если MRAID.size.orientation === "landscape" данный объект будет выглядеть так:

	 var object = {
			scalePortrait: 1,
			scaleLandscape: 2,
			scale: 2,
			positionPortrait: [200, 300],
			positionLandscape: [250, 250],
			position: [250, 250],
			image: 'background.png'
		};

	 @method processDynamicProperties
	 @param object
	 */

	processDynamicProperties(object) {

		if (!object) return;

		let orientation = this.size ? this.size.orientation : 'portrait',
			proportion_device = this.size ? this.size.proportionDevice : 'iPhone';

		let postfixes = [
			{name: 'IPad', active: proportion_device === 'iPad'},
			{name: 'IPhoneX', active: proportion_device === 'iPhoneX'},
			{name: 'IPhone', active: proportion_device === 'iPhone'},
			{name: 'IOS', active: MRAID.ios},
			{name: 'Android', active: MRAID.android},
			{name: 'Amazon', active: MRAID.amazon},
			{name: 'Google', active: Settings["publisher"] === 'google'},
			{name: 'Facebook', active: Settings["publisher"] === 'facebook'},
			{name: 'Firefox', active: window.platform && window.platform.name === 'Firefox'},
			{name: 'Chrome', active: window.platform && window.platform.name === 'Chrome'},
			{name: 'Safari', active: window.platform && window.platform.name === 'Safari'},
			{name: 'Landscape', active: orientation === 'landscape'},
			{name: 'Portrait', active: orientation === 'portrait'}
		];

		function is_postfix_exist(property_name, property_postfix) {

			return property_name.indexOf(property_postfix) > -1 || property_name.indexOf(':' + property_postfix.toLowerCase()) > -1;

		}

		function remove_postfix(property_name, property_postfix) {

			return property_name.replace(property_postfix, '').replace(':' + property_postfix.toLowerCase(), '');

		}

		//Запишем сюда свойства которые появились из динамических
		let dynamic_properties = {};

		//Сначала пройдём и соберём значения всех динамических свойств которые будут применены
		for (let property_name in object) if (object.hasOwnProperty(property_name)) {

			let base_property_name = property_name;
			let is_property_name_dynamic = false;
			let is_property_name_active = true;

			for (let i=0; postfixes[i]; i++) {

				if (is_postfix_exist(base_property_name, postfixes[i].name)) {

					is_property_name_dynamic = true;

					base_property_name = remove_postfix(base_property_name, postfixes[i].name);

					if (!postfixes[i].active) is_property_name_active = false;

				}

			}

			//Свойство не динамическое, поэтому пропускаем
			if (!is_property_name_dynamic) continue;

			//Свойство динамическое но не применяется из-за текущего состояния приложения, поэтому пропускаем.
			if (!is_property_name_active) continue;

			//Оригинальное свойство тоже пропускаем - оно обрабатывается после основного цикла
			if (base_property_name.indexOf('#original') > -1) continue;

			dynamic_properties[base_property_name] = object[property_name];

		}

		//Теперь применим динамические свойства
		for (let property_name in dynamic_properties) if (dynamic_properties.hasOwnProperty(property_name)) {

			//Сохраним значение свойства которое было до первой замены (даже если там undefined)
			if (!((property_name + '#original') in object)) object[property_name + '#original'] = object[property_name];

			object[property_name] = dynamic_properties[property_name];

		}

		//Установим оригинальное значение если оно есть а динамического нету (даже если там undefined)
		for (let property_name in object) if (object.hasOwnProperty(property_name)) {

			if (property_name.indexOf('#original') > -1 && !(property_name.replace('#original', '') in dynamic_properties)) object[property_name.replace('#original', '')] = object[property_name];

		}

		return object;

	},

	getSize() {

		let width = window.innerWidth,
			height = window.innerHeight,
			left = 0,
			top = 0;

		//Если код получния размеров определён при создании релиза
		if (MRAID["releaseGetSize"]) {

			const size = MRAID["releaseGetSize"]();

			//MRAID.log('MRAID.releaseGetSize() -> ', size);

			if (size) {

				width = size.width;
				height = size.height;

			}

		}

		else if (window.mraid) {

			if (Settings["viewport-size"] === "mraid-max-size" && mraid.getMaxSize) {

				const max_size = mraid.getMaxSize();

				//MRAID.log('MRAID.getSize() mraid -> mraid-max-size -> ', max_size);

				width = max_size.width;
				height = max_size.height;

			} else if (Settings["viewport-size"] === "mraid-screen-size" && mraid.getScreenSize) {

				const screen_size = mraid.getScreenSize();

				width = screen_size.width;
				height = screen_size.height;

			} else if (Settings["viewport-size"] === "screen-size" && window.screen) {

				width = screen.width;
				height = screen.height;

			}

		}

		if (Settings["viewport-size-protection"]) {

			//Replace wrong values
			if (width < 100 || height < 100 ) {

				const sizes = [
					{name: 'window', width: window.innerWidth, height: window.innerHeight}
				];

				if (window.mraid) {

					const mraid_max_size = mraid.getMaxSize();

					sizes.push({name: 'mraid-max-size', width: mraid_max_size.width, height: mraid_max_size.height});

				}

				if (window.screen) {

					const screen_size = {
						width: screen.width,
						height: screen.height
					};

					sizes.push({name: 'window-screen', width: screen_size.width, height: screen_size.height});

				}

				for (let s=0; sizes[s]; s++) {

					if (sizes[s].width >= 320 && sizes[s].height >= 320 && sizes[s].width !== sizes[s].height) {

						width = sizes[s].width;
						height = sizes[s].height;

						break;

					}

				}

			}

		}

		this.processDynamicProperties(Settings["publisher-settings"]);

		if (Settings["publisher-settings"] && Settings["publisher-settings"]["fixed-size"] && Settings["publisher-settings"]["width"] && Settings["publisher-settings"]["height"]) {

			width = Settings["publisher-settings"]["width"];
			height = Settings["publisher-settings"]["height"];

		} else if (Settings["viewport-aspect-ratio"] === "portrait") {

			const max_width = height * Settings["viewport-aspect-ratio-portrait"];

			const playable_width = (width > max_width) ? max_width : width;
			const playable_height = height;

			if (playable_width < width) left = (width - playable_width) / 2;
			if (playable_height < height) top = (height - playable_height) / 2;

			width = playable_width;
			height = playable_height;

		} else if (Settings["viewport-aspect-ratio"] === "landscape") {

			const max_height = width * Settings["viewport-aspect-ratio-landscape"];

			const playable_width = width;
			const playable_height = (height > max_height) ? max_height : height;

			if (playable_width < width) left = (width - playable_width) / 2;
			if (playable_height < height) top = (height - playable_height) / 2;

			width = playable_width;
			height = playable_height;

		}

		MRAID.log('MRAID.getSize() total -> ', width, height);

		const proportion = width > height ? (width / height) : (height / width);

		let proportion_device = '';

		if (Math.abs(proportion - (667/375)) / (667/375) < 0.07) proportion_device = 'iPhone';

		else if (Math.abs(proportion - (1024/768)) / (1024/768) < 0.07) proportion_device = 'iPad';

		else if (Math.abs(proportion - (812/375)) / (812/375) < 0.07) proportion_device = 'iPhoneX';

		this.size = {
			width: width,
			height: height,
			left: left,
			top: top,
			orientation: width > height ? 'landscape' : 'portrait',
			proportionDevice: proportion_device
		};

		//MRAID.log('Viewport size:', this.size, (MRAID.isMRAID ? 'mraid' : '', Settings["viewport-size"], window.mraid ? mraid.getMaxSize() : '', window.mraid ? mraid.getScreenSize() : '', window.PlayableKit ? window.PlayableKit.getScreenSize() : '', window.innerWidth, window.innerHeight, screen.width, screen.height);

		return this.size;

	},

	//Used to make custom logs into http requests to view them using Charles http debug proxy
	httpDebugRequest(data) {

		var xhr = new XMLHttpRequest();

		xhr.open('GET', 'http://google.com/?q=' + data + '&t=' + Date.now(), true);

		xhr.send();

	},

	isAutoplaySupported(callback) {

		// Is the callback a function?
		if (typeof callback !== 'function') {

			console.log('isAutoplaySupported: Callback must be a function!');

			return false;

		}

		//Allow on all mraid environments?
		if (window.mraid) return callback(true);

		//Safari can play only muted video
		if (this.safari || this.chrome || this.firefox) {

			MRAID.log('isAutoplaySupported: this.firstInteractionOccurred', this.firstInteractionOccurred);

			if (!this.firstInteractionOccurred) {

				//Need wait to register interaction
				setTimeout(() => {

					return callback("muted");

				}, 10);

			} else {

				callback(true);

			}

			return;

		}

		//if (!MRAID.autoplaySupported) {

			// Create video element to test autoplay
			var video = document.createElement('video');

			video.setAttribute("playsinline", "");
			video.setAttribute("webkit-playsinline", "");
			video.setAttribute("crossorigin", "");

			video.autoplay = true;
			video.src = 'data:video/mp4;base64,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';

			video.load();

			video.style.display = 'none';
			video.playing = false;

			video.play();

			// Check if video plays
			video.onplay = function() {

				this.playing = true;

			};

			// Video has loaded, check autoplay support
			video.oncanplay = function() {

				if (video.playing) {

					MRAID.autoplaySupported = 'true';

					callback(true);

				} else {

					MRAID.autoplaySupported = 'false';

					callback(false);

				}
			};

		/*} else {

			if (MRAID.autoplaySupported === 'true') {

				callback(true);

			} else {

				callback(false);

			}

		}*/

	}

};

var Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode(input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode(input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode(utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

};