function LightRay(x, w, floorY) {
	this.x = x;
	this.w = w;
	this.floorY = floorY; // y-level of floor that light ray hits
};
LightRay.method("display", function() {
	var self = this;
	var leftBack = graphics3D.point3D(this.x, 0, 0.9).x;
	var rightBack = graphics3D.point3D(this.x + this.w, 0, 0.9).x;
	var leftFront = graphics3D.point3D(this.x, 0, 1.1).x;
	var rightFront = graphics3D.point3D(this.x + this.w, 0, 1.1).x;
	var floorBack = graphics3D.point3D(0, this.floorY, 0.9).y;
	var floorFront = graphics3D.point3D(0, this.floorY, 1.1).y;
	game.dungeon[game.theRoom].render(
		new RenderingOrderShape(
			"rect",
			{
				x: leftBack,
				y: 0,
				width: rightBack - leftBack,
				height: floorBack
			},
			"rgba(255, 255, 255, 0.5)",
			0.9,
			-1
		)
	);
	game.dungeon[game.theRoom].render(
		new RenderingOrderShape(
			"polygon",
			[
				leftBack, floorBack,
				leftFront, floorFront,
				rightFront, floorFront,
				rightBack, floorBack
			],
			"rgba(255, 255, 255, 0.5)",
			0.9,
			1
		)
	);
	if(leftBack < 400) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				[
					leftBack, floorBack,
					leftFront, floorFront,
					leftFront, 0,
					leftBack, 0
				],
				"rgba(255, 255, 255, 0.4)",
				0.9,
				1
			)
		);
	}
	if(rightBack > 400) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				[
					rightBack, floorBack,
					rightFront, floorFront,
					rightFront, 0,
					rightBack, 0
				],
				"rgba(255, 255, 255, 0.4)",
				0.9,
				1
			)
		);
	}
});
LightRay.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.floorY += y;
});
