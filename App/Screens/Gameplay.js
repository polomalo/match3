/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

App.Gameplay = new Screen({

	// Имя этого экрана - оно используется как префикс для событий (менять не нужно)
	Name: "Gameplay",

	// Секция Containers это дерево элементов для рендеринга - здесь нужно прописать все спрайты, тексты и другие отображаемые элементы для этого экрана,
	// за исключением динамически создаваемых и уничтожаемых элементов геймплея.
	// Весь интерфейс создаётся здесь сразу, даже если не все его элементы всегда отображаются на экране
	Containers: [
		// На первом уровне должен быть один или, обычно, несколько главных контейнеров.
		// Им прописывается свойство scaleStrategy, которое управляет скейлом всего что внутри.
		// Есть 2 основных scaleStrategy: cover-screen и fit-to-screen.
		// cover-screen покрывает весь экран содержимым и обычно используется только для фоновых изображений
		// fit-to-screen вписывает всё что у него внутри в экран не давая элементам выйти за границы экрана - обычно используется для всего остального кроме фоновых изображений

		// Все свойства которые написаны здесь будут переустанавливаться спрайтам и контейнерам каждый раз
		// при изменении размеров вьюпорта поэтому не стоит здесь писать alpha: 0 с целью скрыть элемент на старте
		// лучше сделать это в событии build
		{name: 'BackgroundContainer', scaleStrategy: ['cover-screen', 1080, 1920], childs: [
			{name: 'background', type: 'sprite', image: 'background', event: 'screen'}
		]},
		{name: 'MainContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [
			{name: 'header', childs: [
				{name: 'header-text', type: 'sprite', image: 'header-text', positionPortrait: [-100, -750], positionLandscape: [-500, -100]},
				{name: 'header-timer', type: 'sprite', image: 'header-timer', positionPortrait: [370, -770], positionLandscape: [-700, 100]},
				{name: 'time', type: 'text', text: 'TIME', positionPortrait: [360, -620], positionLandscape: [-400, 120]}
			]},
			{name: 'gameField', positionPortrait: [-455, -400], positionLandscape: [0, -430], scaleLandscape: 0.9, childs: [
				
			]}

		]},

        //Этот контейнер используется для отрисовки отладочной информации если включен debug режим в настройках
		//Здесь отрисовывается физика Matter.js
		{name: 'DebugContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [
			{name: 'debug background', type: 'graphics', draw: [['beginFill', 0x000000], ['drawRect', [-2000, -2000, 4000, 4000]]], alpha: 0.5},
            //For the Matter.js debug rendering
        ]}
	],

	
	//Это нужно прописать для активации физики для этого экрана
	//Нужно ещё добавить в Deploy.mjs саму библиотеку Matter.js и примеси для Screen класса Screen.Physics.js, Screen.Physics.MatterJS.js
	//После этого можно в Containers прописывать спрайтам physics: {...параметры...}
	//По умолчанию спрайт и физикой начнёт падать вниз бесконечно и перестанет быть видимым
	/*Physics: {
		Engine: {
			positionIterations: 10,
            velocityIterations: 8
		}
	},*/

	// Секция событий - здесь прописываются события как общие так и нажатия на спрайты из секции Containers
	// Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
	// а в этой секции написать 'Gameplay имя спрайта click' и дальше написать код срабатываемый по нажатию на этот спрайт
	Events: {

		// Стандартное событие срабатывающее перед созданием спрайтов из секции Containers
		// Здесь можно что-то динамически изменить в Containers если нужно перед их созданием
		'Gameplay before build': function() {

			this.updateChildParamsByName(Settings[this.Name]);

			this.FIELD_SIZE = 8;
			this.FIELD_TILE = ['banana', 'coco', 'grape', 'lemon', 'lime', 'pear'];
			this.FIELD_TILE_NUMBER = [1, 2, 3, 4, 5, 6];
			this.SELECTED_ITEMS = [];
			this.TILES_NUMBER = [];
			this.SPRITE_TILES = [];
			this.ANIM = true;

		},

		// Стандартное событие срабатывающее сразу после создания спрайтов из секции Containers
		'Gameplay build': function() {

			this['debug background'].visible = Settings["debug"];
			
			this.numberField();
		},

		'Gameplay tile click': function(sprite) {
			this.SELECTED_ITEMS.push(sprite);
			let test = this.pulsation(this.SELECTED_ITEMS[0].children);
			if (this.SELECTED_ITEMS.length > 1) {
				if (this.SELECTED_ITEMS[1].column === this.SELECTED_ITEMS[0].column || this.SELECTED_ITEMS[1].row === this.SELECTED_ITEMS[0].row && this.SELECTED_ITEMS[1].childSprite !== 'empty'){
					this.TILES_NUMBER[this.SELECTED_ITEMS[1].column][this.SELECTED_ITEMS[1].row] = this.SELECTED_ITEMS[0].elementNumber;
					this.TILES_NUMBER[this.SELECTED_ITEMS[0].column][this.SELECTED_ITEMS[0].row] = this.SELECTED_ITEMS[1].elementNumber;
					this.buildField();
					let r = this.checkSequance();
					if (r){
						this.recursive();
					} else {
						this.TILES_NUMBER[this.SELECTED_ITEMS[1].column][this.SELECTED_ITEMS[1].row] = this.SELECTED_ITEMS[1].elementNumber;
						this.TILES_NUMBER[this.SELECTED_ITEMS[0].column][this.SELECTED_ITEMS[0].row] = this.SELECTED_ITEMS[0].elementNumber;
						setTimeout(() => {
							this.buildField();
						},500)
						console.log("mo match")
					}
					this.SELECTED_ITEMS = []
				} else {
					this.SELECTED_ITEMS.pop()
				}
			} 
			
		},

		

		// Стандартное событие срабатывающее на изменение размеров или ориентации экрана
		'Gameplay resize': function() {

		},

		// Стандартное событие срабатывающее во время показа экрана (есть ещё и hided - срабатывает во время скрытия экрана)
		'Gameplay showed': function() {

			this.updateSettings();

			if (Settings["intro"] || typeof Settings["intro"] === "undefined") {

				this.showIntro(() => {

					this.startGame();

				});

			} else {

				this.skipIntro(() => {

					this.startGame();
					
				});

			}
		},

		// Стандартное событие срабатывающее на каждый тик / каждую перерисовку экрана
		// Тут лучше ничего не писать, так как этот код срабатывает 60 раз в секунду или больше в зависимости от системы пользователя
		// Любой код расположенный здесь будет снижать производительность
		'Gameplay update': function() {

		},

		'Setting Changed': function(name, value) {

			//Здесь нужно автоматически применить изменения в настройках Settings
			//Это нужно только для Dashboard чтобы не перезагружать фрейм игры

			this.updateSettings(name, value);

		}

	},


	


	//Обычно этот метод нужен во всех играх.
	//Здесь нужно написать код который скроет правила игры (если они есть в игре и отображаются в самом начале).
	//Или сделать первое действие (которое предлагается сделать игроку) автоматически.
	//Этот метод запускается автоматически после Settings["autoplay-timeout"] задержки, которая запускается после вызова MRAID.track('Game Starts');
	autoplay() {

		if (App.Tutorial.showed) App.Tutorial.animateHide();

	},

	//Обычно этот метод нужен во всех играх.
	//Здесь нужно написать код, который заблокирует рекцию на действия игрока
	//и запустит анимации, которые скроют плавно экран Gameplay и покажут экран CTA.
	//Этот метод стоит вызывать когда игрок добился цели в игре, набрал нужное количество очков или победил врага.
	//Также этот метод вызывается автоматически после Settings["gameplay-timeout"], Settings["idle-timeout"] и в других случаях
	transferToCTA(reason, timeout) {

		if (App.Tutorial.showed) App.Tutorial.animateHide();

		clearTimeout(this.TransferToCTATimeout);
		this.TransferToCTATimeout = this.timeout(function() {

			if (Settings["redirect-target-url-after-game"]) {
				setTimeout(() => {
					MRAID.open();
				}, 200);
			} else {
				if (!App.CallToAction.showed) App.CallToAction.show(reason);
			}

		}, typeof timeout === "number" ? timeout : 0);

	},

	//Здесь нужно применить заново все настройки созданные для этого проекта
	//Сменить фон в зависимости от настройки, текстуру героя и т.д.
	//Всё что зависит от настроек переделать заново
	updateSettings() {

		//this['fish ui text'].text = this.fishesCount + '/' + Settings["needed-fishes-count"];

		//this.applyParams('background top', {image: 'water-' + Settings["location"].toLowerCase() + '-top-background.jpg'});
		//this.applyParams('background bottom', {image: 'water-' + Settings["location"].toLowerCase() + '-bottom-overlay.png'});

		//this.updateChildParamsByName(this.waterConfig[Settings["location"]]);

		this.resize();

	},

	showIntro(next) {

		//Запускаем тут анимации появления первого экрана

		if (next) next.call(this);

	},

	skipIntro(next) {

		//Показываем тут быстро первый экран без анимаций его появления

		if (next) next.call(this);

	},

	startGame() {

		MRAID.track('Game Starts');

		this.tutorialTimeout();
		
		let seconds_left = 40;
		
		this['header'].removeChildAt(2);
		this.buildChild('header', {name: 'time', type: 'text', text: 'TIME', positionPortrait: [360, -620], positionLandscape: [-400, 120]});
		this.buildField(this.ANIM);
		setTimeout(() => {
			this.recursive();
			let interval = setInterval(() => {
				seconds_left--;
				console.log(seconds_left)
				this['header'].removeChildAt(2);
				let styles = {
					"fontSize": "70px",
					"fill": "white",
					"fontFamily": "Tahoma",
					"fontWeight": 900,
					"lineJoin": "bevel",
					"miterLimit": 15,
					"stroke": "#02d955",
					"strokeThickness": 8,
					"letterSpacing": 12
				}
				if (seconds_left < 10) {
					let time = this.buildChild('header',{name: 'time', type: 'text', text: '00:0'+seconds_left, positionPortrait: [360, -620], positionLandscape: [-400, 120]});
					
					this.setTextStyles(time, styles)
				} else {
					let time = this.buildChild('header',{name: 'time', type: 'text', text: '00:'+seconds_left, positionPortrait: [360, -620], positionLandscape: [-400, 120]});
					this.setTextStyles(time, styles)
				}
				if (seconds_left <= 0)
				{
					clearInterval(interval);
					for (let i = 0; i < this.TILES_NUMBER.length; i++){
						for (let k = 0;k < this.TILES_NUMBER[i].length; k++){
							this.SPRITE_TILES[i][k].isInteractive = false
							this.animate(
								0.00, this.SPRITE_TILES[i][k], {position: [2000, this.SPRITE_TILES[i][k].position.y], duration: 0.5, delay: 0.5 * k},
							)
						}
					}
					setTimeout(() => {
						App.Gameplay.hide();
						App.CallToAction.show();
					}, 4000)
				}
			}, 1000);
		}, 3500)
		
	},

	recursive(){
		let result = this.checkSequance();
		return this.recursion(result);
	},

	recursion(result){
		if (result == false){
			return 
		} 

	
		setTimeout(() => {
			for (let i = 0; i < this.TILES_NUMBER.length; i++){
				for (let k = 0;k < this.TILES_NUMBER[i].length; k++){
					if (this.TILES_NUMBER[i][k] === 0){
						this.chaoticMotion(this.SPRITE_TILES[i][k].children)
						this.fadeTo(this.SPRITE_TILES[i][k].children, 0, 0.2, delay = 0.5)
					}
				}
			}
		}, 500)
		
		
		setTimeout(() => {
			this.buildField(this.ANIM = false);
			setTimeout(() => {
				for (let i = 0; i < this.TILES_NUMBER.length; i++){
					let sequenceLength1 = 0;
					for (let k = 0;k < this.TILES_NUMBER[i].length; k++){
						if (this.TILES_NUMBER[i][k] === 0) {
							sequenceLength1++;
							for (let j = k - 1; j >= 0; j--){
								if (this.TILES_NUMBER[i][j] !== 0){
									this.fadeTo(this.SPRITE_TILES[i][j].children, 0, 0.2)
								} 
								else {
									sequenceLength1 = 0;
								}
							}
						}
						else {
							sequenceLength1 = 0;
						}
					}
				}
			}, 300);
			setTimeout(() => {
				this.switchNumbers();
				this.buildField(this.ANIM = false);
					setTimeout(() => {
						this.changeTiles();
						this.buildField(this.ANIM = false);
						result = this.checkSequance();
						return this.recursion(result);
						
					}, 400)
			}, 700)
		}, 1600)
	},

	numberField(){
		for (let i = 0; i < this.FIELD_SIZE; i++){
			this.TILES_NUMBER[i] = [];
			for (let k = 0; k < this.FIELD_SIZE; k++){
				this.TILES_NUMBER[i][k] = _.sample(this.FIELD_TILE_NUMBER);
			}
		}
	},

	checkSequance(){
		let result1 = false;
		let result2 = false;
		let transposeMatrix = this.transpose(this.TILES_NUMBER)
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				let r = this.findSequence(this.TILES_NUMBER[i], this.TILES_NUMBER[i][k], k + 1, i);
				
				if (!result1) result1 = r;
				
			}
		}
		for (let i = 0; i < transposeMatrix.length; i++) {
			for (let k = 0; k < transposeMatrix[i].length; k++){
				let r = this.findSequence(transposeMatrix[i], transposeMatrix[i][k], k + 1, i);
				if (!result2) result2 = r;
			}
		}
		let norm = this.transpose(transposeMatrix);
		for (let i = 0; i < norm.length; i++){
			for (let k = 0; k < norm[i].length; k++){
				if (norm[i][k] === 0) {
					this.TILES_NUMBER[i][k] = 0;
				}
			}
		}
		return result1 || result2;
	},

	findSequence(row, value, j, i){
		let sequenceLength = 1;
		let start = j - 1;
		for (j; row[j] === value; j++){
			sequenceLength++;
			if (sequenceLength > 2) {
				for (start; start <= j; start++){
					row[start] = 0;
				}
				
			}
		}
		return sequenceLength > 2;
		
	},

	switchNumbers(){
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				if (this.TILES_NUMBER[i][k] === 0) {
					this.TILES_NUMBER[i].unshift(...this.TILES_NUMBER[i].splice(k, 1));
				}
			}
		}
	},

	changeTiles(){
		let child;
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				if (this.TILES_NUMBER[i][k] === 0) {
					let randomNumber = _.sample(this.FIELD_TILE_NUMBER)
					this.TILES_NUMBER[i][k] = randomNumber;
					child = this.buildChild('gameField', {name: 'gameField-cell', position: [130 * i, 135 * k], type: 'sprite', image: this.FIELD_TILE[randomNumber-1], alpha: 0, elementNumber: randomNumber});
					this.fadeTo(child.children, 0, 0.2)
				}
			}
		}
	},

	transpose(matrix){
		let rows = matrix.length, cols = matrix[0].length;
		let grid = [];
		for (let j = 0; j < cols; j++){
			grid[j] = Array(rows);
		}
		for (let i = 0; i < rows; i++){
			for (let j = 0; j < cols; j++){
				grid[j][i] = matrix[i][j];
			}
		}
		return grid;
	},

	buildField(anim){
		this['gameField'].removeChildren();
		let item, child;
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			this.SPRITE_TILES[i] = []
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				switch(this.TILES_NUMBER[i][k]){
					case 1:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[0], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 1});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[0]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					case 2:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[1], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 2});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[1]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					case 3:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[2], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 3});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[2]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					case 4:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[3], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 4});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[3]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					case 5:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[4], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 5});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[4]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					case 6:
						item = this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[5], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k], event: 'tile', elementNumber: 6});
						child = this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[5]});
						if (anim) {
							this.animate(
								0.00, item, {position: [item.position.x, -1000]},
								0.00, item, {position: [item.position.x, item.position.y], delay: 0.5 * k, duration: 0.5}
							)
						}
						this.SPRITE_TILES[i][k] = item;
						break;
					default:
						item  = this.buildChild('gameField', {column: i, row: k, childSprite: 'empty', name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.SPRITE_TILES[i][k] = item;
						break;
				}
			}
		};
	},



	tutorialTimeout(timeout) {

		if (this.state !== 'intro') {

			clearTimeout(this.TutorialTimeout);
			this.TutorialTimeout = setTimeout(() => {

				if (Settings["tutorial"] && !App.Tutorial.showed && !App.CallToAction.showed) App.Tutorial.show();

			}, typeof timeout === "number" ? timeout : Settings["tutorial-timeout"]);

		}

	},

	hideTutorial() {

		clearTimeout(this.TutorialTimeout);

		if (App.Tutorial.showed) App.Tutorial.animateHide();

	}

});
