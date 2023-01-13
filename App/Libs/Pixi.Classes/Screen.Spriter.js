//-----------------------------------------------------------------------------
// Filename : Screen.Spriter.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 10.04.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Spriter animations parser
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function() {

		this.SpecialParams.push('spriterData');
		this.SpecialParams.push('trimPath');

		Broadcast.on(this.Name + ' build child', function(child, child_params) {

			if (child_params.type === 'spriter-animation') this.buildChildSpriterAnimation(child);

		}, this, {index: this.Name + '-Spriter'});

		Broadcast.on(this.Name + ' update', function() {

			this.updateSpriterAnimations();

		}, this, {index: this.Name + '-Spriter'});

		this.spriter_animations = [];

	},

	buildChildSpriterAnimation: function(container) {

		var child_params = container.params;

		container.data = this.value(child_params.spriterData);

		this.makeZOrdering(container);

		if (typeof container.data === 'string') {

			if (App.Assets[container.data]) {

				if (typeof App.Assets[container.data].data === 'string') container.data = JSON.parse(App.Assets[container.data].data);

				else container.data = App.Assets[container.data].data;

			}

		}

		this.each(container.data.entity, function(entity) {

			if (!child_params.entities || this.contains(this.value(child_params.entities), entity.id) || this.contains(this.value(child_params.entities), entity.name)) {

				this.each(entity.animation, function (animation) {

					if (!child_params.animations || this.contains(this.value(child_params.animations), animation.id) || this.contains(this.value(child_params.animations), animation.name)) {

						if (!child_params.filter || child_params.filter.apply(this, [entity.id, animation.id])) {

							this.prepareSpriterAnimation(container, entity.id, animation.id, entity.name + ' ' + animation.name);

						}

					}

				});

			}

		});

		container.play = this.bind(function(animation_name, next, next_animation) {

			this.playSpriterAnimation(container, animation_name, next, next_animation);

		});

		container.stop = this.bind(function() {

			this.spriter_animations = this.without(this.spriter_animations, container);

		});

		container.setState = this.bind(function(animation_name, time, next) {

			container.stop();

			container.currentAnimationName = animation_name;

			container.currentAnimationStartTime = 0;

			container.drawedMainlineKeyId = null;

			container.next = next;

			this.updateAnimationSpritesVisibility(container);

			this.updateSpriterAnimation(container, time);

			this.updateZOrdering(container);

		});

		this.spriter_animations.push(container);

	},

	prepareSpriterAnimation: function(container, entity_id, animation_id, animation_name) {

		if (!container.AnimationDataHash) container.AnimationDataHash = {};

		var animation_data = container.AnimationDataHash[animation_name] = this.extend({}, container.data.entity[entity_id].animation[animation_id]);

		var timelines = animation_data.timeline;

		if (!animation_data.childsHashByName) animation_data.childsHashByName = {};

		this.each(timelines, function(timeline) {

			if (!animation_data.childsHashByName[timeline.name]) {

				var key_item = timeline.key[0];

				if (key_item.object) {

					this.buildSpriterSprite(container, animation_data, timeline, key_item.object);

				} else if (key_item.bone) {

					animation_data.childsHashByName[timeline.name] = this.buildChild(container.DisplayStage, {name: timeline.name, type: 'container', anchor: [0, 0]});

					animation_data.childsHashByName[timeline.name].visible = false;

				}

			}

		});

	},

	buildSpriterSprite: function(container, animation_data, timeline, object_data) {

		if (animation_data.childsHashByName[timeline.name]) animation_data.childsHashByName[timeline.name].destroy();

		var file_data = container.data.folder[object_data.folder].file[object_data.file];

		if (container.params.trimPath) file_data.name = file_data.name.split('/').pop();

		animation_data.childsHashByName[timeline.name] = this.buildChild(container.DisplayStage, {type: 'sprite', image: file_data.name, anchor: [0, 0]});

		animation_data.childsHashByName[timeline.name].textureKey = object_data.folder + '-' + object_data.file;

		animation_data.childsHashByName[timeline.name].visible = false;

		this.setSpriterSpritePivot(container, animation_data.childsHashByName[timeline.name], object_data);

		if (App.Engine === 'Pixi') animation_data.childsHashByName[timeline.name].parentLayer = container.DisplayLayer;

	},

	setSpriterSpritePivot: function(container, child, object_data) {

		var file_data = container.data.folder[object_data.folder].file[object_data.file];

		child.pivot.set(file_data.width * file_data.pivot_x, file_data.height * (1 - file_data.pivot_y));

		child.pivotFromFile = true;
		child.pivotFromFileX = file_data.pivot_x;
		child.pivotFromFileY = file_data.pivot_y;

	},

	playSpriterAnimation: function(container, animation_name, next, next_animation) {

		container.currentAnimationName = animation_name;

		container.currentAnimationStartTime = App.time;

		container.drawedMainlineKeyId = null;

		container.next = next || animation_name;

		container.nextAnimation = next_animation || (typeof container.next === 'string' ? container.next : animation_name);

		this.updateAnimationSpritesVisibility(container);

	},

	updateAnimationSpritesVisibility: function(container) {

		this.each(container.AnimationDataHash, function(animation_data, animation_name) {

			this.each(animation_data.childsHashByName, function(child) {

				child.visible = container.currentAnimationName === animation_name;

			});

		});

	},

	updateSpriterAnimations: function() {

		this.each(this.spriter_animations, function(container) {

			this.updateSpriterAnimation(container, App.time);

			this.updateZOrdering(container);

		});

	},

	updateSpriterAnimation: function(container, time) {

		if (!container.AnimationDataHash) return;

		if (!container.visible) return;

		if (!container.alpha) return;

		var animation_data = container.AnimationDataHash[container.currentAnimationName];

		container.currentAnimation = {};

		if (animation_data) {

			var time_offset = (time - container.currentAnimationStartTime);

			if (time_offset > (animation_data.length || 1)) {

				if (container.next) {

					container.currentAnimationName = null;

					if (typeof container.next === 'function') container.next.call(App.Gameplay);

					else if (typeof container.next === 'string') App.Gameplay.playSpriterAnimation(container, container.next);

					return;

				} else {

					time_offset = time_offset % (animation_data.length || 1);

					container.currentAnimationStartTime = time;

				}

			}

			for (var i=0; animation_data.mainline.key[i]; i++) {

				if ((animation_data.mainline.key[i].time || 0) > time_offset) break;

				else container.currentMainlineKey = animation_data.mainline.key[i];

			}

			container.currentTimelineKeys = {};

			for (i=0; animation_data.timeline[i]; i++) {

				var name = animation_data.timeline[i].name,
					start, end, result;

				var curr_timeline_keys = container.currentTimelineKeys[name] = null;

				for (var j=0; animation_data.timeline[i].key[j]; j++) {

					if ((animation_data.timeline[i].key[j].time || 0) > time_offset) {

						curr_timeline_keys = container.currentTimelineKeys[name] = {
							prevKey: animation_data.timeline[i].key[j-1] || animation_data.timeline[i].key[animation_data.timeline[i].key.length-1],
							prevKeyTime: (animation_data.timeline[i].key[j-1] || animation_data.timeline[i].key[animation_data.timeline[i].key.length-1]).time || 0,
							nextKey: animation_data.timeline[i].key[j],
							nextKeyTime: animation_data.timeline[i].key[j].time
						};

						break;

					}

				}

				if (!curr_timeline_keys) {

					curr_timeline_keys = container.currentTimelineKeys[name] = {
						prevKey: animation_data.timeline[i].key[animation_data.timeline[i].key.length-1],
						prevKeyTime: animation_data.timeline[i].key[animation_data.timeline[i].key.length-1].time || 0,
						nextKey: animation_data.timeline[i].key[0],
						nextKeyTime: animation_data.length
					};

					if (container.nextAnimation && container.AnimationDataHash[container.nextAnimation] && !container.skipNextAnimationSmoothTransform) {

						var next_animation_data = container.AnimationDataHash[container.nextAnimation];

						if (next_animation_data) {

							var timeline = this.filter(next_animation_data.timeline, function(item) {return item.name === name;})[0];

							if (timeline) curr_timeline_keys.nextKey = timeline.key[0];

							else curr_timeline_keys.nextKey = curr_timeline_keys.prevKey;

						} else {

							curr_timeline_keys.nextKey = curr_timeline_keys.prevKey;

						}

					} else {

						curr_timeline_keys.nextKey = curr_timeline_keys.prevKey;

					}

					Broadcast.call(this.Name + " Spriter Animation End Timeline", [container, name, curr_timeline_keys]);

				}

				if (curr_timeline_keys.prevKey) {

					start = curr_timeline_keys.prevKey.bone || curr_timeline_keys.prevKey.object;
					end = curr_timeline_keys.nextKey.bone || curr_timeline_keys.nextKey.object;
					result = curr_timeline_keys;

					var percent = ((time_offset - curr_timeline_keys.prevKeyTime) / (curr_timeline_keys.nextKeyTime - curr_timeline_keys.prevKeyTime)) || 0;

					var start_x = ("x" in start) ? start.x : 0,
						start_y = ("y" in start) ? start.y : 0,
						end_x = ("x" in end) ? end.x : 0,
						end_y = ("y" in end) ? end.y : 0;

					result.x = start_x + (end_x - start_x) * percent;
					result.y = start_y + (end_y - start_y) * percent;

					var start_scale_x = ("scale_x" in start) ? start.scale_x : 1,
						start_scale_y = ("scale_y" in start) ? start.scale_y : 1,
						end_scale_x = ("scale_x" in end) ? end.scale_x : 1,
						end_scale_y = ("scale_y" in end) ? end.scale_y : 1;

					result.scale_x = start_scale_x + (end_scale_x - start_scale_x) * percent;
					result.scale_y = start_scale_y + (end_scale_y - start_scale_y) * percent;

					if ("pivot_x" in start && "pivot_y" in start) {

						result.pivot_x = start.pivot_x;
						result.pivot_y = start.pivot_y;

					} else {

						delete result.pivot_x;
						delete result.pivot_y;

					}

					var start_alpha = ("a" in start) ? start.a : 1,
						end_alpha = ("a" in end) ? end.a : 1;

					result.a = start_alpha + (end_alpha - start_alpha) * percent;

					var start_angle = start.angle || 0,
						end_angle = end.angle || 0;

					if (curr_timeline_keys.prevKey.spin === -1) {

						if (start_angle < end_angle) start_angle += 360;

					} else if (curr_timeline_keys.prevKey.spin === 0) {

						start_angle = end_angle;

					} else {

						if (start_angle > end_angle) start_angle -= 360;

					}

					result.angle = start_angle + (end_angle - start_angle) * percent;

				} else {

					end = curr_timeline_keys.nextKey.bone || curr_timeline_keys.nextKey.object;
					result = curr_timeline_keys;

					result.x = end.x || 0;
					result.y = end.y || 0;

					result.scale_x = ("scale_x" in end) ? end.scale_x : 1;
					result.scale_y = ("scale_y" in end) ? end.scale_y : 1;

					result.a = ("a" in end) ? end.a : 1;

				}

			}

			this.drawSpriterAnimation(container);

		}

	},

	drawSpriterAnimation: function(container) {

		var animation_data = container.AnimationDataHash[container.currentAnimationName];

		var mainline_key = container.currentMainlineKey;

		if (mainline_key.id !== container.drawedMainlineKeyId) {

			var childs = {},
				childs_by_ids = {};

			this.each(mainline_key.bone_ref, function(bone_data) {

				var name = animation_data.timeline[bone_data.timeline].name;

				childs[name] = parseInt(bone_data.z_index);

				var child = animation_data.childsHashByName[name];

				childs_by_ids[bone_data.id] = child;

				if ('parent' in bone_data && child.parent !== childs_by_ids[bone_data.parent]) childs_by_ids[bone_data.parent].addChild(child);

			}, this);

			this.each(mainline_key.object_ref, function(object_data) {

				var name = animation_data.timeline[object_data.timeline].name;

				childs[name] = parseInt(object_data.z_index);

				var child = animation_data.childsHashByName[name];

				if (App.Engine === 'Phaser') {

					child._parentTransform = childs_by_ids[object_data.parent];

				} else if (App.Engine === 'Pixi') {

					if ('parent' in object_data && child.parent !== childs_by_ids[object_data.parent]) childs_by_ids[object_data.parent].addChild(child);

				}

			}, this);

			this.each(animation_data.childsHashByName, function(child, name) {

				child.visible = name in childs;

				if (App.Engine === 'Phaser') {

					child.z = - childs[name] || (child._parentTransform ? child._parentTransform.z : 0);

				} else if (App.Engine === 'Pixi') {

					child.zOrder = - childs[name] || 0;

				}

			});

			container.drawedMainlineKeyId = mainline_key.id

		}

		this.each(container.currentTimelineKeys, function(timeline, name) {

			var child = animation_data.childsHashByName[name];

			var key = timeline.prevKey;

			this.setSpriterKeyProperties(child, timeline);

			if (key.object) {

				var object = key.object;

				var texture_key = object.folder + '-' + object.file;

				if (child.textureKey !== texture_key) {

					var file_data = container.data.folder[object.folder].file[object.file];

					child.texture = this.getTexture(file_data.name);

					this.setSpriterSpritePivot(container, child, object);

					child.textureKey = texture_key;

				}

			}

		}, this);

	},

	setSpriterKeyProperties: function(child, data) {

		if ('abs_a' in data) child.alpha = data.abs_a;

		else child.alpha = 1;

		if ('abs_angle' in data) {

			var abs_angle = -data.abs_angle;

			if (abs_angle < 0) abs_angle += 360;

			child.rotation = abs_angle / 180 * Math.PI;

		}

		if ('a' in data) child.alpha = data.a;

		else child.alpha = 1;

		if ('angle' in data) {

			var angle = -data.angle;

			if (angle < 0) angle += 360;

			child.rotation = angle / 180 * Math.PI;

		}

		if (('scale_x' in data || child.scale.x !== 1) || ('scale_y' in data || data.scale_y !== 1)) {

			child.scale.set('scale_x' in data ? data.scale_x : 1, 'scale_y' in data ? data.scale_y : 1);

		}

		if ('pivot_x' in data && 'pivot_y' in data) {

			child.pivot.set(child.width * data.pivot_x, child.height * (1 - data.pivot_y));

		} else if (!child.pivotFromFile) {

			child.pivot.set(child.width * child.pivotFromFileX, child.height * (1 - child.pivotFromFileY));

			child.pivotFromFile = true;

		}

		if (('x' in data || child.position.x !== 0) || ('y' in data || child.position.y !== 0)) child.position.set('x' in data ? data.x : 0, 'y' in data ? -data.y : 0);

	},

	makeZOrdering: function(container) {

		if (App.Engine === 'Phaser') {

			var children = this.getAllChildren(container, function (child) {return child.params.type === 'sprite';});

			this.each(children, function (child) {

				if (child.params.type === 'sprite') {

					child.updateTransform = function () {

						if (!this.visible)  return;

						if (this._parentTransform) this.displayObjectUpdateTransform(this._parentTransform);

						else this.displayObjectUpdateTransform(this.parent);

					}

				}

			});

		} else if (App.Engine === 'Pixi') {

			container.DisplayStage = new PIXI.display.Stage();

			container.addChild(container.DisplayStage);

			container.DisplayLayer = new PIXI.display.Layer();

			container.DisplayLayer.group.enableSort = true;

			container.DisplayStage.addChild(container.DisplayLayer);

		}

	},

	updateZOrdering: function(container) {

		if (App.Engine === 'Phaser') {

			container.children = container.children.sort(function (a, b) {

				return a.z < b.z ? 1 : -1;

			});

		} else if (App.Engine === 'Pixi') {

			container.DisplayStage.updateStage();

		}

	},

	getAllChildren: function(container, filter, _result) {

		if (!_result) _result = [];

		this.each(container.children, function(child) {

			if (filter) {

				if (filter.apply(this, [child])) _result.push(child);

			} else {

				_result.push(child);

			}

			if (child.children) this.getAllChildren(child, filter, _result);

		});

		return _result;

	}

});