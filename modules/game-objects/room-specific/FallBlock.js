function FallBlock(x, y) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 0 };
	this.ORIGINAL_Y = y;
	this.falling = false;
	this.timeShaking = 0;
	this.steppedOn = false;
	this.allDone = false;
};
FallBlock.method("update", function() {
	/* Top face */
	var self = this;
	collisions.solids.line(this.x - 20, this.y, this.x + 20, this.y, {walls: ["top"], illegalHandling: "collide", onCollision: function() { self.steppedOn = true; }});
	/* left face */
	collisions.solids.line(this.x - 20, this.y, this.x, this.y + 60, {illegalHandling: "collide"});
	/* right face */
	collisions.solids.line(this.x + 20, this.y, this.x, this.y + 60, {illegalHandling: "collide"});

	if(this.steppedOn) {
		this.timeShaking += 0.05;
	}
	if(this.timeShaking > 3) {
		this.timeShaking = 0;
		this.steppedOn = false;
		this.falling = true;
		this.allDone = true;
	}
	if(this.falling) {
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
	}
});
FallBlock.method("display", function() {
	var shakeX = Math.randomInRange(-this.timeShaking, this.timeShaking);
	var shakeY = Math.randomInRange(-this.timeShaking, this.timeShaking);
	graphics3D.polygon3D(
		"rgb(110, 110, 110)", "rgb(150, 150, 150)",
		0.9, 1.1,
		[
			{
				x: this.x + shakeX - 20,
				y: this.y + shakeY
			},
			{
				x: this.x + shakeX + 20,
				y: this.y + shakeY,
			},
			{
				x: this.x + shakeX,
				y: this.y + shakeY + 60
			}
		],
		{ obscuresLight: true }
	);
});
FallBlock.method("reset", function() {
	this.y = this.ORIGINAL_Y;
	this.velocity.y = 0;
	this.falling = false;
	this.allDone = false;
});
FallBlock.method("onRoomExit", function() {
	this.reset();
});
