function Troll(x, y) {
	Enemy.call(this, x, y);
	this.curveArray = Math.findPointsCircular(0, 0, 10);
	this.attackArmDir = 2;
	this.attackArm = 0;
	this.leg1 = -2;
	this.leg2 = 2;
	this.leg1Dir = -0.125;
	this.leg2Dir = 0.125;
	this.currentAction = "move";
	this.timeDoingAction = 0;
	this.facing = "right";

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -60,
		right: 60,
		top: -50,
		bottom: 60
	});

	/* stats */
	this.health = 150;
	this.maxHealth = 150;
	this.defLow = 50;
	this.defHigh = 70;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a troll";
};
Troll.extend(Enemy);
Troll.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.save(); {
				c.globalAlpha = Math.constrain(self.opacity, 0, 1);
				c.translate(self.x, self.y);
				c.scale(0.75, 0.75);
				/* rounded shoulders */
				c.fillStyle = "rgb(0, 128, 0)";
				c.fillCircle(0 - 50, 0 - 20, 10);
				c.fillCircle(0 + 50, 0 - 20, 10);
				c.fillCircle(0 - 20, 0 + 50, 10);
				c.fillCircle(0 + 20, 0 + 50, 10);
				/* body */
				c.fillRect(0 - 50, 0 - 30, 100, 30);
				c.fillPoly(
					-60, -20,
					60, -20,
					30, 50,
					-30, 50
				);
				c.fillRect(0 - 20, 0 + 10, 40, 50);
				/* legs */
				c.fillStyle = "rgb(30, 128, 30)";
				for(var scale = -1; scale <= 1; scale += 2) {
					c.save(); {
						if(scale === -1) {
							c.translate(3 * self.leg1, 7 * self.leg1);
						}
						else {
							c.translate(-3 * self.leg2, 7 * self.leg2);
						}
						c.scale(scale, 1);
						c.translate(-5, 0);
						c.fillCircle(45, 30, 5);
						c.fillCircle(30, 50, 5);
						c.fillCircle(60, 30, 5);
						c.fillCircle(60, 70, 5);
						c.fillCircle(30, 70, 5);
						c.fillRect(45, 25, 15, 10);
						c.fillRect(25, 50, 40, 20);
						c.fillRect(30, 70, 30, 5);
						c.fillRect(45, 30, 20, 30);
						c.fillPoly(
							40, 30,
							25, 30,
							25, 70,
							40, 70,
							50, 70,
							50, 30
						);
					} c.restore();
				}
				/* head */
				c.fillCircle(0, -40, 20);
			} c.restore();
			/* right arm */
			c.save(); {
				c.translate(self.x + 40, self.y - 10);
				if(self.armAttacking === "right") {
					c.rotate(Math.rad(self.attackArm));
				}
				else {
					c.rotate(Math.rad(60));
				}
				if(self.facing === "right" && self.currentAction === "melee-attack") {
					c.fillStyle = "rgb(139, 69, 19)";
					c.fillPoly(
						45, 0,
						50, -70,
						30, -70,
						35, 0
					);
					c.fillCircle(40, -70, 10);
				}
				c.fillStyle = "rgb(0, 128, 0)";
				c.fillCircle(0, -10, 5);
				c.fillCircle(0, 10, 5);
				c.fillCircle(50, -10, 5);
				c.fillCircle(50, 10, 5);
				c.fillRect(-5, -10, 60, 20);
				c.fillRect(0, -15, 50, 30);
			} c.restore();
			/* left arm */
			c.save(); {
				c.translate(self.x - 40, self.y - 10);
				if(self.armAttacking === "left") {
					c.rotate(Math.rad(-self.attackArm));
				}
				else {
					c.rotate(Math.rad(-60));
				}
				if(self.facing === "left" && self.currentAction === "melee-attack") {
					c.fillStyle = "rgb(139, 69, 19)";
					c.fillPoly(
						-45, 0,
						-50, -70,
						-30, -70,
						-35, 0
					);
					c.fillCircle(-40, -70, 10);
				}
				c.fillStyle = "rgb(0, 128, 0)";
				c.fillCircle(0, -10, 5);
				c.fillCircle(0, 10, 5);
				c.fillCircle(-50, -10, 5);
				c.fillCircle(-50, 10, 5);
				c.fillRect(-55, -10, 60, 20);
				c.fillRect(-50, -15, 50, 30);
			} c.restore();
		},
		1
	));
});
Troll.method("update", function(dest) {
	/* animations */
	this.leg1 += this.leg1Dir;
	this.leg2 += this.leg2Dir;
	if(this.currentAction === "move") {
		this.leg1Dir = (this.leg1 > 2) ? -0.2 : this.leg1Dir;
		this.leg1Dir = (this.leg1 < -2) ? 0.2 : this.leg1Dir;
		this.leg2Dir = (this.leg2 > 2) ? -0.2 : this.leg2Dir;
		this.leg2Dir = (this.leg2 < -2) ? 0.2 : this.leg2Dir;
	}
	else {
		this.leg1Dir = (this.leg1 < 0) ? 0.2 : this.leg1Dir;
		this.leg1Dir = (this.leg1 > 0) ? -0.2 : this.leg1Dir;
		this.leg2Dir = (this.leg2 < 0) ? 0.2 : this.leg2Dir;
		this.leg2Dir = (this.leg2 > 0) ? -0.2 : this.leg2Dir;
	}
	this.facing = (this.x < p.x) ? "right" : "left";
	/* movement */
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.attackArm += this.attackArmDir;
	if(dest !== "player") {
		this.currentAction = "move";
	}
	if(this.currentAction === "move") {
		if(dest === "player") {
			if(this.x < p.x) {
				this.velocity.x = (this.x < p.x - 100) ? 1 : this.velocity.x;
				this.velocity.x = (this.x > p.x - 100) ? -1 : this.velocity.x;
			}
			else {
				this.velocity.x = (this.x < p.x + 100) ? 1 : this.velocity.x;
				this.velocity.x = (this.x > p.x + 100) ? -1 : this.velocity.x;
			}
		}
		else {
			this.velocity.x = (this.x < dest.x) ? 1 : -1;
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			if(Math.dist(this.x, p.x) > 150) {
				this.currentAction = "ranged-attack";
			}
			else {
				this.currentAction = "melee-attack";
			}
			this.timeDoingAction = 0;
			this.attackArm = 55, this.attackArmDir = 0;
		}
	}
	else if(this.currentAction === "ranged-attack") {
		this.velocity.x = 0;
		this.walking = false;
		if(this.x < p.x) {
			this.armAttacking = "left";
		}
		else {
			this.armAttacking = "right";
		}
		if(this.attackArmDir === 0) {
			this.attackArmDir = -5;
		}
		if(this.attackArm < -45) {
			if(this.armAttacking === "left") {
				game.dungeon[game.theRoom].content.push(new Rock(this.x - 40 - 35, this.y - 10 - 35, 3, -4));
			}
			else {
				game.dungeon[game.theRoom].content.push(new Rock(this.x + 40 + 35, this.y - 10 - 35, -3, -4));
			}
			this.attackArmDir = 5;
		}
		if(this.attackArm >= 60) {
			this.attackArmDir = 0;
			this.currentAction = "move";
			this.timeDoingAction = 0;
			this.attackArmDir = 0;
		}
	}
	else if(this.currentAction === "melee-attack") {
		this.velocity.x = 0;
		this.attackArmDir = (this.attackArm > 80) ? -2 : this.attackArmDir;
		this.attackArmDir = (this.attackArm < 0) ? 2 : this.attackArmDir;
		this.attackArmDir = (this.attackArmDir === 0) ? -2 : this.attackArmDir;
		if(this.x < p.x) {
			this.armAttacking = "right";
		}
		else {
			this.armAttacking = "left";
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			this.timeDoingAction = 0;
			this.currentAction = "move";
			this.attackArm = 50, this.attackArmDir = 0;
		}
		for(var y = -70; y < 0; y += 10) {
			var weaponPos = Math.rotate(40, y, this.attackArm);
			if(this.armAttacking === "left") {
				weaponPos.x = -weaponPos.x;
			}
			weaponPos.x += this.x + (this.armAttacking === "right" ? 40 : -40);
			weaponPos.y += this.y - 10;
			if(game.inRoom === game.theRoom && collisions.objectIntersectsPoint(p, weaponPos) && this.attackRecharge < 0) {
				p.hurt(Math.floor(Math.randomInRange(40, 50)), "a troll");
				this.attackRecharge = 45;
			}
		}
	}
	collisions.solids.rect(this.x - 40, this.y - 20, 80, 60);
});
Troll.method("handleCollision", function(direction, collision) {

});
Troll.generationCriteria = function() {
	return game.dungeon[game.theRoom].getInstancesOf(Banner).length === 0;
};
