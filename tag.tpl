<!DOCTYPE html>
<html lang="en">
    <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
        <meta charset="UTF-8">
    </head>
    <body>
		<script>
			Settings = <%= options.settingsString %>;
		</script>
        <script>Settings["game-code-url"] = false;</script>

        <% for (var i=0; options.files[i]; i++) { %>
        <script src="<%= options.files[i] %>"></script>
        <% } %>
    </body>
</html>