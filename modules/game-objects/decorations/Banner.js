function Banner(x, y) {
	this.x = x;
	this.y = y;
	this.color = game.dungeon[game.theRoom].colorScheme;
	this.graphic = null;
};
Banner.method("display", function() {
	var p1 = graphics3D.point3D(this.x - 20, this.y - 40, 0.9);
	var p2 = graphics3D.point3D(this.x - 20, this.y + 45, 0.9);
	var p3 = graphics3D.point3D(this.x, this.y + 35, 0.9);
	var p4 = graphics3D.point3D(this.x + 20, this.y + 45, 0.9);
	var p5 = graphics3D.point3D(this.x + 20, this.y - 40, 0.9);
	var color1, color2;
	if(this.color === "green") {
		color1 = "rgb(0, 150, 0)";
		color2 = "rgb(50, 201, 50)";
	}
	else if(this.color === "blue") {
		color1 = "rgb(46, 102, 255)";
		color2 = "rgb(106, 152, 255)";
	}
	else if(this.color === "red") {
		color1 = "rgb(128, 0, 0)";
		color2 = "rgb(178, 50, 50)";
	}
	if(this.graphic === "gradient") {
		var center = graphics3D.point3D(this.x, this.y - 50, 0.9)
		var gradient = c.createLinearGradient(center.x, p1.y, center.x, p3.y);
		gradient.addColorStop(0, color1);
		gradient.addColorStop(1, color2);
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.fillStyle = gradient;
				c.fillPoly(p1, p2, p3, p4, p5);
			},
			0.9
		));
	}
	else if(this.graphic === "border") {
		var center = graphics3D.point3D(this.x, this.y, 0.9);
		var p6 = Math.scaleAboutPoint(p1.x, p1.y, center.x, center.y, 0.7);
		var p7 = Math.scaleAboutPoint(p2.x, p2.y, center.x, center.y, 0.7);
		var p8 = Math.scaleAboutPoint(p3.x, p3.y, center.x, center.y, 0.7);
		var p9 = Math.scaleAboutPoint(p4.x, p4.y, center.x, center.y, 0.7);
		var p10 = Math.scaleAboutPoint(p5.x, p5.y, center.x, center.y, 0.7);

		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.fillStyle = color1;
				c.fillPoly(p1, p2, p3, p4, p5);

				c.fillStyle = color2;
				c.fillPoly(p6, p7, p8, p9, p10);
			},
			0.9
		));
	}
	graphics3D.cube(this.x - 30, this.y - 50, 60, 10, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
});
Banner.method("update", function() {
	if(this.graphic === null) {
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Banner && game.dungeon[game.theRoom].content[i].graphic !== null) {
				this.graphic = game.dungeon[game.theRoom].content[i].graphic;
				break;
			}
		}
		if(this.graphic === null) {
			this.graphic = ["gradient", "border"].randomItem();
		}
		if(TESTING_MODE) {
			this.graphic = "border";
		}
	}
});
