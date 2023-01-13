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

	/*
	//Add this section to screen where you want to use physics
	Physics: {
		Engine: {
			positionIterations: 10,
            velocityIterations: 8
		}
	},
	*/

	initialize() {

		this._physics_sprites = [];

		Broadcast.on(this.Name + ' update', () => {

			if (Settings["debug"] && this.Physics && this.Physics.renderSprite) this.Physics.renderSprite.texture.update();

		}, this, {index: this.Name + '-Physics-Matter'});

		//Здесь мы создаём всё что связано в физикой
		Broadcast.on(this.Name + ' build child', (child, child_params) => {

			if (this.Physics && child_params.type === 'physics-composite') this.buildPhysicsChild(child, child_params);

		}, this, {index: this.Name + '-Three'});

	},

	createPhysicsWorld() {

		this.Physics.Composites = {};

        this.Physics.engine = Matter.Engine.create({
            positionIterations: 10,
            velocityIterations: 8
        });

        this.Physics.engine.world.gravity = {x: 0, y: 5};

        Matter.Engine.run(this.Physics.engine);

		// an example of using collisionStart event on an engine
		Matter.Events.on(this.Physics.engine, 'collisionStart', (event) => {

			Broadcast.call(this.Name + " Collision Start", [event]);

		});

        if (Settings["debug"]) {

			this.Physics.render = Matter.Render.create({
				element: document.body,
				engine: this.Physics.engine,
				options: {
					width: 2048,
					height: 2048,
					wireframeBackground: 'transparent',
					background: 'transparent',
					hasBounds: true,
					showAngleIndicator: true,
					showCollisions: true,
					showVelocity: true
				}
			});

			this.Physics.render.bounds.min.x = -1024;
			this.Physics.render.bounds.min.y = -1024;
			this.Physics.render.bounds.max.x = 1024;
			this.Physics.render.bounds.max.y = 1024;

			this.Physics.render.canvas.parentNode.removeChild(this.Physics.render.canvas);

			Matter.Render.run(this.Physics.render);

			this.Physics.renderSprite = PIXI.Sprite.from(this.Physics.render.canvas);
			this.Physics.renderSprite.anchor.set(0.5, 0.5);

			this.resizePhysics();

		}

	},

	buildPhysicsChild(child, child_params) {

		if (child_params.type === 'physics-composite') this.buildPhysicsComposite(child_params);

	},

	buildChildPhysics(child, child_params) {

		if (child_params.physics === true) child_params.physics = {};

		if (this.isArray(child_params.physics)) child_params.physics = {body: child_params.physics};

		if (!child_params.physics.position) child_params.physics.position = this.detectPhysicsPosition(child, child_params);

		if (!child_params.physics.rotation) child_params.physics.rotation = this.detectPhysicsRotation(child, child_params);

		if (!child_params.physics.body) child_params.physics.body = this.detectPhysicsBody(child, child_params);

		if (child_params.physics.body) child.physicsBody = this.buildPhysicsBody(child_params.physics, child_params.name);

		if (child_params.physics.composite) child.physicsComposite = this.getPhysicsComposite(child_params.physics);

		if (child.physicsBody) {

			let old_destroy = child.destroy;

			child.destroy = () => {

				Matter.World.remove(this.Physics.engine.world, child.physicsBody);

				this._physics_sprites = _.without(this._physics_sprites, child);

				if (old_destroy) old_destroy.call(child);

			};

			if (child.physicsComposite) Matter.Composite.add(child.physicsComposite, child.physicsBody);
			else Matter.World.add(this.Physics.engine.world, [child.physicsBody]);

		}

		this._physics_sprites.push(child);

	},

	detectPhysicsParams(child, child_params) {

		return {
			body: this.detectPhysicsBody(child, child_params),
			position: this.detectPhysicsPosition(child, child_params),
			rotation: this.detectPhysicsRotation(child, child_params)
		}

	},

	detectPhysicsBody(child, child_params) {

		if (child_params.type === 'graphics') {

			if (child_params.draw[1][0] === 'drawRect') {

				return ['rectangle', child_params.draw[1][1][2], child_params.draw[1][1][3]];

			}

		} else if (child_params.type === 'sprite') {

			return ['rectangle', child.texture._frame.width, child.texture._frame.height];

		}

	},

	detectPhysicsPosition(child, child_params) {

		//console.log('detectPhysicsPosition', child_params.position, child_params.positionLandscape)

		return child_params.position ? child_params.position : [0, 0];

	},

	detectPhysicsRotation(child, child_params) {

		return (child_params.rotation) ? child_params.rotation : 0;

	},

	buildPhysicsBody(physics, label) {

		//console.log('Create physics body', physics);

		let options = _.omit(physics, ['body', 'position', 'rotation', 'composite']);

		//console.log('Create physics body options', options);

		let body = null;

		if (physics.body[0] === 'rectangle') {

			body = Matter.Bodies.rectangle(0, 0, ...physics.body.slice(1));

		} else if (physics.body[0] === 'circle') {

			body = Matter.Bodies.circle(0, 0, ...physics.body.slice(1));

		} else if (physics.body[0] === 'parts') {

			options.parts = [];

			this.each(physics.body[1], (part) => {

				if (typeof part === 'string') {

					let physics_body = this[part].physicsBody;

					if (!physics_body) {

						let physics = this.detectPhysicsParams(this[part], this[part].params);

						physics_body = this.buildPhysicsBody(physics, label);

					}

					options.parts.push(physics_body);

				} else if (typeof part === 'object') {

					options.parts.push(this.buildPhysicsBody(part, label));

				}

			});

			body = Matter.Body.create(options);

		}

		if (body) {

			if (physics.position) Matter.Body.setPosition(body, {x: physics.position[0], y: physics.position[1]});
			if (physics.rotation) Matter.Body.setAngle(body, physics.rotation);

			body.label = label;

		}

		return body;

	},

	buildPhysicsComposite(child_params) {

		let name = child_params.name;
		let options = child_params.options;

		let composite = this.Physics.Composites[name] = Matter.Composite.create();

		if (child_params.bodies) {

			_.each(child_params.bodies, body_name => {

				if (this[body_name] && this[body_name].physicsBody) {

					Matter.World.remove(this.Physics.engine.world, [this[body_name].physicsBody]);
					Matter.Composite.add(composite, this[body_name].physicsBody);

				}

			});

		}

		if (options.chain) {

			Matter.Composites.chain(composite, ...options.chain);

		}

		if (options.constraint) {

			_.each(options.constraint, (param_value, param_name) => {

				if (typeof param_value === 'function') options.constraint[param_name] = param_value(composite)

			});

			Matter.Composite.add(composite, Matter.Constraint.create(options.constraint));

		}

		Matter.World.add(this.Physics.engine.world, [composite]);

		return composite;

	},

	applyChildPhysics(child) {

		if (child.physicsBody) {

			child.position.set(child.physicsBody.position.x, child.physicsBody.position.y);

			child.rotation = child.physicsBody.angle;

		}

	},

	resizePhysics() {

        if (Settings["debug"]) {

			if (this.Physics.renderSprite && (!this.Physics.renderSprite.parent && this["DebugContainer"])) this["DebugContainer"].addChild(this.Physics.renderSprite);

		}

	},

	tweenPhysics(tween_params, physics_sprite, next) {

		if (typeof physics_sprite === 'string') physics_sprite = this[physics_sprite];

		let physics_body = physics_sprite.physicsBody;

		let tween_proxy_object_initial = {
			angle: physics_body.angle,
			position: {x: physics_body.position.x, y: physics_body.position.y}
		};

		let tween_proxy_object = {
			angle: physics_body.angle,
			position: {x: physics_body.position.x, y: physics_body.position.y, set: (x, y) => {this.x = x; this.y = y;}},
			params: {}
		};

		tween_params.update = () => {
			if (tween_proxy_object_initial.angle !== tween_proxy_object.angle) Matter.Body.rotate(physics_body, tween_proxy_object.angle - physics_body.angle);
			if (tween_proxy_object_initial.position.x !== tween_proxy_object.position.x || tween_proxy_object_initial.position.y !== tween_proxy_object.position.y) Matter.Body.translate(physics_body, {x: tween_proxy_object.position.x - physics_body.position.x, y: tween_proxy_object.position.y - physics_body.position.y});
		};

		this.tween(tween_params, tween_proxy_object, next);

	}

});