function Decoration(x, y) {
	/*
	Never actually displayed in-game. Selects one of the specific types of decorations to display.
	*/
	this.x = x;
	this.y = y;
	this.type = null;
};
Decoration.method("update", function() {
	if(this.type === null) {
		/* find self in the current room */
		var selfIndex = game.dungeon[game.theRoom].content.indexOf(this);
		/* find other decorations to copy */
		var resolved = false;
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			var obj = game.dungeon[game.theRoom].content[i];
			if(obj instanceof Torch) {
				game.dungeon[game.inRoom].content[selfIndex] = new Torch(this.x, this.y);
				game.dungeon[game.inRoom].content[selfIndex].lit = true;
				resolved = true;
				break;
			}
			else if(obj instanceof Banner) {
				game.dungeon[game.inRoom].content[selfIndex] = new Banner(this.x, this.y - 30);
				resolved = true;
				break;
			}
			else if(obj instanceof GlassWindow) {
				game.dungeon[game.inRoom].content[selfIndex] = new GlassWindow(this.x, this.y);
				resolved = true;
				break;
			}
		}
		/* randomize decoration if none other to mimic */
		if(!resolved) {
			function torch(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new Torch(x, y);
				game.dungeon[game.theRoom].content[selfIndex].lit = true;
			};
			function banner(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new Banner(x, y - 30);
			};
			function window(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new GlassWindow(x, y);
			};
			var decoration = [torch, banner, window].randomItem();
			if(debugging.settings.DEBUGGING_MODE && debugging.settings.DECORATION_TYPE !== null) {
				decoration = [torch, banner, window].filter(func => func.name === debugging.settings.DECORATION_TYPE)[0];
			}
			decoration(this.x, this.y);
		}
	}
});
