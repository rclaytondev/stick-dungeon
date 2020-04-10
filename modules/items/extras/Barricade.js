function Barricade() {
	Extra.call(this);
	this.consumed = false;
};
Barricade.extends(Extra);
Barricade.method("display", function(type) {
	type = type || "item";
	var scaleFactor = (type === "item") ? 0.75 : 1;
	if(type === "item" || type === "holding") {
		c.save(); {
			c.fillStyle = "rgb(139, 69, 19)";
			c.lineWidth = 2;

			function displayWoodBoard() {
				function displayScrew(x, y) {
					c.fillStyle = "rgb(200, 200, 200)";
					c.strokeStyle = "rgb(150, 150, 150)";
					c.fillCircle(x, y, 5);
					c.strokeLine(x - 5, y, x + 5, y);
					c.strokeLine(x, y - 5, x, y + 5);
				};
				c.fillRect(-30, -10, 60, 20);
				displayScrew(-20, 0);
				displayScrew(20, 0);
			};

			for(var rotation = -22; rotation <= 22; rotation += 44) {
				/* displays 2 wooden board graphics */
				c.save(); {
					c.scale(scaleFactor, scaleFactor);
					c.rotate(Math.rad(rotation));
					displayWoodBoard();
				} c.restore();
			}
		} c.restore();
	}
});
Barricade.method("getDesc", function() {
	return [
		{
			content: "Barricade",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Usage: Blocking Doors",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Can be placed on a door to prevent enemies from chasing you.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
Barricade.method("use", function() {
	var doorNearby = false;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof Door && Math.dist(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, p.x, p.y) <= 100 && !game.dungeon[game.inRoom].content[i].barricaded) {
			doorNearby = true;
			break;
		}
	}
	if(!doorNearby) {
		return;
	}
	var closestDist = null;
	var closestIndex = 0;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, 0.9);
		var theDist = Math.dist(loc.x, loc.y, 400, 400);
		if((game.dungeon[game.inRoom].content[i] instanceof Door && theDist <= closestDist) || !(game.dungeon[game.inRoom].content[closestIndex] instanceof Door)) {
			closestIndex = i;
			closestDist = theDist;
		}
	}
	var theDoor = game.dungeon[game.inRoom].content[closestIndex];
	theDoor.barricaded = true;
	if(typeof theDoor.dest !== "object") {
		for(var i = 0; i < game.dungeon[theDoor.dest].content.length; i ++) {
			if(game.dungeon[theDoor.dest].content[i] instanceof Door && game.dungeon[theDoor.dest].content[i].dest === game.inRoom) {
				game.dungeon[theDoor.dest].content[i].barricaded = true;
			}
		}
	}
	this.consumed = true;
});
