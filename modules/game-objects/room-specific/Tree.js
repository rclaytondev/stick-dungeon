function Tree(x, y) {
	/*
	dead tree, comes with the planter and everything
	*/
	this.x = x;
	this.y = y;
};
Tree.method("update", function() {
	var loc = graphics3D.point3D(this.x, this.y, 0.95);
	collisions.solids.line(loc.x - 6, loc.y - 100, loc.x - 150, loc.y - 100, {walls: ["top"]});
	collisions.solids.line(loc.x + 6, loc.y - 120, loc.x + 150, loc.y - 120, {walls: ["top"]});
	collisions.solids.line(loc.x - 5, loc.y - 170, loc.x - 100, loc.y - 180, {walls: ["top"]});
	collisions.solids.line(loc.x + 5, loc.y - 190, loc.x + 100, loc.y - 200, {walls: ["top"]});
	collisions.solids.line(loc.x, loc.y - 220, loc.x - 60, loc.y - 230, {walls: ["top"]});
});
Tree.method("display", function() {
	var loc = graphics3D.point3D(this.x, this.y, 0.95);
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					c.fillStyle = "rgb(139, 69, 19)";
					c.save(); {
						c.translate(loc.x, loc.y);
						/* Tree trunk */
						c.fillPoly(-10, -40, 10, -40, 0, -350);
						/* 1st branch on left */
						c.fillPoly(-5, -80, -6, -100, -150, -100);
						/* 1st branch on right */
						c.fillPoly(7, -100, 6, -120, 150, -120);
						/* 2nd branch on left */
						c.fillPoly(-6, -150, -5, -170, -100, -180);
						/* 2nd branch on right */
						c.fillPoly(6, -170, 5, -190, 100, -200);
						/* 3rd branch on left */
						c.fillPoly(0, -200, 0, -220, -60, -230);
					} c.restore();
				},
				0.95
			)
		);
	graphics3D.cube(this.x - 100, this.y - 40, 200, 40, 0.9, 1);
});
