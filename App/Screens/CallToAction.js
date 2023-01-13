App.CallToAction = new Screen({

	Name: "CallToAction",

	Containers: [
		{name: 'BackgroundContainer', scaleStrategy: ['cover-screen', 1920, 1080], childs: [
			{name: 'background', type: 'sprite', image: 'background.jpg', event: 'cta all'}
		]},
		{name: 'MainContainer', scaleStrategy: ['fit-to-screen', 1440, 960], childs: [

		]}
	],

	Events: {

		'CallToAction before build': function() {

			this.updateChildParamsByName(Settings[this.Name]);

		},

		'CallToAction build': function() {

		},

		'CallToAction showed': function() {


		},

		'CallToAction resize': function() {


		},

		'CallToAction try again click': function() {

			App.CallToAction.hide();

			App.Gameplay.restore();

		},

		'CallToAction resumed': function() {



		},

		'CallToAction paused': function() {



		}

	}

});