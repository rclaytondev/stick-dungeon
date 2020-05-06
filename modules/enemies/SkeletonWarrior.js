function SkeletonWarrior(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.attackArm = 315;
	this.attackArmDir = 3;
	this.canHit = true;
	this.timeSinceAttack = 0;
	this.facing = "right";

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -13,
		right: 13,
		top: -8,
		bottom: 43
	});

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 40;
	this.defHigh = 60;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal warrior";
};
SkeletonWarrior.extend(Enemy);
SkeletonWarrior.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.globalAlpha = Math.constrain(self.opacity, 0, 1);
			c.lineWidth = 2;
			/* head */
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.fillCircle(self.x, self.y + 3, 7);
			c.fillRect(self.x - 3, self.y + 3, 6, 10);
			/* body */
			c.strokeLine(
				self.x, self.y,
				self.x, self.y + 36
			);
			/* legs */
			c.strokeLine(
				self.x            , self.y + 36,
				self.x + self.legs, self.y + 36 + 7
			);
			c.strokeLine(
				self.x            , self.y + 36,
				self.x - self.legs, self.y + 36 + 7
			);
			self.legs += self.legDir;
			self.legDir = (self.legs < -7) ? 0.5 : self.legDir;
			self.legDir = (self.legs > 7) ? -0.5 : self.legDir;
			/* arms */
			if(self.facing === "left") {
				/* right arm (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x + 10, self.y + 15
				);
				c.strokeLine(
					self.x + 8, self.y + 15,
					self.x + 8, self.y + 15 + 10
				);
				/* left shoulder (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x - 10, self.y + 15
				);
				/* left arm (attacking) */
				c.save(); {
					c.translate(self.x - 8, self.y + 15);
					c.rotate(Math.rad(self.attackArm));
					c.strokeLine(0, 0, -10, 0);
					/* sword */
					c.translate(-10, 0);
					new Sword("none").display("attacking");
				} c.restore();
			}
			else {
				/* left arm (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x - 10, self.y + 15
				);
				c.strokeLine(
					self.x - 8, self.y + 15,
					self.x - 8, self.y + 15 + 10
				);
				/* right shoulder (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x + 10, self.y + 15
				);
				/* right arm (attacking) */
				c.save(); {
					c.translate(self.x + 8, self.y + 15);
					c.rotate(Math.rad(-self.attackArm));
					c.strokeLine(0, 0, 10, 0);
					/* sword */
					c.translate(10, 0);
					new Sword("none").display("attacking");
				} c.restore();
			}
			/* ribcage */
			for(var y = self.y + 22; y < self.y + 34; y += 4) {
				c.strokeLine(
					self.x - 5, y,
					self.x + 5, y
				);
			}
		},
		1
	));
});
SkeletonWarrior.method("update", function(dest) {
	if(dest === "player") {
		this.facing = (this.x < p.x) ? "right" : "left";
		/* movement */
		if(this.x < p.x) {
			this.velocity.x = (this.x < p.x - 60) ? this.velocity.x + 0.1 : this.velocity.x;
			this.velocity.x = (this.x > p.x - 60) ? this.velocity.x - 0.1 : this.velocity.x;
		}
		else {
			this.velocity.x = (this.x < p.x + 60) ? this.velocity.x + 0.1 : this.velocity.x;
			this.velocity.x = (this.x > p.x + 60) ? this.velocity.x - 0.1 : this.velocity.x;
		}
		if(this.canJump) {
			this.velocity.y = -3;
		}
		this.canJump = false;
	}
	else {
		/* movement */
		this.velocity.x = (this.x < dest.x) ? this.velocity.x + 0.1 : this.velocity.x;
		this.velocity.x = (this.x > dest.x) ? this.velocity.x - 0.1 : this.velocity.x;
		this.canJump = false;
	}
	this.velocity.x *= 0.96;
	this.velocity.y += 0.1;
	this.x += this.velocity.x;
	this.y += this.velocity.y;
});
SkeletonWarrior.method("attack", function() {
	/* attack */
	this.attackArm += this.attackArmDir;
	this.canHit = ((this.attackArm > 360 || this.attackArm < 270) && this.timeSinceAttack > 15) ? true : this.canHit;
	this.timeSinceAttack ++;
	this.attackArmDir = (this.attackArm > 360) ? -3 : this.attackArmDir;
	this.attackArmDir = (this.attackArm < 270) ? 3 : this.attackArmDir;
	if(this.x < p.x) {
		var swordEnd = Math.rotate(10, -60, -this.attackArm);
		swordEnd.x += this.x + 8;
		swordEnd.y += this.y + 15;
		if(game.inRoom === game.theRoom && collisions.objectIntersectsPoint(p, swordEnd) && this.canHit) {
			var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
	else {
		var swordEnd = Math.rotate(-10, -60, this.attackArm);
		swordEnd.x += this.x - 8;
		swordEnd.y += this.y + 15;
		if(game.inRoom === game.theRoom && collisions.objectIntersectsPoint(p, swordEnd) && this.canHit) {
			var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
});
SkeletonWarrior.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.canJump = true;
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
});
