        var dragFolders = document.getElementById("sidebar")

		dragFolders.addEventListener("dragover", (e) => {
			e.stopPropagation();
			e.preventDefault();
		})

		dragFolders.addEventListener("drop", (e) => {
			e.stopPropagation();
			e.preventDefault();

			console.log(e)
		})