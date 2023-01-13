App.Tutorial = new Screen({

	Name: "Tutorial",

	Containers: [
		{name: 'TutorialContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [

		]}
	],

	Events: {

		'Tutorial before build': function() {

			this.updateChildParamsByName(Settings[this.Name]);

		},

		'Tutorial build': function() {

		},

		'Tutorial showed': function() {

			this.bringToTop();

			this.showCharacter();

			MRAID.track("Tutorial Showed", [], false);

		},

		'Tutorial resize': function() {

		},

		'Tutorial play click': function() {

			this.hideCharacter();

		},

		'Tutorial resumed': function() {



		},

		'Tutorial paused': function() {



		}

	},

	showCharacter() {

		this.animate(0, 'TutorialContainer', {alpha: 1, d: 0.2});

		//Анимированно показываем тут элементы туториала

	},

	hideCharacter() {

		//Анимированно прячем тут элементы туториала

	},

	animateHide() {

		this.hideCharacter();

		this.animate(0, 'TutorialContainer', {alpha: 0, d: 0.2}, () => {

			this.hide();

		});

	}

});