function Enemy(x, y) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 0 };
	this.visualHealth = 60;
	this.attackRecharge = 45;
	this.opacity = 1;
	this.dead = false;
	this.fadingIn = false;
	this.particles = [];
	this.timeFrozen = 0;
	this.timeBurning = 0;
};
Enemy.method("hurt", function(amount, ignoreDef) {
	var def = Math.round(Math.randomInRange(this.defLow, this.defHigh));
	if(!ignoreDef) {
		amount -= def;
	}
	amount = (amount < 0) ? 0 : amount;
	this.health -= amount;
});
Enemy.method("displayStats", function() {
	/* healthbar */
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.globalAlpha = Math.max(0, self.opacity);
			var middle = ((self.x + self.hitbox.right) + (self.x + self.hitbox.left)) / 2;
			if(self instanceof Dragonling) {
				middle = self.x;
			}
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(middle - 30, self.y + self.hitbox.top - 15, 60, 10);
			c.fillCircle(middle - 30, self.y + self.hitbox.top - 10, 5);
			c.fillCircle(middle + 30, self.y + self.hitbox.top - 10, 5);
			c.fillStyle = "rgb(255, 0, 0)";
			c.fillRect(middle - 30, self.y + self.hitbox.top - 15, self.visualHealth, 10);
			c.fillCircle(middle - 30, self.y + self.hitbox.top - 10, 5);
			c.fillCircle(middle - 30 + self.visualHealth, self.y + self.hitbox.top - 10, 5);
		},
		1
	));
});
Enemy.method("update", function() {
	var self = this;
	if(game.inRoom === game.theRoom) {
		this.seesPlayer = true;
	}
	if(!this.fadingIn && this.timeFrozen <= 0) {
		if(game.inRoom === game.theRoom) {
			this.update("player");
		}
		else {
			game.calculatePaths();
			game.dungeon[game.theRoom].content.filter((obj) => (obj instanceof Door)).forEach((door) => {
				var destinationRoom = door.getDestinationRoom();
				if(destinationRoom !== null && destinationRoom.pathScore < game.dungeon[game.theRoom].pathScore) {
					this.update({ x: door.x, y: door.y });
					if(door.isEnemyNear(this) && !door.barricaded) {
						door.enter(this);
					}
				}
			});
		}
	}
	/* Collisions with other enemies */
	collisions.solids.rect(
		this.x + this.hitbox.left, this.y + this.hitbox.top, this.hitbox.width, this.hitbox.height,
		{
			collisionCriteria: (obj) => (obj instanceof Enemy),
			onCollision: (obj, direction) => {
				if(direction === "floor") {
					/* the bottom of that enemy collided with the top of this enemy */
					obj.velocity.y = -4;
				}
				else if(direction === "wall-to-right") {
					/* the right side of that enemy collided with the left side of this enemy */
					this.velocity.x = 3;
					obj.velocity.x = -3;
				}
				else if(direction === "wall-to-left") {
					/* the left side of that enemy collided with the right side of this enemy */
					this.velocity.x = -3;
					obj.velocity.x = 3;
				}
			},
			noPositionLimits: true,
			creator: this
		}
	);
	/* update effects */
	this.timeFrozen --;
	this.timeBurning --;
	if(this.timeFrozen > 0) {
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
	}
	if(this.timeBurning > 0) {
		this.particles.push(new Particle(
			Math.randomInRange(this.hitbox.left, this.hitbox.right),
			Math.randomInRange(this.hitbox.top, this.hitbox.bottom),
			{
				color: "rgb(255, 128, 0)",
				velocity: {
					x: Math.randomInRange(-2, 2),
					y: Math.randomInRange(-3, 1)
				},
				size: Math.randomInRange(3, 5)
			}
		));
		this.timeBurning --;
		if(this.timeBurning % 60 === 0) {
			this.health -= this.burnDmg;
		}
	}
	if(!(this instanceof Wraith)) {
		this.particles.forEach((particle) => { particle.update(); });
	}
	/* basic enemy attack (dealing damage to the player on intersection) */
	this.attackRecharge --;
	if(game.inRoom === game.theRoom && collisions.objectIntersectsObject(this, p) && this.attackRecharge < 0 && !this.complexAttack) {
		this.attackRecharge = 45;
		var damage = Math.randomInRange(this.damLow, this.damHigh);
		p.hurt(damage, this.name);
	}
	/* other enemy attacks */
	if(typeof this.attack === "function" && this.timeFrozen < 0) {
		this.attack();
	}
	/* health bar updating + dying */
	this.health = Math.constrain(this.health, 0, this.maxHealth);
	if(this.health <= 0 && !this.dead) {
		this.dead = true;
		p.enemiesKilled ++;
	}
	var visualHealth = this.health / this.maxHealth * 60;
	this.visualHealth += (visualHealth - this.visualHealth) / 10;
	/* fading transitions */
	if(this.dead) {
		this.opacity -= 1/20;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
	else if(this.fadingIn) {
		this.opacity += 1/20;
	}
	if(this.opacity >= 1) {
		this.fadingIn = false;
	}
	this.opacity = Math.constrain(this.opacity, 0, 1);
	/* velocity cap */
	this.velocity.x = Math.constrain(this.velocity.x, -3, 3);
	this.velocity.y = Math.constrain(this.velocity.y, -3, 3);
});
Enemy.method("display", function() {
	this.displayStats();
	this.display(); // NOT recursive. this calls the child's method "display".
	if(this.timeFrozen > 0) {
		/* display ice cube for frozen enemies */
		graphics3D.cube(this.x + this.hitbox.left, this.y + this.hitbox.top, this.hitbox.width, this.hitbox.height, 0.95, 1.05, "rgba(0, 128, 200, 0.5)", "rgba(0, 128, 200, 0.5)");
	}
	if(!(this instanceof Wraith)) {
		/* display fire particles for burning enemies. (This is done even if the enemy isn't burning because there could still be particles left over from when they were burning.) */
		var self = this;
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				self.particles.forEach((particle) => {
					game.dungeon[game.theRoom].displayImmediately(function() {
						particle.x += self.x, particle.y += self.y;
						particle.display();
						particle.x -= self.x, particle.y -= self.y;
					});
				});
			},
			1
		))
		this.particles = this.particles.filter((particle) => (!particle.toBeRemoved));
	}
});
