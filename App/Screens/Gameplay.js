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
			this.COUNT_TILES = 0;

			this.TILES = [];
			this.ALL_TILES = [];
			this.ALL_TILES2 = [];
			//this.TEST = [];

			this.TILES_ROW = [];
			this.COUNT = 0;
			this.MACTHES = [];
			this.TEST = [];
			

		},

		// Стандартное событие срабатывающее сразу после создания спрайтов из секции Containers
		'Gameplay build': function() {

			this['debug background'].visible = Settings["debug"];
			

			this.buildField();
			
			
		},

		'Gameplay tile click': function(sprite) {
			this.TILES.push(sprite);
			console.log(this.TILES[0].row);
			if (this.TILES.length == 2) {
				//this.TILES.push(sprite);

				// for (let i = 0; i < this.TILES_INDEXES.length; i++) {
				// 	if (this.TILES_INDEXES[i].row === this.TILES[1].row) {
				// 		this.TILES_ROW.push(this.TILES_INDEXES[i]);
				// 	}
				// }
				// for (let i = this.TILES[1].column; i < this.TILES_ROW.length; i++) {
				// 	//if ()
				// }
				console.log('11111');
				// console.log(this.TILES_ROW);
				// this.TILES[0].params.image = this.TILES[1].params.image;
				// this.TILES[1].params.image = this.TILES[0].params.image;
				this.animate(
					0.00, this.TILES[0], {scale: 1, repeat: 0, yoyo: false, paused: true},
					0.00, this.TILES[0], {position: [this.TILES[1].position.x, this.TILES[1].position.y], duration: 0.2},
					0.00, this.TILES[1], {position: [this.TILES[0].position.x, this.TILES[0].position.y], duration: 0.2}
				)
				console.log(this.TILES);
				console.log(this.ALL_TILES);
				console.log(sprite);
				
				this.checkMatch();
			} else {
				this.animate(
					0.00, this.TILES[0], {scale: 1.1, repeat: -1, yoyo: true, duration: 0.5},
				)
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

		// this.animate(
		// 	0.00, ["logo", "delivery text"], {alpha: 0, scale: 2},
		// 	1.00, "logo", {alpha: 1, scale: 1, d: 0.7, ease: "power4.out"},
		// 	1.70, "delivery text", {alpha: 1, scale: 1, d: 0.7, ease: "power4.out"}
		// );

	},

	buildField(){
		
		for (let i = 0; i < this.FIELD_SIZE; i++){
			this.ALL_TILES[i] = [];
			for (let k = 0; k < this.FIELD_SIZE; k++){
				let spriteImage = _.sample(this.FIELD_TILE);
				let field = this.buildChild('gameField', {column: i, row: k, childSprite: spriteImage,name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
				this.buildChild('gameField-cell', {name: 'gameField-cell-tile', type: 'sprite', image: spriteImage, event: 'tile'});
				this.ALL_TILES[i][k] = field;
			}
		};
		console.log(this.ALL_TILES)
		// for (let i = 0; i < this.FIELD_SIZE; i++){
		// 	this.ALL_TILES[i] = [];
		// 	for (let k = 0; k < this.FIELD_SIZE; k++){
		// 		let field = this.buildChild('gameField-cell', {column: k, row: i, name: 'gameField-cell-tile', type: 'sprite', image: _.sample(this.FIELD_TILE), position: [130 * k, 135 * i], event: 'tile'});
		// 		this.ALL_TILES[i][k] = field;
		// 		// console.log('[' + i + ', ' + k + ']')
		// 	}
			
		// }
		this.checkAllField();
		// console.log(this.ALL_TILES);
	},

	checkAllField(){
		let transposeMatrix = this.transpose(this.ALL_TILES);
		let transposeMatrix1 = this.transpose(transposeMatrix);
		let transpose = false;
		for (let i = 0; i < this.ALL_TILES.length; i++){

			for (let k = 0; k < this.ALL_TILES[i].length - 1; k++){
				this.findSequence2(this.ALL_TILES[i], this.ALL_TILES[i][k], k + 1);
			}
			
			// for (let k = 0; k < this.ALL_TILES[i].length - 1; k++){
			// 	this.findSequence(this.ALL_TILES[i], this.ALL_TILES[i][k], k + 1);
			// }
			// for (let k = 0; k < transposeMatrix[i].length - 1; k++){
			// 	this.findSequence(transposeMatrix1[i], transposeMatrix1[i][k], k + 1, i);
			// }
			// for (let k = 0; k < transposeMatrix[i].length - 1; k++){
			// 	this.findSequence(transposeMatrix[i], transposeMatrix[i][k], k + 1, i);
			// }
		}
		// console.log(transposeMatrix)
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

	findSequence2(row, value, j){
		let sequenceLength = 1;
		let start = j - 1;
		for (j; row[j] && row[j].childSprite && row[j].childSprite === value.childSprite; j++){
			//console.log(row[j])
			sequenceLength++;
			if (sequenceLength > 2) {
				let start1 = start;
				for (let i = start1 - 1; i >= 0; i--){
					this.TEST.push(row[i]);
					console.log(this.TEST)
				}
				for (start; start <= j; start++){
					let start2 = start;
					this.animate(
						0.50, row[start].children[0], {alpha: 0, duration: 1,},
						() => {
							// console.log(start)
							row[start2].removeChildAt(0);
							// row[start2].addChild(row[start2 - sequenceLength].children[0])
							for (let i = start1 - 1; i >= 0; i--){
								// console.log(i+sequenceLength)
								if (row[i] && row[i].children && row[i].children[0]){
									row[i+sequenceLength].addChild(row[i].children[0])
								}
								
								// row[start - sequenceLength].addChild(row[i].children[0])
								// this.TEST.push(row[i]);
								// console.log(this.TEST)
								// this.animate(
								// 	1.0, row[i+sequenceLength].addChild(row[i].children[0]), {position: [row[i+sequenceLength].x, row[i+sequenceLength].y], duration: 1,},
								// )
								// if (i+sequenceLength === start2) {
								// 	console.log(start2 - i)
								// 	row[start2 - i].addChild(row[i].children[0]);
								// } else {
								// 	row[i+sequenceLength].addChild(row[i].children[0]);
								// }
								
								
							}
						}
					)
					
				}
				// for (let i = start1 - 1; i >= 0; i--){
				// 	console.log(start)
				// 	for (start; start <= j; start++){}
				// 	row[start].addChild(row[i].children[0]);
				// }
				

				// for (let i = 0; i < this.TEST.length; i++){
					
				// }

				// for (let i = 0; i < this.ALL_TILES.length-pos; i++){
				// 	let randomImage = _.sample(this.FIELD_TILE);
				// 	let test = this.buildChild('gameField', {column: r, row: i, name: 'gameField-cell-tile', type: 'sprite', image: randomImage, position: [row[i].position.x, row[i].position.y-80], event: 'tile', alpha: 0});
				// 	this.animate(
				// 		2.00, test, {alpha: 1, position: [row[i].position.x, row[i].position.y], duration: 1},
				// 	)
				// 	// row.unshift(test);
				// }
			}
		}

		
		// for (j; row[j] && row[j].children[0] === value.childSprite2; j++){

		// }
	},


	

	findSequence(row, value, j, r){
		
		let start = j - 1;
		let sequenceLength = 1;
		// this.TEST.push(row);
		// console.log(this.TEST)
		for (j; row[j] && row[j].params && row[j].params.image === value.params.image; j++){
			sequenceLength++;
			if (sequenceLength > 2) {
				let start1 = start;
				let pos = this.ALL_TILES.length - sequenceLength;


				// for (let i = start1 - 1; i >= 0; i--){
				// 	this.animate(
				// 		1.2, row[i], {position: [row[i].position.x, row[i+sequenceLength].position.y], duration: 1},
				// 		// '>', this.buildChild('gameField', {column: r, row: start, name: 'gameField-cell-tile', type: 'sprite', image: _.sample(this.FIELD_TILE),position: [row[i].position.x, row[i].position.y - 500], event: 'tile'}), {position: [row[i].position.x, row[i].position.y], duration: 1},
				// 	)
				// }
				// for (start; start <= j; start++){
				// 	this.animate(
				// 		0.50, row[start], {alpha: 0, duration: 1},
				// 		'>', row[start], {visible: false, duration: 0.1},
				// 		// () => {
				// 		// 	this['gameField'].removeChild(row[start]);
				// 		// }
				// 	)
					
					
				// }
				// for (let i = 0; i < this.ALL_TILES.length-pos; i++){
				// 	let randomImage = _.sample(this.FIELD_TILE);
				// 	let test = this.buildChild('gameField', {column: r, row: i, name: 'gameField-cell-tile', type: 'sprite', image: randomImage, position: [row[i].position.x, row[i].position.y-80], event: 'tile', alpha: 0});
				// 	this.animate(
				// 		2.00, test, {alpha: 1, position: [row[i].position.x, row[i].position.y], duration: 1},
				// 	)
				// 	// row.unshift(test);
				// }
				// // console.log(this.TEST)
				
				// for (let i = 0; i < sequenceLength; i++){

				// 	//for (start; start <= j; start++)
				// 	// let field = this.buildChild('gameField', {column: j, row: r, name: 'gameField-cell-tile', type: 'sprite', image: _.sample(this.FIELD_TILE), position: [j, pos], event: 'tile'});
					
				// 	row.splice(start1, 1);

				// 	//let test = this.ALL_TILES[j][r] = field;
				// 	//row.unshift(test);
					
					
				// }
				
				// console.log(sequenceLength)
				// row.splice(start, sequenceLength);
				// row.splice(j - 2 , sequenceLength);
			}
			
		}
		//row.splice(start, sequenceLength, row[start- 1]);
		
	},

	


	checkMatch(mas){

		// for (let i = 0; i < this.FIELD_SIZE; i++){

		// 	for (let k = 0; k < this.FIELD_SIZE; k++){
		// 		if (this.TILES[0] === )
		// 	}
		// };
		//у нас есть как раз два цикла которые используются при создании поля нужно по ним пробежать, 
		//сравнить массив с элементом из циклов и использовать переменные с помощью которых осуществляется каждая итерация цикал по горизонтали и вертикали
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
