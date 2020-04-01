function SkeletonArcher(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.aimRot = 0;
	this.aimDir = 1;
	this.timeSinceAttack = 0;
	this.timeAiming = 0;
	this.velocity.x = null;

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
	this.defLow = 0;
	this.defHigh = 20;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal archer";

	this.ARROW_SPEED = 5.7;
};
SkeletonArcher.extends(Enemy);
SkeletonArcher.method("display", function() {
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
			/* shoulders */
			c.strokeLine(
				self.x - 10, self.y + 15,
				self.x + 10, self.y + 15
			);
			/* right arm */
			if(self.facing === "right" && self.timeSinceAttack > 60) {
				c.save(); {
					c.translate(self.x + 8, self.y + 15);
					c.rotate(Math.rad(self.aimRot));
					c.strokeLine(0, 0, 10, 0);
					c.translate(10, 0);
					new WoodBow("none").display("aiming");
				} c.restore();
				self.timeAiming ++;
			}
			else {
				c.strokeLine(
					self.x + 8, self.y + 15,
					self.x + 8, self.y + 15 + 10
				);
			}
			/* left arm */
			if(self.facing === "left" && self.timeSinceAttack > 60) {
				c.save(); {
					c.translate(self.x - 8, self.y + 15);
					c.rotate(Math.rad(-self.aimRot));
					c.strokeLine(0, 0, -10, 0);

					c.translate(-10, 0);
					c.scale(-1, 1);
					new WoodBow("none").display("aiming");
				} c.restore();
				self.timeAiming ++;
			}
			else {
				c.strokeLine(
					self.x - 8, self.y + 15,
					self.x - 8, self.y + 15 + 10
				);
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
SkeletonArcher.method("update", function(dest) {
	this.facing = (this.x < p.x) ? "right" : "left";
	if(dest === "player") {
		this.legs += this.legDir;
		if(this.x < p.x) {
			/* moving towards p.x - 200 */
			if(this.x < p.x - 205 || this.x > p.x - 195) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		else {
			/* moving towards p.x + 200 */
			if(this.x < p.x + 195 || this.x > p.x + 205) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		/* movement */
		if(this.x > p.x) {
			this.x = (this.x < p.x + 195) ? this.x + 2 : this.x;
			this.x = (this.x > p.x + 205) ? this.x - 2 : this.x;
		}
		else {
			this.x = (this.x < p.x - 195) ? this.x + 2 : this.x;
			this.x = (this.x > p.x - 205) ? this.x - 2 : this.x;
		}
		this.canJump = false;
	}
	else {
		/* movement */
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.canJump = false;
	}
	this.velocity.y += 0.1;
	this.y += this.velocity.y;
});
SkeletonArcher.method("attack", function() {
	this.timeSinceAttack ++;
	if(this.timeSinceAttack > 60) {
		/* (timeSinceAttack > 60) ---> take out bow and begin aiming or shooting */
		var velocity = Math.rotate(this.ARROW_SPEED, 0, this.aimRot);
		if(this.x > p.x) {
			velocity.x *= -1;
		}
		var playerArrowIntersection = {
			x: p.x,
			y: this.simulateAttack(velocity)
		};
		if(playerArrowIntersection.y < p.y + p.hitbox.top) {
			/* aiming too high -> aim lower */
			this.aimRot ++;
			if(this.aimRot > 360 + 45 && this.timeAiming > 60) {
				/* too high, but already aiming as high as possible -> shoot arrow */
				this.shoot();
			}
		}
		else if(playerArrowIntersection.y > p.y + p.hitbox.bottom) {
			/* aiming too low - aim higher */
			this.aimRot --;
			if(this.aimRot < 360 - 45 && this.timeAiming > 60) {
				/* too low, but already aiming as low as possible -> shoot arrow */
				this.shoot();
			}
		}
		else if(this.timeAiming > 60) {
			/* aiming at player -> shoot arrow */
			this.shoot();
		}
	}
	this.aimRot = Math.constrain(this.aimRot, 360 - 45, 360 + 45);
});
SkeletonArcher.method("shoot", function() {
	/*
	This method (UNCONDITIONALLY) shoots an arrow according to how high the skeleton archer is aiming.
	*/
	var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
	var velocity = Math.rotate(5, 0, this.aimRot);
	if(this.x > p.x) {
		velocity.x *= -1;
	}
	var arrow = new ShotArrow(
		this.x + velocity.x / 2, this.y + velocity.y / 2,
		velocity.x, velocity.y,
		damage, "enemy", "none", "a skeletal archer"
	);
	game.dungeon[game.theRoom].content.push(arrow);
	this.timeSinceAttack = 0;
	this.timeAiming = 0;
});
SkeletonArcher.method("simulateAttack", function(arrowVelocity) {
	/*
	This function returns the y-value at which an arrow shot in the player's direction would be once it hit the player's x-value. (You can use this to determine if the SkeletonArcher is aiming at the right angle to hit the player.)
	*/
	var x = this.x;
	var y = this.y;
	if(this.x > p.x) {
		while(x > p.x) {
			x += arrowVelocity.x;
			y += arrowVelocity.y;
			arrowVelocity.y += 0.1;
		}
		return y;
	}
	else {
		while(x < p.x) {
			x += arrowVelocity.x;
			y += arrowVelocity.y;
			arrowVelocity.y += 0.1;
		}
		return y;
	}
});
SkeletonArcher.method("handleCollision", function(direction, collision) { });
