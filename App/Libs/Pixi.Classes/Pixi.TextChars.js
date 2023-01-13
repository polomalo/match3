class TextChars {

	constructor(text, styles) {

		//Запомним переданные текст и стили
		this.text = text;
		this.styles = styles;

		//Главный контейнер где всё будет находиться
		this.container = new PIXI.Container();

		this.linesContainer = new PIXI.Container();
		this.container.addChild(this.linesContainer);

		//Здесь будем хранить списки символов разделённые по группам
		//чтобы можно было удобно анимировать отдельные строки, слова и буквы
		this.lines = this.container.lines = [];
		this.words = this.container.words = [];
		this.chars = this.container.chars = [];

		this.lineObjects = this.container.lineObjects = [];
		this.wordObjects = this.container.wordObjects = [];
		this.charObjects = this.container.charObjects = [];

		this.container.setText = (text, styles) => this.setText(text, styles);
		this.container.applyParams = () => this.applyParams();

		this.build();

		return this.container;

	}

	setText(text, styles) {

		this.text = text;

		this.styles = _.extend({}, styles);

		this.build();

	}

	build() {

		let message = this.text;

		//Стили переданные в этот объект TextChars
		let styles = this.styles || {};

		//Если у локализации есть свои стили
		if (typeof message === 'object') {

			//Мержим их в наши стили
			styles = _.extend({}, styles, _.omit(message, 'text'));

			//Получаем саму строку текста
			message = message.text;

		}

		if (!message) message = '';

		//Просчитываем динамические свойства стилей в зависимости от текущего состояния
		MRAID.processDynamicProperties(styles);

		//Создаём единый объект стилей для всех символов (возможно это нужно изменить если хотим разные стили иметь для символов)
		let styles_object = new PIXI.TextStyle(styles);

		//Символы в виде массива
		let chars = message.split('');

		//console.log('message', message);
		//console.log('styles', styles);
		//console.log('chars', chars);

		//Обнуляем наш главный контейнер от того что там было
		this.linesContainer.children = [];

		//Обнуляем все хранилища спрайтов и объектов строк, слов, символов
		this.lines = this.container.lines = [];
		this.words = this.container.words = [];
		this.chars = this.container.chars = [];

		this.lineObjects = this.container.lineObjects = [];
		this.wordObjects = this.container.wordObjects = [];
		this.charObjects = this.container.charObjects = [];

		//Позиции смещений символа в слове
		let char_x = 0;
		let char_y = 0;
		//Позиции смещений строки в главном контейнере
		let line_x = 0;
		let line_y = 0;
		//Позиции смещений слова в строке
		let word_x = 0;
		let word_y = 0;

		//Создаём объект строки (возможно стоит заменить это на pixi контейнер и избавиться от хранилищ объектов параллельно со спрайтами?)
		let line = this.createLine(line_x, line_y);

		//Создаём объект слова также как и строки
		let word = this.createWord(line, word_x, word_y);

		//Проходим по всем символам
		_.each(chars, string => {

			//Создаём объект одного символа и высчитываем его размеры
			let char = this.createChar(line, word, char_x, char_y, string, styles_object);

			//Увеличиваем длину строки
			line.width += char.metrics.width + (styles.letterSpacing || 0);
			//Увеличиваем высоту строки в её максимальном месте (на случай разных стилей у символов)
			if (line.height < char.metrics.lineHeight) line.height = char.metrics.lineHeight;

			//Увеличиваем длину слова
			word.width += char.metrics.width + (styles.letterSpacing || 0);
			//Увеличиваем высоту слова в его максимальном месте (на случай разных стилей у символов)
			if (word.height < char.metrics.lineHeight) word.height = char.metrics.lineHeight;

			//Если не разрыв слова
			//нужно заменить на regexp (буквенно числовой символ всех языков)
			if (string !== '\n' && string !== ' ') {

				//Увеличиваем отступ для следующего символа
				char_x += char.metrics.width + (styles.letterSpacing || 0);

			}

			//Если разрыв слова
			else {

				//Если есть слово (то есть предыдущий символ не был пустым)
				if (word.charObjects.length > 0) {

					char_x = 0;
					word_x += word.width;

				}

				//Если разрыв строки
				if (string === '\n' || (styles.wordWrap && styles.wordWrapWidth < line.width)) {

					//Начинаем считать x отступ с нуля для слова
					word_x = 0;
					//Увеличиваем y отступ строки
					line_y += line.height;

					//Создаём новую строку
					line = this.createLine(line_x, line_y);

				}

				//Если есть слово (то есть предыдущий символ не был пустым)
				if (word.charObjects.length > 0) {

					word = this.createWord(line, word_x, word_y);

				}

			}

		});

		//console.log('lineObjects', this.lineObjects);
		//console.log('wordObjects', this.wordObjects);
		//console.log('charObject', this.charObjects);

		this.width = 0;
		this.height = 0;

		_.each(this.lineObjects, line_object => {

			if (this.width < line_object.width) this.width = line_object.width;
			this.height += line_object.height;

		});

		//console.log('width', this.width, 'height', this.height);

		this.applyAlign(styles_object._align);
		this.applyAnchor(styles_object.anchor);

		this.centerLinesPivot();
		this.centerWordsPivot();
		this.centerCharsPivot();

		//this.drawDebugLines();

	}

	createLine(x, y) {

		let line = {width: 0, height: 0, charObjects: [], chars: [], wordObjects: [], words: [], container: new PIXI.Container()};

		line.container.position.set(x, y);

		this.lineObjects.push(line);
		this.lines.push(line.container);

		this.linesContainer.addChild(line.container);

		return line;

	}

	createWord(line, x, y) {

		let word = {width: 0, height: 0, charObjects: [], chars: [], container: new PIXI.Container()};

		word.container.position.set(x, y);

		this.wordObjects.push(word);
		this.words.push(word.container);
		line.wordObjects.push(word);
		line.words.push(word.container);

		line.container.addChild(word.container);

		return word;

	}

	createChar(line, word, x, y, string, styles_object) {

		let char = {container: new PIXI.Container(), sprite: new PIXI.Text(string, styles_object), style: styles_object, metrics: PIXI.TextMetrics.measureText(string === ' ' ? '.' : string, styles_object)};

		char.container.position.set(x, y);

		//Кладём объект символа и его спрайт раздельно в список всех символов, список символов строки и список символов слова
		this.charObjects.push(char);
		this.chars.push(char.container);
		line.charObjects.push(char);
		line.chars.push(char.container);
		word.charObjects.push(char);
		word.chars.push(char.container);

		word.container.addChild(char.container);

		char.container.addChild(char.sprite);

		return char;

	}

	applyParams() {

		this.applyAnchor(this.container.params.anchor);

	}

	applyAlign(align = 'center') {

		_.each(this.lineObjects, line => {

			let offset_left = 0;

			if (align === 'center') offset_left = (this.width - line.width) / 2;
			else if (align === 'right') offset_left = this.width - line.width;

			line.container.position.x += offset_left;

		});

	}

	applyAnchor(anchor = [0.5, 0.5]) {

		let offset_left = this.width * anchor[0];
		let offset_top = this.height * anchor[1];

		this.linesContainer.position.x = -offset_left;
		this.linesContainer.position.y = -offset_top;

	}

	centerLinesPivot() {

		_.each(this.lineObjects, line => {

			line.container.pivot.set(line.width / 2, line.height / 2);
			line.container.position.x += line.width / 2;
			line.container.position.y += line.height / 2;

		});

	}

	centerWordsPivot() {

		_.each(this.wordObjects, word => {

			word.container.pivot.set(word.width / 2, word.height / 2);
			word.container.position.x += word.width / 2;
			word.container.position.y += word.height / 2;

		});

	}

	centerCharsPivot() {

		_.each(this.charObjects, char => {

			char.container.pivot.set(char.metrics.width / 2, char.metrics.height / 2);
			char.container.position.x += char.metrics.width / 2;
			char.container.position.y += char.metrics.height / 2;

		});

	}

	drawDebugLines() {

		App.Gameplay.buildChild(this.linesContainer, {type: 'graphics', draw: [['lineStyle', [5, '#ff0000']], ['drawRect', [-6, -6, this.width + 12, this.height + 12]]]});

		_.each(this.lineObjects, line => {
			App.Gameplay.buildChild(line.container, {type: 'graphics', draw: [['lineStyle', [5, '#00ff00']], ['drawRect', [-4, -4, line.width + 8, line.height + 8]]]});
		});

		_.each(this.wordObjects, word => {
			App.Gameplay.buildChild(word.container, {type: 'graphics', draw: [['lineStyle', [5, '#0000ff']], ['drawRect', [-2, -2, word.width + 4, word.height + 4]]]});
		});

		_.each(this.charObjects, char => {
			App.Gameplay.buildChild(char.container, {type: 'graphics', draw: [['lineStyle', [5, '#00ffff']], ['drawRect', [0, 0, char.metrics.width, char.metrics.height]]]});
		});

	}

}

PIXI.TextChars = TextChars;