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
				{name: 'header-text', type: 'sprite', image: 'header-text', position: [-100, -750]},
				{name: 'header-timer', type: 'sprite', image: 'header-timer', position: [370, -770]},
				// {name: 'delivery text', type: 'text', text: 'DELIVERY', position: [-70, -700], event: true}
			]},
			{name: 'gameField', positionPortrait: [-455, -400], childs: [
				
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
			this.FIELD_TILE_NUMBER = [1, 2];
			this.COUNT_TILES = 0;

			this.TILES_NUMBER = [];
			this.ALL_TILES = [];
			this.ALL_TILES2 = [];
			//this.TEST = [];

			this.TILES_ROW = [];
			this.COUNT = 0;
			this.MACTHES = [];
			this.TEST = [];
			this.CHANGES = false;
			this.TRANSPOSE_MATRIX;
			

		},

		// Стандартное событие срабатывающее сразу после создания спрайтов из секции Containers
		'Gameplay build': function() {

			this['debug background'].visible = Settings["debug"];
			

			
			this.numberField();
			// this.TRANSPOSE_MATRIX = this.transpose(this.TILES_NUMBER);
			// console.log('transpose matrix',this.transpose(this.TILES_NUMBER))
			console.log(JSON.stringify(this.TILES_NUMBER))
			this.buildField();
			// this.animate(
			// 	0.00, this['gameField'], {alpha: 1, duration: 3},
			// )
			
			let result = this.checkSequance();
			// console.log('result', result);
			let iterations = 0;
			while (result) {
				console.log('iterations', iterations++);
				this['gameField'].removeChildren(0, 64);
				this.buildField();
				// console.log(JSON.stringify(this.TILES_NUMBER))
				this.switchNumbers();
				// console.log(JSON.stringify(this.TILES_NUMBER))
				this['gameField'].removeChildren(0, 64);
				this.buildField();
				this.changeTiles();
				// console.log(JSON.stringify(this.TILES_NUMBER))
				// // console.log(this.TILES_NUMBER)
				this.buildField();
				result = this.checkSequance();
				// this.checkSequance();
			}

			// this.checkSequance();
			// if (this.CHANGES){
			// 	this.checkSequance();
			// }
			
			
		},

		'Gameplay tile click': function(sprite) {
			// console.log(event)
			// console.log(this.TILES_NUMBER[row][colu])

			// this.TILES.push(sprite);
			// console.log(this.TILES[0].row);
			// if (this.TILES.length == 2) {
			// 	//this.TILES.push(sprite);

			// 	// for (let i = 0; i < this.TILES_INDEXES.length; i++) {
			// 	// 	if (this.TILES_INDEXES[i].row === this.TILES[1].row) {
			// 	// 		this.TILES_ROW.push(this.TILES_INDEXES[i]);
			// 	// 	}
			// 	// }
			// 	// for (let i = this.TILES[1].column; i < this.TILES_ROW.length; i++) {
			// 	// 	//if ()
			// 	// }
			// 	console.log('11111');
			// 	// console.log(this.TILES_ROW);
			// 	// this.TILES[0].params.image = this.TILES[1].params.image;
			// 	// this.TILES[1].params.image = this.TILES[0].params.image;
			// 	this.animate(
			// 		0.00, this.TILES[0], {scale: 1, repeat: 0, yoyo: false, paused: true},
			// 		0.00, this.TILES[0], {position: [this.TILES[1].position.x, this.TILES[1].position.y], duration: 0.2},
			// 		0.00, this.TILES[1], {position: [this.TILES[0].position.x, this.TILES[0].position.y], duration: 0.2}
			// 	)
			// 	console.log(this.TILES);
			// 	console.log(this.ALL_TILES);
			// 	console.log(sprite);
				
			// 	this.checkMatch();
			// } else {
			// 	this.animate(
			// 		0.00, this.TILES[0], {scale: 1.1, repeat: -1, yoyo: true, duration: 0.5},
			// 	)
			// }
			
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

	},

	numberField(){
		for (let i = 0; i < this.FIELD_SIZE; i++){
			this.TILES_NUMBER[i] = [];
			for (let k = 0; k < this.FIELD_SIZE; k++){
				this.TILES_NUMBER[i][k] = _.sample(this.FIELD_TILE_NUMBER);
			}
		}
		// console.log('normal matrix', this.TILES_NUMBER)
		
		
		
	},

	checkSequance(){
		let result1 = false;
		let result2 = false;
		
		let transposeMatrix = this.transpose(this.TILES_NUMBER)
		// console.log('333', transposeMatrix)
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				let r = this.findSequence(this.TILES_NUMBER[i], this.TILES_NUMBER[i][k], k + 1);
				if (!result1) result1 = r;
				
			}
			
			// for (let k = 0; k < transposeMatrix[i].length; k++){
			// 	let r = this.findSequence(transposeMatrix[i], transposeMatrix[i][k], k + 1);
			// 	if (!result2) result2 = r;
			// }
			// console.log('!!!',this.transpose(this.TILES_NUMBER))
		}
		for (let i = 0; i < transposeMatrix.length; i++) {
			for (let k = 0; k < transposeMatrix[i].length; k++){
				let r = this.findSequence(transposeMatrix[i], transposeMatrix[i][k], k + 1);
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
		// for (let i = 0; i < this.transpose(this.TILES_NUMBER).length; i++){
		// 	for (let k = 0; k < this.transpose(this.TILES_NUMBER[i]).length; k++){
		// 		let r = this.findSequence(this.transpose(this.TILES_NUMBER[i]), this.transpose(this.TILES_NUMBER[i][k]), k + 1);
		// 		if (!result1) result1 = r;
				
		// 	}
		// }
			
		// 	for (let k = 0; k < this.transpose(this.TILES_NUMBER[i]).length; k++){
		// 		let r = this.findSequence(this.transpose(this.TILES_NUMBER[i]), this.transpose(this.TILES_NUMBER[i][k]), k + 1);
		// 		if (!result2) result2 = r;
		// 	}
		// }
		// console.log(this.CHANGES);
		// if (this.CHANGES) {
		// 	this['gameField'].removeChildren(0, 64)
		// 	// this.animate(
		// 	// 	4.00, this.buildField(), {alpha: 1},
		// 	// )
			
		// 	this.buildField();
		// 	console.log(JSON.stringify(this.TILES_NUMBER))
		// 	this.switchNumbers();
		// 	console.log(JSON.stringify(this.TILES_NUMBER))
		// 	this['gameField'].removeChildren(0, 64);
		// 	this.buildField();
		// 	this.changeTiles();
		// 	console.log(JSON.stringify(this.TILES_NUMBER))
		// 	// // console.log(this.TILES_NUMBER)
		// 	this.buildField();
		// 	// this.checkSequance();
		// }
		
		console.log('rrr', result1, result2, this.CHANGES);
		return result1 || result2;
		// this.buildField();
	},

	findSequence(row, value, j){
		let sequenceLength = 1;
		let start = j - 1;
		for (j; row[j] === value; j++){
			sequenceLength++;
			if (sequenceLength > 1) {
				for (start; start <= j; start++){
					row[start] = 0;
					
				}
				this.CHANGES = true;
				return true;
			}
		}
		this.CHANGES = false;
		// console.log(changes)
		return false;
		
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
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				if (this.TILES_NUMBER[i][k] === 0) {
					let randomNumber = _.sample(this.FIELD_TILE_NUMBER)
					// console.log('[' + i + ', ' + k + '] = ' +  this.TILES_NUMBER[i][k]);
					this.TILES_NUMBER[i][k] = randomNumber;
					// console.log(randomNumber);
					
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

	buildField(){
		// console.log(this.TILES_NUMBER)
		for (let i = 0; i < this.TILES_NUMBER.length; i++){
			for (let k = 0; k < this.TILES_NUMBER[i].length; k++){
				switch(this.TILES_NUMBER[i][k]){
					case 1:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[0], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[0], event: 'tile'});
						break;
					case 2:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[3], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[1], event: 'tile'});
						break;
					case 3:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[2], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[2], event: 'tile'});
						break;
					case 4:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[4], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[3], event: 'tile'});
						break;
					case 5:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[5], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[4], event: 'tile'});
						break;
					case 6:
						this.buildChild('gameField', {column: i, row: k, childSprite: this.FIELD_TILE[6], name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
						this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: this.FIELD_TILE[5], event: 'tile'});
						break;
					default:
						this.buildChild('gameField', {column: i, row: k, name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
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
