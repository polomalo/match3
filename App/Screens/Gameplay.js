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

			this.TILES_ROW = [];
			this.COUNT = 0;
			this.MACTHES = [];
			this.Node();
			this.DoublyList();
			

		},

		// Стандартное событие срабатывающее сразу после создания спрайтов из секции Containers
		'Gameplay build': function() {

			this['debug background'].visible = Settings["debug"];
			

			this.buildField();
			
			this.checkAllField();
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

	Node(value){
		this.data = value;
		this.next = null;
		this.prev = null;
	},

	DoublyList() {
		this._length = 0;
		this.head = null;
		this.tail = null;
	},

	add(value) {
		let node = new Node(value);
		if (this.length) {
			this.tail.next = node;
			node.prev = this.tail;
			this.tail = node;
		} else {
			this.head = node;
			this.tail = node;
		}
		this._length++;
		return node;
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
			for (let k = 0; k < this.FIELD_SIZE; k++){
				this.buildChild('gameField', {name: 'gameField-cell', type: 'sprite', image: 'gameField-cell', position: [130 * i, 135 * k]});
			}
		};
		for (let i = 0; i < this.FIELD_SIZE; i++){
			this.ALL_TILES[i] = [];
			for (let k = 0; k < this.FIELD_SIZE; k++){
				let test = this.buildChild('gameField', {column: k, row: i, name: 'gameField-cell-tile', type: 'sprite', image: _.sample(this.FIELD_TILE), position: [130 * k, 135 * i], event: 'tile'});
				this.ALL_TILES[i][k] = test;
				
			}
		}
		console.log(this.ALL_TILES);
	},

	checkAllField(){

		for (let i = 0; i < this.ALL_TILES.length; i++){
			
			for (let k = 0; k < this.ALL_TILES[i].length-1; k++){
				if (this.ALL_TILES[i][k].params.image === this.ALL_TILES[i][k+1].params.image){
					//console.log('!!!!');
					console.log('i: ' + i);
					console.log('k: ' + k);
					this.MACTHES.push(this.ALL_TILES[i][k].params.image);
					
					//this.MACTHES.push(this.ALL_TILES[i][k+1].params.image);
					
					
					// this.COUNT++;
					// if (this.COUNT >= 3){
						
					// }
					
					// console.log(this.ALL_TILES[i][k]);
					// console.log(i + ', ' + k);
					
					this.ALL_TILES[i][k].alpha = 0.5;
					this.ALL_TILES[i][k+1].alpha = 0.5;
				}
				// if ((k+1) < this.ALL_TILES[i].length) {
				// 	if (this.ALL_TILES[i][k].params.image === this.ALL_TILES[i][k].params.image ){
				// 		console.log(this.ALL_TILES[i][k]);
				// 		this.ALL_TILES[i][k].alpha = 0.5;
				// 	}
				// }
				
				// console.log(this.ALL_TILES[i][k]);
			}
		}
		console.log(this.MACTHES);

		// this.ALL_TILES.map((index, item) => {

		// })

		// this.ALL_TILES.reduce((previousValue, currentItem, index, arr) => {
		// 	console.log(previousValue)
		// 	// if (index > 0) {
		// 	// 	if (currentItem.row == previousValue.row) {
		// 	// 		this.TILES_ROW.push(previousValue.row)
		// 	// 	}
		// 	// }
		// 	// if (currentItem.row === previousValue.row) {
		// 	// 	this.TILES_ROW.push(previousValue.row)
		// 	// }
		// })

		// let mas = [];
		// for (let i = 0; i < this.ALL_TILES.length-1; i++){
		// 	// if (this.ALL_TILES[i+1] === null){
		// 	// 	return
		// 	// } else 
		// 	console.log(this.ALL_TILES[i].row)
		// 	if (this.ALL_TILES[i].row === this.ALL_TILES[i+1].row){
		// 		//console.log(this.ALL_TILES[i].row)
		// 		this.TILES_ROW.push(this.ALL_TILES[i].row);
		// 	}
			
		// }
		// console.log(this.TILES_ROW)
		// console.log(this.ALL_TILES[i].row)
		// this.ALL_TILES.map((index, item) => {
			
		// 	if (item.row === )
		// 	// mas.push(ite)
		// })
	},

	// 		for (let i = 0; i < this.TILES_INDEXES.length; i++) {
			// 	if (this.TILES_INDEXES[i].row === this.TILES[1].row) {
			// 		this.TILES_ROW.push(this.TILES_INDEXES[i]);
			// 	}
		// 	}

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