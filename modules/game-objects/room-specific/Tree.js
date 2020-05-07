function Tree(x, y, settings) {
	/*
	This object represents a dead tree (drawn as a fractal) plus the tree's planter box.
	*/
	this.x = x;
	this.y = y;
	this.maxDepth = settings.maxDepth || 3;
	this.branchLengths = settings.branchLengths || [40, 30, 20, 10];
	this.branchAngles = settings.branchAngles || [-60, 0, 60];
	this.branchWidths = settings.branchWidths || [3, 2, 1];
	this.trunkHeight = settings.trunkHeight || 60;
	this.planterWidth = settings.planterWidth || 200;
	this.planterHeight = settings.planterHeight || 40;
};
Tree.method("display", function() {
	var self = this;
	function fractalTree(location, initialAngle, angles, depth) {
		var length = self.branchLengths[depth];
		angles.forEach(angle => {
			angle += initialAngle;
			var branchEnd = Math.rotate(0, -length, angle);
			c.lineWidth = self.branchWidths[depth];
			c.strokeLine(location.x, location.y, location.x + branchEnd.x, location.y + branchEnd.y);
			if(depth + 1 < self.maxDepth) {
				fractalTree(
					{ x: location.x + branchEnd.x, y: location.y + branchEnd.y },
					angle,
					self.branchAngles[depth + 1],
					depth + 1
				);
			}
		});
	}
	var loc = graphics3D.point3D(this.x, this.y, 0.95);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.lineWidth = 5;
				c.strokeStyle = "rgb(139, 69, 19)";
				c.strokeLine(loc.x, loc.y - self.planterHeight, loc.x, loc.y - self.planterHeight - self.trunkHeight);
				fractalTree(
					{ x: loc.x, y: loc.y - self.planterHeight - self.trunkHeight },
					0,
					self.branchAngles[0],
					0
				);
			},
			0.95
		)
	);
	graphics3D.cube(this.x - (this.planterWidth / 2), this.y - this.planterHeight, 200, this.planterHeight, 0.91, 1);
});
