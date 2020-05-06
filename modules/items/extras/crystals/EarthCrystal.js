function EarthCrystal() {
	Crystal.call(this);
};
EarthCrystal.extend(Crystal);
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
			content: "When a weapon is infused with power from this crystal, attacks will crush enemies with a chunk of rock.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
	]
});
EarthCrystal.addBoulderAbove = function(x, y) {
	/*
	This function can be used to drop a boulder from the ceiling above the specified location (the earth crystal's special ability).
	*/
	var ceilings = game.dungeon[game.theRoom].getInstancesOf(Block);
	ceilings = ceilings.concat(game.dungeon[game.theRoom].getInstancesOf(Border).filter(border => border.type.startsWith("ceiling")));
	ceilings = ceilings.filter(ceiling => ceiling.y < y);
	ceilings = ceilings.filter(ceiling => (
		(ceiling instanceof Block && x > ceiling.x && x < ceiling.x + ceiling.w) ||
		(ceiling instanceof Border && (
			ceiling.type === "ceiling" ||
			(ceiling.type === "ceiling-to-left" && x < ceiling.x) ||
			(ceiling.type === "ceiling-to-right" && x > ceiling.x)
		))
	));
	var boulderDamage = Math.randomInRange(20, 40);
	if(ceilings.length === 0) {
		/* add a boulder just above the top of the screen */
		game.dungeon[game.inRoom].content.push(new Boulder(x, -game.camera.getOffsetY(), boulderDamage));
	}
	else {
		var lowestCeiling = ceilings.max(ceiling => ceiling.y);
		if(lowestCeiling instanceof Block) {
			game.dungeon[game.inRoom].content.push(new Boulder(x, lowestCeiling.y + lowestCeiling.h, boulderDamage));
			game.dungeon[game.inRoom].content.push(new BoulderVoid(x, lowestCeiling.y + lowestCeiling.h));
		}
		else {
			game.dungeon[game.inRoom].content.push(new Boulder(x, lowestCeiling.y, boulderDamage));
			game.dungeon[game.inRoom].content.push(new BoulderVoid(x, lowestCeiling.y));
		}
	}
};
