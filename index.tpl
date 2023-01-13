<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
	<script>
        if ((typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)) document.location = '<%= settings.name %>.html';
        else document.location = '<%= settings.name %>-preview.html';
	</script>
</head>
</html>