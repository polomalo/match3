//-----------------------------------------------------------------------------
// Filename : Screen.Physics.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 10.03.2017
// Require: Class.js, PhysicsJS
//-----------------------------------------------------------------------------
// Set of Physics methods for Screen class
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize() {

		this.SpecialParams.push('physics');

		Broadcast.on('Assets Preload Complete', function() {

			if (this.Physics) this.createPhysicsWorld();

		}, this, {index: this.Name + '-Physics'});

		Broadcast.on(this.Name + ' build child', function(child, child_params) {

			if (this.Physics && child_params.physics) this.buildChildPhysics(child, child_params);

		}, this, {index: this.Name + '-Physics'});

		Broadcast.on(this.Name + ' update', function() {

			if (this.Physics) this.updatePhysics();

		}, this, {index: this.Name + '-Physics'});

		Broadcast.on(this.Name + ' resize', function() {

			if (this.Physics) this.resizePhysics();

		}, this, {index: this.Name + '-Physics'});

	},

	updatePhysics() {

		this.each(this._physics_sprites, (sprite) => {

			this.applyChildPhysics(sprite);

		});

	}

});