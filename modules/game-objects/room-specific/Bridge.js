function Bridge(x, y) {
	this.x = x;
	this.y = y;
};
Bridge.method("display", function() {
	function displayBridge() {
		/* clip out arches */
		c.lineWidth = 4;
		for(var x = -200; x <= 200; x += 200) {
			var archWidth = (x === 0) ? 150 : 100;
			var y = (x === 0) ? 200 : 250;
			var left = x - (archWidth / 2);
			var right = x + (archWidth / 2);
			c.beginPath();
			c.line(left, canvas.height + 100, left, y);
			c.arc(x, y, archWidth / 2, Math.rad(180), Math.rad(360));
			c.lineTo(right, canvas.height + 100);
			c.stroke();
			c.invertPath();
			c.clip("evenodd");
		}
		/* draw bridge with arches cut out */
		c.fillCircle(0, 500, 500);
	};
	var self = this;
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var backOfBridge = graphics3D.point3D(self.x, self.y, 0.9);
				c.fillStyle = "rgb(150, 150, 150)";
				c.strokeStyle = "rgba(150, 150, 150, 0)";
				c.translate(backOfBridge.x, backOfBridge.y);
				c.scale(0.9, 0.9);
				displayBridge();
			},
			0.9
		)
	);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var frontOfBridge = graphics3D.point3D(self.x, self.y, 1.1);
				c.fillStyle = "rgb(110, 110, 110)";
				c.strokeStyle = "rgb(150, 150, 150)";
				c.translate(frontOfBridge.x, frontOfBridge.y);
				c.scale(1.1, 1.1);
				displayBridge();
			},
			1.1
		)
	);

	/* add lighting shadows */
	var points = [];
	for(var angle = 180 + (18 * 2); angle <= 360 - (18 * 2); angle += (180 / 20)) {
		var point = Math.rotate(500, 0, angle);
		point = graphics3D.point3D(
			point.x + this.x,
			point.y + this.y + 500,
			1.1
		);
		points.push(point);
	}
	game.dungeon[game.inRoom].lightingObjects.push({
		type: "polygon",
		vertices: points,
		nonCyclic: true,
		obscurity: 1
	});
});
Bridge.method("update", function() {
	collisions.solids.circle(this.x, this.y + 500, 500);
});
