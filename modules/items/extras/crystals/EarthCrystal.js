function EarthCrystal() {
	Crystal.call(this);
};
EarthCrystal.extends(Crystal);
EarthCrystal.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(0, 128, 128)";
	c.strokeStyle = "rgb(0, 128, 0)";
	this.graphics(type);
});
EarthCrystal.method("getDesc", function() {
	return [
		{
			content: "Earth Crystal",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Effect: Crushing",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "When a weapon is infused with power from this crystal, attackis will crush enemies with a chunk of rock.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
	]
});
EarthCrystal.addBoulderAbove = function(x, y) {
	/*
	This function can be used to drop a boulder from the ceiling above the specified location (the earth crystal's special ability). The method exits with no effect if there is no roof directly above the given x-value.
	*/
	var lowestIndex = null;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var block = game.dungeon[game.inRoom].content[i];
		if(block instanceof Block) {
			if(lowestIndex === null) {
				if(x > game.dungeon[game.inRoom].content[i].x && x < game.dungeon[game.inRoom].content[i].x + game.dungeon[game.inRoom].content[i].w) {
					if(game.dungeon[game.inRoom].content[i].y <= y) {
						lowestIndex = i;
					}
				}
			}
			else {
				if(x > block.x && x < block.x + block.w && block.y + block.h > game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h) {
					if(block.y + game.dungeon[game.inRoom].content[i].h <= y) {
						lowestIndex = i;
					}
				}
			}
		}
		if(lowestIndex !== null) {
			if(block instanceof Block) {
			}
		}
		else if(game.dungeon[game.inRoom].content[i] instanceof Block) {
			if(lowestIndex === null) {
			}
		}
	}
	game.dungeon[game.inRoom].content.push(new BoulderVoid(x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h));
	game.dungeon[game.inRoom].content.push(new Boulder(x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h, Math.randomInRange(2, 4)));
};
