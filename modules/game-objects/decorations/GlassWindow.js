function GlassWindow(x, y) {
	this.x = x;
	this.y = y;
	this.color = game.dungeon[game.theRoom].colorScheme;
};
GlassWindow.method("display", function() {
	c.save(); {
		var center = graphics3D.point3D(this.x, this.y, 0.9);
		/* delete bricks behind window */
		function clip() {
			c.beginPath();
			c.rect(center.x - 25, center.y - 100, 50, 100);
			c.circle(center.x, center.y - 100, 25);
			c.clip();
		};
		clip();
		c.fillStyle = "rgb(100, 100, 100)";
		c.fillCanvas();
		/* background */
		graphics3D.cube(this.x - 40, this.y - 200, 20, 190, 0.72, 0.78, null, null);
		graphics3D.cube(this.x + 20, this.y - 200, 20, 190, 0.72, 0.78, null, null);
		graphics3D.cube(this.x - 200, this.y - 10, 400, 100, 0.7, 0.8, null, null);
		var renderingObjects = game.dungeon[game.theRoom].renderingObjects;
		for(var i = renderingObjects.length - 6; i < renderingObjects.length; i ++) {
			var obj = renderingObjects[i];
			obj.transform = clip;
		}
		/* cross patterns */
		var self = this;
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				clip();
				if(self.color === "red") {
					c.strokeStyle = "rgb(200, 50, 0)";
				}
				else if(self.color === "green") {
					c.strokeStyle = "rgb(25, 128, 25)";
				}
				else if(self.color === "blue") {
					c.strokeStyle = "rgb(0, 0, 100)";
				}
				c.lineWidth = 1;
				for(var y = -150; y < 0; y += 10) {
					c.strokeLine(center.x - 25, center.y + y, center.x + 25, center.y + y + 50);
					c.strokeLine(center.x + 25, center.y + y, center.x - 25, center.y + y + 50);
				}
			},
			0.9
		));
		/* window */
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.lineWidth = 4;
				c.strokeStyle = "rgb(50, 50, 50)";
				if(self.color === "red") {
					c.fillStyle = "rgba(255, 20, 0, 0.5)";
				}
				else if(self.color === "green") {
					c.fillStyle = "rgba(0, 128, 20, 0.5)";
				}
				else if(self.color === "blue") {
					c.fillStyle = "rgba(0, 0, 128, 0.5)";
				}
				c.fillRect(center.x - 25, center.y - 100, 50, 100);
				c.strokeRect(center.x - 25, center.y - 100, 50, 100);
				c.fillArc(center.x, center.y - 100, 25, Math.rad(180), Math.rad(360));
				c.stroke();
			},
			0.9
		));
	} c.restore();
});
