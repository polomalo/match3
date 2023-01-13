//-----------------------------------------------------------------------------
// Filename : Screen.Dom.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 15.12.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of DOM methods for Screen class
//-----------------------------------------------------------------------------

Screen.DOM = Class.Mixin(Screen, {

	initialize: function() {

		Broadcast.on(this.Name + ' before build', function() {

			//'this' here == instance of Screen class

			_.each(this.Containers, function(container_params) {

				if (container_params.type === 'dom-container') this.buildDOMContainer(container_params);

			}, this);

		}, this, {index: this.Name + '-Dom'});

		Broadcast.on(this.Name + ' resize', function() {

			//'this' here == instance of Screen class

			this.resizeDOM();

		}, this, {index: this.Name + '-Dom'});

		Broadcast.on(this.Name + ' showed', function() {

			_.each(this._dom_containers, function(dom_container) {

				document.body.appendChild(dom_container.el);

			});

		}, this, {index: this.Name + '-Dom'});

		Broadcast.on(this.Name + ' hided', function() {

			_.each(this._dom_containers, function(dom_container) {

				if (dom_container.el.parentNode) dom_container.el.parentNode.removeChild(dom_container.el);

			});

		}, this, {index: this.Name + '-Dom'});

	},

	resizeDOM: function() {

		this.each(this._dom_containers, function(container) {

			let scale;

			if (container.params.scaleStrategy) scale = container.scale = this.getDOMScaleByStrategy(container.params.scaleStrategy);

			if (container.params.position) {

				container.x = this.calculate(container.params.position[0], {width: MRAID.size.width + MRAID.size.left*2, height: MRAID.size.height + MRAID.size.top*2});
				container.y = this.calculate(container.params.position[1], {width: MRAID.size.width + MRAID.size.left*2, height: MRAID.size.height + MRAID.size.top*2});

			} else {

				container.x = 0;
				container.y = 0;

			}

			container.applyTransform();

			let els = [].concat(...container.el.getElementsByTagName('*'));

			container.el.params = container.params;

			els.splice(0, 0, container.el);

			this.scaleStyles(els, scale);

		});

	},

	buildDOMContainer: function(container_params, z_index) {

		if (!this._dom_containers) this._dom_containers = {};

		const container_name = container_params.name;

		const container = this._dom_containers[container_name] = this[container_name] = {
			params: container_params,
			el: document.createElement('div'),
			els: {},
			x: 0,
			y: 0,
			transformOrigin: container_params.transformOrigin || ['center', 'center'],
			applyTransform: () => {

				container.positionTransform = 'translate('+Math.round(container.x)+'px, '+Math.round(container.y)+'px)';

				const transform_origin = container.transformOrigin.join(' ');
				const transform = container.positionTransform;

				if (transform_origin !== container._transform_origin) {
					container.el.style.transformOrigin = transform_origin;
					container._transform_origin = transform_origin;
				}

				if (transform !== container._transform) {
					container.el.style.WebkitTransform = transform;
					container.el.style.transform = transform;
					container._transform = transform;
				}

			}
		};

		container.el.className = 'dom-container ' + container_name.toLowerCase();

		container.name = container_name;

		container.width = container_params.width;

		container.height = container_params.height;

		container.scale = container_params.scale;

		container.el.style.position = 'fixed';
		container.el.style.left = '0px';
		container.el.style.top = '0px';
		container.el.style.width = '100vw';
		container.el.style.height = '100vh';
		container.el.style.zIndex = 100;

		MRAID.extendStyles(container.el, container_params.styles);

		this.buildDOMChilds(container_name, container_params.childs);

		return container;

	},

	buildDOMChilds: function(container_name, dom_childs) {

		_.each(dom_childs, function(params) {

			const dom_structure = this.createDOMStructure(params);

			dom_structure.name = params[1];

			dom_structure.params = params;

			this._dom_containers[container_name].el.appendChild(dom_structure.el);

			_.extend(this._dom_containers[container_name].els, dom_structure.els);

		}, this);

	},

	createDOMStructure: function(params, els) {

		if (!els) els = {};

		if (_.isString(params)) {

			var text = document.createTextNode(params);

			return {el: text, els: els};

		}

		if (_.isObject(params[2]) && params[2].template) return this.registerDOMObjectPool(params[1], params);

		var el = document.createElement(params[0]);

		el.params = _.extend({}, params[2]);

		if (!el.params.scale) el.params.scale = {};

		el.className = params[1];

		if (!els[el.className]) els[el.className] = el;
		else if (_.isArray(els[el.className])) els[el.className].push(el);
		else els[el.className] = [els[el.className], el];

		if (_.isObject(params[2])) {

			if (params[2].event) this.applyDOMEvents(el, params[2].event, params);

			if (params[2].attr) this.applyDOMAttributes(el, params[2].attr);

		}

		var last_param = params[params.length-1];

		if (_.isString(last_param) && params.length > 2) {

			el.params.text = last_param;

			this.setDOMText(el, last_param, el.params.noWarnings);

		} else if (_.isArray(last_param)) _.each(last_param, function(params) {

			var inner_dom_structure = this.createDOMStructure(params, els);

			if (inner_dom_structure) el.appendChild(inner_dom_structure.el);

		}, this);

		return {el: el, els: els};

	},

	getDOMScaleByStrategy: function(scale_strategy) {

		const
			real_width = window.MRAID ? MRAID.size.width : window.innerWidth,
			real_height = window.MRAID ? MRAID.size.height : window.innerHeight;

		let scale = 1,
			width = real_width,
			height = real_height,
			max_scale = 100000;

		if (!_.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] === 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(real_width / width, real_height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		} else if (scale_strategy[0] === 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(real_width / width, real_height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		}

		return scale;

	},

	applyDOMEvents: function (el, event_params, child_params) {

		if (_.isString(event_params)) event_params = {name: event_params};

		let code = event_params.name,
			name = this.Name;

		if (App.IsTouchDevice) {

			el.addEventListener("touchstart", function (e) {

				var clickpos = Screen.DOM.getMousePositionDistance(e);

				this.setAttribute('clickpos', clickpos);

				Broadcast.call(name + ' ' + code + ' down', [e, el]);

			}, false);

			el.addEventListener("touchend", function (e) {

				var clickpos = Screen.DOM.getMousePositionDistance(e);

				if (Math.abs(parseFloat(this.getAttribute('clickpos')) - clickpos) < 20) Broadcast.call(name + ' ' + code + ' click', [e, el]);

			}, false);

			el.addEventListener("touchmove", function (e) {

				Broadcast.call(name + ' ' + code + ' move', [e, el, child_params]);

			}, false);

		} else {

			el.addEventListener("mouseover", function(e) {

				Broadcast.call(name + ' ' + code + ' over', [e, el, child_params]);

			}, false);

			el.addEventListener("mouseout", function(e) {

				Broadcast.call(name + ' ' + code + ' out', [e, el, child_params]);

			}, false);

			el.addEventListener("mousemove", function(e) {

				Broadcast.call(name + ' ' + code + ' move', [e, el, child_params]);

			}, false);

			el.addEventListener("mousedown", function(e) {

				Broadcast.call(name + ' ' + code + ' down', [e, el, child_params]);

			}, false);

			el.addEventListener("mouseup", function(e) {

				Screen.PressEndEvents.push(code);

				Broadcast.call(name + ' ' + code + ' up', [e, el, child_params]);

			}, false);

			el.addEventListener("click", function(e) {

				Broadcast.call(name + ' ' + code + ' click', [e, el, child_params]);

			}, false);

		}

		el.addEventListener("change", function(e) {

			Broadcast.call(name + ' ' + code + ' change', [e, el, child_params]);

		}, false);

		el.addEventListener("keypress", function(e) {

			Broadcast.call(name + ' ' + code + ' keypress', [e, el, child_params]);

		}, false);

		el.addEventListener("keydown", function(e) {

			Broadcast.call(name + ' ' + code + ' keydown', [e, el, child_params]);

		}, false);

		el.addEventListener("keyup", function(e) {

			Broadcast.call(name + ' ' + code + ' keyup', [e, el, child_params]);

		}, false);

	},

	getMousePositionDistance: function (e) {

		e = e || window.event;

		var pageX, pageY;

		if (e.changedTouches && e.changedTouches[0]) {

			pageX = e.changedTouches[0].pageX;

			pageY = e.changedTouches[0].pageY;

		} else {

			pageX = e.pageX;

			pageY = e.pageY;

		}

		if (pageX === undefined) {

			if ('clientX' in e) {

				pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;

				pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

			}

		}

		return Math.sqrt(pageX * pageX + pageY * pageY);

	},

	applyDOMAttributes: function(el, attributes) {

		this.each(attributes, function(value, name) {

			el.setAttribute(name, this.value(value));

		});

	},

	scaleStyles: function(els, scale) {

		const custom_params = ['position', 'anchor'];

		_.each(els, function(inner_els) {

			if (!_.isArray(inner_els)) inner_els = [inner_els];

			_.each(inner_els, function(el) {

				//User can put any element inside our DOM structure - we must ignore these elements without params
				if (!el.params) return;

				MRAID.extendStyles(el, el.params.styles);

				el._scale = scale || el._scale;

				const styles = el.params.scale;

				_.each(styles, function(style_params, style) {

					if (custom_params.indexOf(style) === -1) this.scaleStyle(el, style, style_params, el._scale);

				}, this);

				setTimeout(() => {

					el.style.userData = {
						position: [0, 0],
						anchor: [0, 0]
					};

					_.each(styles, function(style_params, style) {

						if (custom_params.indexOf(style) === -1) return;

						if (!_.isArray(style_params)) style_params = [style_params];

						if (style === 'position') {

							let values = _.map(style_params, function(style_param) {

								return Math.round(this.calculate(style_param, {fixedMultiplier: scale, width: MRAID.size.width + MRAID.size.left*2, height: MRAID.size.height + MRAID.size.top*2}));

							}, this);

							const anchor = el.style.userData.anchor;
							const position = [parseInt(values[0]), parseInt(values[1])];

							el.style.userData.position = position;

							el.style['transform'] = `translate(${-anchor[0] + position[0]}px, ${-anchor[1] + position[1]}px)`;

						} else if (style === 'anchor') {

							const offset_x = el.offsetWidth * style_params[0];
							const offset_y = el.offsetHeight * style_params[1];

							const anchor = [offset_x, offset_y];
							const position = el.style.userData.position;

							el.style.userData.anchor = anchor;

							el.style['transform'] = `translate(${-anchor[0] + position[0]}px, ${-anchor[1] + position[1]}px)`;

						}

					}, this);

				}, 0);

			}, this);

		}, this);

	},

	scaleStyle: function(el, style, style_params, scale) {

		if (!_.isArray(style_params)) style_params = [style_params];

		let values = _.map(style_params, function(style_param) {

			return this.calculate(style_param, {fixedMultiplier: scale, width: MRAID.size.width + MRAID.size.left*2, height: MRAID.size.height + MRAID.size.top*2});

		}, this);

		values = _.map(values, function(value) {

			if (_.isNumber(value)) return ((value > 0) ? Math.ceil(value) : Math.floor(value)) + 'px';

			else return value;

		});

		el.style[style] = values.join(' ');

		//console.log(el, style, style_params, scale, values, values.join(' '));

	},

	setDOMText: function(el, codename, no_warnings = false, update_styles = true) {

		if (!this.getMessage) throw new Error('Screen.Text is needed for the Screen.Dom texts manipulations!');

		let styles = this.getMessage(codename, no_warnings);

		if (_.isString(styles)) styles = {text: styles};

		if (typeof styles.text === 'string' || typeof styles.text === 'number') el.innerHTML = styles.text;

		if (update_styles) {

			let sprite_params_styles = el.params.styles;

			styles = _.extend({}, sprite_params_styles, styles);

			this.setDOMTextStyles(el, styles);

		}

	},

	setDOMTextStyles(el, styles) {

		MRAID.processDynamicProperties(styles);

		this.transformDOMTextStyles(styles);

		this.setStyles(el, styles);

		//this.applyParams(sprite, _.pick(styles, ["position", "scale", "anchor", "rotation"]));

	},

	transformDOMTextStyles(styles) {

		let stylesInPixels = ['fontSize', 'letterSpacing', 'wordWrapWidth', 'lineHeight', 'padding'];

		stylesInPixels.forEach((style) => {

			if ((styles[style] && styles[style] !== 'normal' && styles[style] !== 'auto') || styles[style] === 0) styles[style] += 'px';

		});

		if (styles['fill']) {

			styles['color'] = styles['fill'];

		}

		if (styles['breakWords'] === true) {

			styles['wordBreak'] = 'break-all';

		} else if (styles['breakWords'] === false) {

			styles['wordBreak'] = 'normal';

		}

		if (styles['wordWrap'] === true) {

			styles['wordWrap'] = 'break-all';

		} else if (styles['wordWrap'] === false) {

			styles['wordWrap'] = 'normal';

		}

		if (styles['wordWrapWidth']) {

			styles['width'] = styles['wordWrapWidth'];

		}

	},

	setStyles: function(el, styles) {

		_.extend(el.params.scale, styles);

		let scale;

		let container = el;

		while (container.parentElement) {

			if (container.params && container.params.scaleStrategy) {

				scale = this.getDOMScaleByStrategy(container.params.scaleStrategy);

				break;

			}

			container = container.parentElement;

		}

		this.scaleStyles([el], scale);

	},

	registerDOMObjectPool: function(pool_name, dom_objects_props) {

		if (!this._dom_object_pools) this._dom_object_pools = {};

		dom_objects_props = _.clone(dom_objects_props);

		delete dom_objects_props[2].template;

		this._dom_object_pools[pool_name] = {
			name: pool_name,
			domObjectProps: dom_objects_props,
			domObjects: []
		};

	},

	getDOMObjectFromPool: function(pool_name) {

		var pool = this._dom_object_pools[pool_name];

		var objects = pool.domObjects,
			free_object = null;

		_.each(objects, function(object) {

			if (!object.el.parentNode) free_object = object;

		});

		if (free_object) {

			return free_object;

		}

		return this.createDOMObjectForPool(pool_name);

	},

	createDOMObjectForPool: function(pool_name) {

		var pool = this._dom_object_pools[pool_name];

		var dom_object = this.createDOMStructure(pool.domObjectProps);

		pool.domObjects.push(dom_object);

		return dom_object;

	},

	removePoolDOMObjects: function(pool_name, parent) {

		this.eachPoolDOMObjects(pool_name, parent, function(object) {

			object.el.parentNode.removeChild(object.el);

		});

	},

	eachPoolDOMObjects: function(pool_name, parent, next) {

		var pool = this._dom_object_pools[pool_name];

		var pool_objects = pool.domObjects;

		_.each(pool_objects, function(object) {

			if (object.el.parentNode && (parent === true || object.el.parentNode === parent)) next.apply(this, [object]);

		});

	}

});

Screen.PressEndEvents = [];

Broadcast.on("Document Press Up", function(e) {

	Broadcast.call("Global Press End", [e, Screen.PressEndEvents]);

	Screen.PressEndEvents = [];

}, this);