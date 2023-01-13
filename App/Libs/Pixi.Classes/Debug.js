//-----------------------------------------------------------------------------
// Filename : Screen.Debug.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 28.02.2018
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of special methods for debug and simplify development
//-----------------------------------------------------------------------------

Class.Mixin(Game, {

	logClickCoordinates: function(relative_object) {

		Broadcast.on("Stage Press Up", function () {

			if (App.Engine === 'Pixi') {

				var coords = App.Renderer.plugins.interaction.mouse.global;

				if (relative_object) coords = relative_object.toLocal(coords);

				MRAID.log('-- Debug -- click coordinates: ', coords);

			}

		}, 'Debug');

	},

	collectClickCoordinates: function(relative_object) {

		App._collectedCoords = [];

		Broadcast.on("Stage Press Up", function () {

			if (App.Engine === 'Pixi') {

				var coords = App.Renderer.plugins.interaction.mouse.global;

				if (relative_object) coords = relative_object.toLocal(coords);

				App._collectedCoords.push(coords);

				MRAID.log('-- Debug -- click coordinates: ', App._collectedCoords);

			}

		}, 'Debug');

	},

	auditBase64AssetsSize() {

		MRAID.log(`Audit Base64 encoded project size:`);

		Settings["debug"] = true;
		MRAID.enableDebug();

		let total_size = 0;

		_.each(Settings.Assets, (asset, asset_key) => {

			let size = 0;

			if (asset.url) size += this.lengthInUtf8Bytes(asset.url);
			if (asset.image) size += this.lengthInUtf8Bytes(asset.image);
			if (asset.pako) size += this.lengthInUtf8Bytes(asset.pako);

			MRAID.log(`Asset "${asset_key}": ${Math.round(size / 10000) / 100}mb`);

			total_size += size;

			delete asset.data;

		});

		if (Settings["game-code-pako"]) {

			let game_code_size = this.lengthInUtf8Bytes(Settings["game-code-pako"]);

			MRAID.log(`Game code size: ${Math.round(game_code_size / 10000) / 100}mb`);

			total_size += game_code_size;

		}

		MRAID.log(`Total calculated size: ${Math.round(total_size / 10000) / 100}mb`);

		let total_json_size = this.lengthInUtf8Bytes(JSON.stringify(Settings));

		MRAID.log(`Total JSON size: ${Math.round(total_json_size / 10000) / 100}mb`);


	},

	lengthInUtf8Bytes(str) {

		// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
		let m = encodeURIComponent(str).match(/%[89ABab]/g);
		return str.length + (m ? m.length : 0);

	}

});

Class.Mixin(Screen, {

	initialize: function() {

		if (Settings['debug']) {

			App.logClickCoordinates();

		}

		//TODO: Make sprites drag and save coords

	}

});