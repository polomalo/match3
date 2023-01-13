(function update_loading_progress() {

	if (!MRAID.TrackedEvents['Loader Initialized']) return Broadcast.on('Loader Initialized', () => {

		update_loading_progress();

	}, "loader");

	//Здесь можно создать новые элементы для экрана загрузки

	function apply_styles() {

		//Здесь можно установить новые стили новым и старым элементам экрана загрузки, в том числе и зависящие от размеров экрана

	}

	Broadcast.on("Mraid Resized", apply_styles, "loader");

	apply_styles();

})();

