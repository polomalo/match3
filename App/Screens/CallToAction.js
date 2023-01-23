App.CallToAction = new Screen({

	Name: "CallToAction",

	Containers: [
		{name: 'BackgroundContainer', scaleStrategy: ['cover-screen', 1920, 1080], childs: [
			{name: 'background', type: 'sprite', image: 'background', event: 'cta all', alpha: 0}
		]},
		{name: 'MainContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [
			{name: 'Game Over', type: 'text', text: 'GAME OVER', position: [0, -300]},
			{name: 'Play Button', type: 'sprite', image: 'button', position: [0, 100], event: 'try again', childs: [
				{name: 'Play Text', type: 'text', text: 'PLAY', position: [0, 0]},
			]},
		]}
	],

	Events: {

		'CallToAction before build': function() {

			this.updateChildParamsByName(Settings[this.Name]);

		},

		'CallToAction build': function() {
			
		},


		'CallToAction showed': function() {
			this.animateShow();
			this.bringToTop();
			
		},

		'CallToAction resize': function() {


		},

		'CallToAction try again click': function() {

			App.CallToAction.hide();
			App.Gameplay.show();

		},

		'CallToAction resumed': function() {



		},

		'CallToAction paused': function() {



		}

	},

	animateShow(){
		this.animate(
			0.00, 'background', {alpha: 1, duration: 1}
		)
	}

});