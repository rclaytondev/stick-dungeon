function MagicCharge(x, y, velX, velY, type, damage) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.type = type;
	this.damage = damage;
	this.particles = [];
	this.beingAimed = false;
	this.hitbox = new utils.geom.Rectangle({
		left: -20,
		right: 20,
		top: -20,
		bottom: 20
	});
	this.noTeleportCollisions = true;
};
MagicCharge.method("display", function() {
	/* graphics */
	this.particles.forEach(particle => { particle.display(); });
	this.particles = this.particles.filter(particle => particle.opacity > 0);
});
MagicCharge.method("update", function() {
	this.particles.forEach((particle) => { particle.update(); });
	/* collision with player */
	if(game.inRoom === game.theRoom && collisions.objectIntersectsObject(this, p) && (this.type === "shadow" || (this.type === "fire" && this.shotBy === "enemy"))) {
		var damage = Math.round(Math.randomInRange(40, 50));
		p.hurt(damage, (this.type === "shadow") ? "a wraith" : "a dragonling");
		this.toBeRemoved = true;
	}
	const COLORS = {
		"shadow": "rgb(0, 0, 0)",
		"energy": "hsl(" + (utils.frameCount % 360) + ", 100%, 50%)",
		"chaos": "rgb(" + (Math.randomInRange(0, 255)) + ", 0, 0)",
		"fire": "rgb(255, 128, 0)",
		"water": "rgb(0, 128, 255)",
		"earth": "rgb(0, 160, 0)",
		"air": "rgb(170, 170, 170)"
	};
	this.particles.push(new Particle(
		this.x, this.y,
		{
			color: COLORS[this.type],
			colorVariance: (this.type === "shadow") ? 0 : 50,
			brightnessVariance: (this.type === "shadow") ? 30 : 0,
			velocity: 1,
			size: 15,
			shape: "polygon-3",
			rotation: Math.randomInRange(0, 360),
			sizeDecay: 1/2
		}
	));
	/* movement */
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	/* collision with enemies + objects */
	if(this.shotBy !== "enemy") {
		game.dungeon[game.theRoom].getInstancesOf(Enemy).forEach(enemy => {
			if(collisions.objectIntersectsObject(this, enemy)) {
				this.toBeRemoved = true;
				enemy.hurt(this.damage);
				if(["fire", "water", "earth", "air"].includes(this.type)) {
					Weapon.applyElementalEffect(this.type, enemy, (this.velocity.x < 0) ? "left" : "right", { x: this.x, y: this.y }, true);
				}
				if(this.type === "chaos") {
					var hp = enemy.health;
					game.dungeon[game.theRoom].content[i] = new RandomEnemy(enemy.x, enemy.y + enemy.hitbox.bottom, enemy.constructor);
					game.dungeon[game.theRoom].content[i].generate();
					game.dungeon[game.theRoom].content[i].health = hp;
					if(game.dungeon[game.theRoom].content[i].health > game.dungeon[game.theRoom].content[i].maxHealth) {
						game.dungeon[game.theRoom].content[i].health = game.dungeon[game.theRoom].content[i].maxHealth;
					}
					game.dungeon[game.theRoom].content.splice(game.dungeon[game.theRoom].content.length - 1, 1);
					return;
				}
			}
		});
	}
});
MagicCharge.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
MagicCharge.method("handleCollision", function(direction, collision) {
	this.toBeRemoved = true;
	/* teleport player to position for chaos charges */
	if(this.type === "chaos" && !p.aiming) {
		p.x = this.x;
		p.y = this.y;
		for(var j = 0; j < collisions.length; j ++) {
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + 10 && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h) {
				p.x --;
			}
			while(p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.x + p.hitbox.right > collisions.collisions[i].x + collisions.collisions[i].w - 10 && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h) {
				p.x ++;
			}
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h && p.y + p.hitbox.bottom > collisions.collisions[i].y + collisions.collisions[i].h - 10) {
				p.y ++;
			}
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + 10) {
				p.y --;
			}
		}
	}
});
MagicCharge.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.particles.forEach(particle => {
		particle.x += x, particle.y += y;
	});
});
