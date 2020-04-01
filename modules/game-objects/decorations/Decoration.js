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
		var selfIndex = null;
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Decoration) {
				selfIndex = i;
				break;
			}
		}
		/* find other decorations to copy */
		var resolved = false;
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Torch) {
				game.dungeon[game.inRoom].content[selfIndex] = new Torch(this.x, this.y, game.dungeon[game.theRoom].content[i].color);
				game.dungeon[game.inRoom].content[selfIndex].lit = true;
				resolved = true;
				break;
			}
			else if(game.dungeon[game.theRoom].content[i] instanceof Banner) {
				game.dungeon[game.inRoom].content[selfIndex] = new Banner(this.x, this.y - 30, game.dungeon[game.theRoom].content[i].color);
				resolved = true;
				break;
			}
			else if(game.dungeon[game.theRoom].content[i] instanceof GlassWindow) {
				game.dungeon[game.inRoom].content[selfIndex] = new GlassWindow(this.x, this.y, game.dungeon[game.theRoom].content[i].color);
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
				game.dungeon[game.theRoom].content[selfIndex] = new GlassWindow(x, y, game.dungeon[game.theRoom].colorScheme);
			};
			var decoration = [torch, banner, window].randomItem();
			if(TESTING_MODE) {
				// decoration = torch;
			}
			decoration(this.x, this.y);
		}
	}
});
