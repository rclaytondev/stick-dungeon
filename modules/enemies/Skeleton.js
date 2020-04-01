function Skeleton(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.damLow = 20;
	this.damHigh = 40;
	this.defLow = 20;
	this.defHigh = 40;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -13,
		right: 13,
		top: -8,
		bottom: 43
	});
	this.name = "a skeleton";
};
Skeleton.extends(Enemy);
Skeleton.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.lineWidth = 2;
			/* head */
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.fillCircle(self.x, self.y + 3, 7);
			c.fillRect(self.x - 3, self.y + 3, 6, 10);
			/* body */
			c.strokeLine(self.x, self.y, self.x, self.y + 36);
			/* legs */
			c.strokeLine(
				self.x, self.y + 36,
				self.x + self.legs, self.y + 36 + 7
			);
			c.strokeLine(
				self.x, self.y + 36,
				self.x - self.legs, self.y + 36 + 7
			);
			self.legs += self.legDir;
			self.legDir = (self.legs < -7) ? 0.5 : self.legDir;
			self.legDir = (self.legs > 7) ? -0.5 : self.legDir;
			/* arms */
			c.strokeLine(
				self.x     , self.y + 15,
				self.x + 10, self.y + 15
			);
			c.strokeLine(
				self.x + 8, self.y + 15,
				self.x + 8, self.y + 15 + 10
			);
			c.strokeLine(
				self.x     , self.y + 15,
				self.x - 10, self.y + 15
			);
			c.strokeLine(
				self.x - 8, self.y + 15,
				self.x - 8, self.y + 15 + 10
			);
			/* ribcage */
			for(var y = self.y + 22; y < self.y + 34; y += 4) {
				c.strokeLine(self.x - 5, y, self.x + 5, y);
			}
		},
		1
	));
});
Skeleton.method("update", function(dest) {
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.velocity.x *= 0.96;
	if(dest === "player") {
		this.velocity.x += (this.x < p.x) ? 0.1 : 0;
		this.velocity.x -= (this.x > p.x) ? 0.1 : 0;
		if(Math.random() <= 0.02 && this.canJump) {
			this.velocity.y = Math.randomInRange(-2, -5);
		}
		this.canJump = false;
	}
	else {
		this.velocity.x = (this.x < dest.x) ? this.velocity.x + 0.1 : this.velocity.x;
		this.velocity.x = (this.x > dest.x) ? this.velocity.x - 0.1 : this.velocity.x;
		this.canJump = false;
	}
});
Skeleton.method("handleCollision", function(direction, platform) {
	if(direction === "floor") {
		this.canJump = true;
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.abs(this.velocity.x);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = -Math.abs(this.velocity.x);
	}
});
