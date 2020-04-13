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
Barricade.canBarricadeDoor = function() {
	var doors = game.dungeon[game.inRoom].getInstancesOf(Door).filter(door => !door.barricaded).filter(door => Math.dist(door.x, door.y, p.x, p.y) <= 100);
	return doors.length > 0;
};
Barricade.method("use", function() {
	if(Barricade.canBarricadeDoor()) {
		var closestDoor = game.dungeon[game.inRoom].getInstancesOf(Door).filter(door => !door.barricaded).min(door => Math.dist(door.x, door.y, p.x, p.y));
		closestDoor.barricaded = true;
		if(typeof closestDoor.dest !== "object") {
			closestDoor.getDestinationDoor().barricaded = true;
		}
		this.consumed = true;
	}
});
