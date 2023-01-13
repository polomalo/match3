<!DOCTYPE html>
<html lang="en">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<meta charset="UTF-8">
	<title><%= settings.title %></title>
	<link type="text/css" rel="stylesheet" href="CreativePreview/creative-preview.css">
	<script>
		var CreativePreview = {
			frameSrc: location.search ? location.search.substr(1) : '<%= settings.name %>.html',
			defaultDevice: 'iPhone',
			defaultOrientation: 'landscape'
		}
	</script>
</head>
<body>
<div id="vue-mount-point"></div>
<script src="CreativePreview/creative-preview.js"></script>
</body>
</html>