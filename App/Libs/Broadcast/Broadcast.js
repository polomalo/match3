(function() {

	//Main namespace for library use it for global events
	let Broadcast = {};

	//Implement Broadcast methods to custom object
	Broadcast.make = function(object) {

		const prototype = Broadcast._prototype;

		for (let i in prototype) if (prototype.hasOwnProperty(i)) {

			if (object[i]) Broadcast._warn('Broadcast.make() warning! You try implement Broadcast functionality to custom object, but this object already have the same property.', object, i);

			object[i] = prototype[i];

		}

		object._broadcast_events = {};

		object._broadcast_timeouts = {};

		object._broadcast_codename = 1;

	};

	Broadcast._warn = function() {

		if (typeof console == 'object') {

			if (console.warn) console.warn.apply(console, arguments);
			else if (console.log) console.log.apply(console, arguments);

		}

	};

	Broadcast._getSourceCodename = function(source) {

		if (source._broadcast_codename) return source._broadcast_codename;

		source._broadcast_codename = (source.displayName || source.name || source.Name || 'object') + (Broadcast._index++);

		return source._broadcast_codename;

	};

	Broadcast._index = 1;

	Broadcast._prototype = {};

	Broadcast._prototype.on = function(name, caller, source, options) {

		if (name.indexOf(',') !== -1) name = _.map(name.split(','), function(name) {
			return name.trim();
		});

		if (Array.isArray(name)) {

			for (let i=0, l=name.length; i<l; i++) {

				this.on(name[i], caller, source, options);

			}

		} else {

			name = name.toLowerCase();

			if (!options) options = {};

			if (typeof source == 'string') options.index = source;

			else if (source) {

				if (!options.index) options.index = Broadcast._getSourceCodename(source);

				if (!options.bind) options.bind = source;

			}

			if (options.index) {

				if (!this._broadcast_events[name]) this._broadcast_events[name] = {};

				this.off(name, options.index);

				if (options && options.index && options.times) {

					const original_func = caller;

					caller = () => {

						const args = arguments;

						if (!this._broadcast_timeouts[name + '-' + options.index]) this._broadcast_timeouts[name + '-' + options.index] = setTimeout(() => {

							this._broadcast_timeouts[name + '-' + options.index] = null;

							this._call(original_func, options, args);

						}, options.times);

					}

				}

				this._broadcast_events[name][options.index] = {caller: caller, options: options};

			} else {

				Broadcast._warn('Broadcast.on() warning! You need specify source of the event subscriber or index', name, caller, source, options);

			}

		}

	};

	Broadcast._prototype.once = function(name, caller, source, options) {

		Broadcast.on(name, function() {

			Broadcast.off(name, source);

			caller.apply(this, arguments);

		}, source, options)

	};

	Broadcast._prototype.off = function(name, source) {

		if (!source) Broadcast._warn('Broadcast.off() warning! You need specify source of the event subscriber or index', name, source);

		if (Array.isArray(name)) {

			for (let i=0, l=name.length; i<l; i++) {

				this.off(name[i], source);

			}

		} else {

			name = name.toLowerCase();

			const codename = (typeof source == 'string') ? source : Broadcast._getSourceCodename(source);

			const callers = this._broadcast_events[name];
			if (!callers || !callers[codename]) return;

			delete callers[codename];

		}

	};

	Broadcast._prototype.call = function(name, args, options, source) {

		if (options && options.delay) {

			setTimeout(() => {

				this.call(name, args, options);

			}, options.delay);

			delete options.delay;

		} else {

			name = name.toLowerCase();

			let subscriber, opt, callers = this._broadcast_events[name];

			if (!callers) return;

			if (source) {

				const codename = (typeof source == 'string') ? source : Broadcast._getSourceCodename(source);

				subscriber = callers[codename];
				opt = callers[codename].options || {};

				if (opt.delay) {

					this._delay_call(subscriber.caller, opt, args);

				} else {

					this._call(subscriber.caller, opt, args);

				}

			} else {

				for (let i in callers) if (callers.hasOwnProperty(i)) {

					subscriber = callers[i];
					opt = callers[i].options || {};

					if (opt.delay) {

						this._delay_call(subscriber.caller, opt, args);

					} else {

						this._call(subscriber.caller, opt, args);

					}

				}

			}

		}

	};

	Broadcast._prototype._delay_call = function (caller, options, args) {

		if (!options.delayTimeout) {

			options.delayTimeout = setTimeout(() => {

				this._call(caller, options, args);

				options.delayTimeout = null;

			}, options.delay);

		}

	};

	Broadcast._prototype._call = function (caller, options, args) {

		caller.apply(options.bind || this, args || []);

	};

	Broadcast.make(Broadcast);

	let namespace = null;

	if (typeof global == 'object') namespace = global;

	if (typeof window == 'object') namespace = window;

	if (namespace) {

		namespace.__brdcst = Broadcast;

		if (!namespace.Broadcast) namespace.Broadcast = Broadcast;

		else console.info('Broadcast.make() warning! Global Broadcast namespace already in use. Use __brdcst.make(object) to implement Broadcast functionality to custom object.');

	}

})();
