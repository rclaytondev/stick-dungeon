function Player() {
	/* Location */
	this.x = 500;
	this.y = 300;
	this.hitbox = new utils.geom.Rectangle({
		left: -5,
		right: 5,
		top: -7,
		bottom: 46
	});
	/* Animation */
	this.legs = 5;
	this.legDir = 1;
	this.enteringDoor = false;
	this.op = 1;
	this.fallDmg = 0;
	this.healthBarAnimation = 0;
	this.manaBarAnimation = 0;
	/* Health, mana, etc... bars */
	this.health = 100;
	this.maxHealth = 100;
	this.visualHealth = 1;
	this.mana = 100;
	this.maxMana = 100;
	this.visualMana = 1;
	this.gold = 0;
	this.maxGold = 1;
	this.visualGold = 0;
	/* Movement */
	this.canJump = false;
	this.velocity = { x: 0, y: 0 };
	/* Items + GUI */
	this.invSlots = [];
	this.guiOpen = "none";
	this.activeSlot = 0;
	this.openCooldown = 0;
	/* Attacking */
	this.facing = "right";
	this.attacking = false;
	this.attackArm = 0;
	this.attackArmDir = null;
	this.canHit = true;
	this.shootReload = 0;
	this.aimRot = null;
	this.aiming = false;
	this.numHeals = 0;
	this.attackSpeed = 5;
	this.canStopAttacking = true;
	this.class = "warrior";
	/* Properties used by other objects */
	this.healthAltarsFound = 0;
	this.manaAltarsFound = 0;
	this.openingBefore = false;
	this.terminateProb = 0;
	this.doorType = "arch";
	/* Scoring + Permanent Values */
	this.roomsExplored = 0;
	this.enemiesKilled = 0;
	this.deathCause = null;
	this.dead = false;
	this.power = 0;
	this.scores = [
		{ coins: 15, rooms: 150, kills: 7, class: "mage"},
		{ coins: 6, rooms: 5, kills: 1, class: "archer"},
		{ coins: 20, rooms: 1000, kills: 60, class: "warrior"}
	]; // example scores for testing
	this.scores = [];
	/* initialization of other properties */
	this.init();
};
Player.method("init", function() {
	/*
	This function initalizes the player's item slots.
	*/
	/* Slots for items held */
	for(var x = 0; x < 3; x ++) {
		this.invSlots.push({x: x * 80 - 35 + 55, y: 20, content: "empty", type: "holding"});
	}
	/* Slots for items owned */
	for(var y = 0; y < 3; y ++) {
		for(var x = 0; x < 5; x ++) {
			this.invSlots.push({x: x * 80 - 35 + 240, y: y * 80 - 35 + 250, content: "empty", type: "storage"});
		}
	}
	/* Slots for items worn */
	for(var x = 0; x < 2; x ++) {
		this.invSlots.push({x: x * 80 + 630, y: 20, content: "empty", type: "equip"});
	}
});
Player.method("sideScroll", function() {
	/* Updates the world's position, keeping the player at the screen center. */
	game.camera.x = this.x;
	game.camera.y = this.y;
});
Player.method("display", function(straightArm) {
	/*
	Draws the player. (Parameters are only for custom stick figures on class selection screen.)
	*/
	this.op = (this.op < 0) ? 0 : this.op;
	this.op = (this.op > 1) ? 1 : this.op;
	c.lineWidth = 5;
	c.lineCap = "round";
	/* head */
	c.globalAlpha = this.op;
	c.fillStyle = "rgb(0, 0, 0)";
	c.save(); {
		c.translate(this.x, this.y);
		c.scale(1, 1.2);
		c.fillCircle(0, 12, 10);
	} c.restore();
	/* Body */
	c.strokeStyle = "rgb(0, 0, 0)";
	c.strokeLine(this.x, this.y + 12, this.x, this.y + 36);
	/* Legs */
	c.strokeLine(this.x, this.y + 36, this.x - this.legs, this.y + 46);
	c.strokeLine(this.x, this.y + 36, this.x + this.legs, this.y + 46);
	/* Leg Animations */
	if(io.keys.ArrowLeft || io.keys.ArrowRight) {
		this.legs += this.legDir;
		if(this.legs >= 5) {
			this.legDir = -0.5;
		}
		else if(this.legs <= -5) {
			this.legDir = 0.5;
		}
	}
	if(!io.keys.ArrowLeft && !io.keys.ArrowRight) {
		this.legDir = (this.legs < 0) ? -0.5 : 0.5;
		this.legDir = (this.legs >= 5 || this.legs <= -5) ? 0 : this.legDir;
		this.legs += this.legDir;
	}
	/* Standard Arms (no item held) */
	if(((!this.attacking && !this.aiming) || this.facing === "left") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.strokeLine(
			this.x,
			this.y + 26,
			this.x + (straightArm ? 15 : 10),
			this.y + (straightArm ? 16 : 36)
		);
	}
	if(((!this.attacking && !this.aiming) || this.facing === "right") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.strokeLine(this.x, this.y + 26, this.x - 10, this.y + 36);
	}
	/* Attacking Arms (holding a standard weapon like sword, dagger) */
	if(this.attacking && this.facing === "left" && !(this.attackingWith instanceof Spear)) {
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.rotate(Math.rad(-this.attackArm));
			c.strokeLine(0, 0, -10, 0)/
			c.translate(-10, 2);
			this.attackingWith.display("attacking");
		} c.restore();
		if(this.attackArm > 75) {
			this.attackArmDir = -this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm < 0) {
			this.attackArmDir = this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	if(this.attacking && this.facing === "right" && !(this.attackingWith instanceof Spear)) {
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.rotate(Math.rad(this.attackArm));
			c.strokeLine(0, 0, 10, 0);
			c.translate(10, 2);
			this.attackingWith.display("attacking");
		} c.restore();
		if(this.attackArm > 75) {
			this.attackArmDir = -this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm < 0) {
			this.attackArmDir = this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	/* Arms when holding a Spear*/
	if(this.attacking && this.facing === "left" && this.attackingWith instanceof Spear) {
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(0, 0, -10, 10);
		} c.restore();

		c.save(); {
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(Math.rad(-90));
			this.attackingWith.display("attacking");
		} c.restore();

		c.lineJoin = "round";
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(-10, 10, this.attackArm, 5);
			c.strokePoly(
				{ x: 0, y: 0 },
				{ x: 10, y: -5 },
				{ x: this.attackArm + 15, y: 5 }
			);
		} c.restore();
		if(this.attackArm < -20) {
			this.attackArmDir = 1 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 0) {
			this.attackArmDir = -4 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	if(this.attacking && this.facing === "right" && this.attackingWith instanceof Spear) {
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(0, 0, 10, 10);
		} c.restore();

		c.save(); {
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(Math.rad(90));
			this.attackingWith.display("attacking");
		} c.restore();

		c.lineJoin = "round";
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(10, 10, this.attackArm, 5);
			c.strokeLine(
				{ x: 0, y: 0 },
				{ x: -10, y: -5 },
				{ x: this.attackArm - 15, y: 5 }
			);
		} c.restore();
		if(this.attackArm < 0) {
			this.attackArmDir = 4 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 20) {
			this.attackArmDir = -1 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	/* Status Bars */
	if(game.onScreen === "play") {
		const HEALTH_BAR_ANIMATION_SPEED = 1/20;
		this.healthBarAnimation -= HEALTH_BAR_ANIMATION_SPEED;
		this.manaBarAnimation -= HEALTH_BAR_ANIMATION_SPEED;

		c.textAlign = "center";
		c.globalAlpha = 1;
		/* Health */
		this.displayHealthBar(550, 12.5, "Health", this.health, this.maxHealth, "rgb(255, 0, 0)", this.visualHealth, "rgb(255, 128, 0)", this.healthBarAnimation);
		this.visualHealth += ((this.health / this.maxHealth) - this.visualHealth) / 10;
		/* Mana */
		this.displayHealthBar(550, 50, "Mana", this.mana, this.maxMana, "rgb(20, 20, 255)", this.visualMana, "rgb(20, 200, 255)", this.manaBarAnimation);
		this.visualMana += ((this.mana / this.maxMana) - this.visualMana) / 10;
		/* gold bar */
		this.displayHealthBar(550, 87.5, "Gold", this.gold, Infinity, "rgb(255, 255, 0)", this.visualGold);
		this.visualGold += ((this.gold / this.maxGold) - this.visualGold) / 10;
	}
	/* Arms when aiming a Ranged Weapon */
	if(this.aiming && this.facing === "right") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save(); {
				c.translate(this.x, this.y + 26);
				c.rotate(Math.rad(this.aimRot));
				c.strokeLine(0, 0, 10, 0);
				c.translate(10, 0);
				this.attackingWith.display("aiming");
			} c.restore();
		}
		else {
			c.save(); {
				c.strokeLine(this.x, this.y + 26, this.x + 13, this.y + 26);
				c.translate(this.x + 14, this.y + 16);
				this.attackingWith.display("attacking");
			} c.restore();
		}
	}
	if(this.aiming && this.facing === "left") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save(); {
				c.translate(this.x, this.y + 26);
				c.rotate(-Math.rad(this.aimRot));
				c.strokeLine(0, 0, -10, 0);
				c.translate(-10, 0);
				c.scale(-1, 1);
				this.attackingWith.display("aiming");
			} c.restore();
		}
		else {
			c.save(); {
				c.strokeLine(this.x, this.y + 26, this.x - 13, this.y + 26);
				c.translate(this.x, this.y + 16);
				c.scale(-1, 1); //mirror the item graphic
				c.translate(14, 0);
				this.attackingWith.display("attacking");
			} c.restore();
		}
	}
	c.lineCap = "butt";
	c.globalAlpha = 1;
});
Player.method("displayHealthBar", function(x, y, txt, num, max, col, percentFull, animationColor, animationRatio) {
	/*
	Displays a health bar w/ top left at ('x', 'y') and color 'col'. Labeled as 'txt: num / max'.

	`animationColor` and `animationRatio` are used to display the health bar flashing animations. `animationColor` is the color that the health bar should flash in, `animationRatio` (between 0 and 1) is how much the color should be close to the special animation color.
	*/
	/* Health Bar (gray background) */
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillRect(x, y, 225, 25);
	/* Rounded Corners (gray background) */
	c.fillCircle(x, y + 12, 12);
	c.fillCircle(x + 225, y + 12, 12);
	/* Health Bar (colored part) */
	var color = (typeof animationColor === "string") ? utils.color.mix(col, animationColor, animationRatio) : col;
	c.fillStyle = color;
	c.fillRect(x, y, percentFull * 225, 25);
	/* Rounded Corners (colored part) */
	c.fillCircle(x, y + 12, 12);
	c.fillCircle(x + (percentFull * 225), y + 12, 12);
	/* Text */
	c.fillStyle = "rgb(100, 100, 100)";
	c.textAlign = "center";
	c.font = "bold 10pt monospace";
	c.fillText(txt + ": " + num + ((max === Infinity) ? "" : (" / " + max)), x + 112, y + 15);
});
Player.method("displayHitbox", function() {
	/*
	Adds the player's hitbox to the debugging hitbox array.
	*/
	if(debugging.settings.DEBUGGING_MODE && debugging.settings.SHOW_HITBOXES) {
		debugging.hitboxes.push({
			color: "green",
			x: p.x + p.hitbox.left,
			y: p.y + p.hitbox.top,
			w: p.hitbox.w,
			h: p.hitbox.h
		});
	}
});
Player.method("update", function() {
	/*
	This function does all of the key management for the player, as well as movement, attacking, and other things.
	*/
	io.keys = this.enteringDoor ? [] : io.keys;
	/* Change selected slots when number keys are pressed */
	if(this.guiOpen !== "crystal-infusion" && !this.attacking) {
		if(io.keys.Digit1) {
			this.activeSlot = 0;
		}
		else if(io.keys.Digit2) {
			this.activeSlot = 1;
		}
		else if(io.keys.Digit3) {
			this.activeSlot = 2;
		}
	}
	/* Movement + Jumping */
	if(this.guiOpen === "none") {
		if(io.keys.ArrowLeft) {
			this.velocity.x -= 0.1;
		}
		else if(io.keys.ArrowRight) {
			this.velocity.x += 0.1;
		}
	}
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	if(io.keys.ArrowUp && this.canJump && !this.aiming) {
		this.velocity.y = -10;
	}
	/* Velocity Cap */
	if(this.velocity.x > 4) {
		this.velocity.x = 4;
	}
	else if(this.velocity.x < -4) {
		this.velocity.x = -4;
	}
	/* Friction + Gravity */
	if(!io.keys.ArrowLeft && !io.keys.ArrowRight) {
		this.velocity.x *= 0.93;
	}
	if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon && !(this.invSlots[this.activeSlot].content instanceof Dagger) && this.class !== "warrior") {
		this.velocity.x *= 0.965; // non-warriors walk slower when holding a melee weapon
	}
	this.velocity.y += 0.3;
	/* Screen Transitions */
	if(this.enteringDoor) {
		this.op -= 0.05;
		if(this.op <= 0) {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
		}
	}
	if(this.exitingDoor) {
		this.op += 0.05;
		if(this.op >= 1) {
			this.exitingDoor = false;
		}
	}
	this.op = Math.constrain(this.op, 0, 1);
	/* Attacking + Item Use */
	this.useItem();
	/* Update Health Bars */
	if(this.health >= this.maxHealth) {
		this.numHeals = 0;
	}
	var healthRegen = this.calculateStat("healthRegen") / 100; // `healthRegen` variable is a decimal representing the increase (e.g. 0.15 for 115%)
	if(this.numHeals > 0 && utils.frameCount % Math.floor(18 * (1 - healthRegen)) === 0) {
		this.health ++;
		this.numHeals -= 0.1 * (1 - healthRegen);
	}
	this.invSlots.forEach(invSlot => {
		if(invSlot.type === "equip" && invSlot.content instanceof WizardHat) {
			this.manaRegen -= invSlot.content.manaRegen * 0.01;
		}
	});
	var manaRegen = this.calculateStat("manaRegen") / 100; // `manaRegen` variable is a decimal representing the increase (e.g. 0.15 for 115%)
	if(utils.frameCount % Math.floor(18 * (1 - this.manaRegen)) === 0 && this.mana < this.maxMana) {
		this.mana ++;
	}
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content instanceof Coin) {
			this.gold = this.invSlots[i].content.quantity;
			break;
		}
	}
	this.maxGold = Math.max(this.maxGold, this.gold);
	if(this.dead) {
		this.op -= 0.05;
		if(this.op <= 0 && game.transitions.dir !== "out") {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
			game.transitions.nextScreen = "dead";
			this.scores.push({
				coins: this.gold,
				rooms: this.roomsExplored,
				kills: this.enemiesKilled,
				class: this.class
			});
			this.saveScores();
		}
	}
	this.health = Math.constrain(this.health, 0, this.maxHealth);

	this.sideScroll();
	/* Arm Movement */
	this.attackArm += this.attackArmDir;
	if(!this.attacking) {
		this.attackArm = null;
	}

	if(this.aiming && this.attackingWith instanceof MagicWeapon) {
		var charge = game.dungeon[game.inRoom].getInstancesOf(MagicCharge).find(charge => charge.beingAimed);
		if(charge !== undefined) {
			charge.x = this.x + this.chargeLoc.x;
			charge.y = this.y + this.chargeLoc.y;
		}
	}
});
Player.method("useItem", function() {
	/* Update facing direction */
	this.facing = io.keys.ArrowRight ? "right" : this.facing;
	this.facing = io.keys.ArrowLeft ? "left" : this.facing;
	if(this.canStopAttacking) {
		this.attacking = false;
	}
	this.aiming = false;
	if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon) {
		if(this.invSlots[this.activeSlot].content.attackSpeed === "fast") {
			this.attackSpeed = 7;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "normal") {
			this.attackSpeed = 5;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "slow") {
			this.attackSpeed = 3;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "very slow") {
			this.attackSpeed = 1;
		}
	}
	/* Begin Attacking + Use Non-weapon Items */
	if(io.keys.KeyA && this.invSlots[this.activeSlot].content !== "empty") {
		if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon) {
			this.invSlots[this.activeSlot].content.attack();
			this.attacking = true;
			if(this.attackArm === null) {
				this.attackArm = 0;
				this.attackArmDir = this.attackSpeed;
				if(this.attackingWith instanceof Spear) {
					this.attackArmDir = 4 * (this.attackSpeed / 5);
				}
			}
		}
		else if((this.invSlots[this.activeSlot].content instanceof RangedWeapon || this.invSlots[this.activeSlot].content instanceof MagicWeapon) && !(this.invSlots[this.activeSlot].content instanceof Arrow)) {
			if(this.aimRot === null) {
				this.aimRot = 0;
				this.attackingWith = this.invSlots[this.activeSlot].content;
				if(this.attackingWith instanceof MagicWeapon && (this.mana >= this.attackingWith.manaCost || this.attackingWith instanceof ChaosStaff) && !(this.attackingWith instanceof ElementalStaff && this.attackingWith.element === "none")) {
					var damage = Math.round(Math.randomInRange(this.invSlots[this.activeSlot].content.damLow, this.invSlots[this.activeSlot].content.damHigh));
					if(this.facing === "right") {
						game.dungeon[game.inRoom].content.push(new MagicCharge(this.x + 50, this.y, 0, 0, this.attackingWith.chargeType, damage));
						game.dungeon[game.inRoom].content.lastItem().beingAimed = true;
					}
					else {
						game.dungeon[game.inRoom].content.push(new MagicCharge(this.x - 50, this.y, 0, 0, this.attackingWith.chargeType, damage));
						game.dungeon[game.inRoom].content.lastItem().beingAimed = true;
					}
					if(this.attackingWith instanceof ChaosStaff) {
						this.hurt(this.attackingWith.hpCost, "meddling with arcane magic", true);
					}
					else {
						this.mana -= this.attackingWith.manaCost;
					}
					this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
				}
			}
			this.aiming = true;
		}
		else if(this.invSlots[this.activeSlot].content instanceof Equipable) {
			for(var i = 0; i < this.invSlots.length; i ++) {
				var slot = this.invSlots[i];
				if(slot.type === "equip" && slot.content === "empty") {
					slot.content = this.invSlots[this.activeSlot].content.clone();
					this.invSlots[this.activeSlot].content = "empty";
					break;
				}
			}
		}
		else if(typeof this.invSlots[this.activeSlot].content.use === "function") {
			this.invSlots[this.activeSlot].content.use();
		}
	}
	/* Melee Weapon Attacking */
	if(this.attacking) {
		if(this.attackingWith instanceof MeleeWeapon) {
			/* calculate weapon tip position */
			if(this.attackingWith instanceof Spear) {
				var weaponPos = {
					x: (this.facing === "right") ? this.attackArm + 45 : this.attackArm - 45,
					y: 5
				}
			}
			else {
				var weaponPos = Math.rotate(10, -this.attackingWith.range, this.attackArm);
			}
			if(this.facing === "left" && !(this.attackingWith instanceof Spear)) {
				weaponPos.x = -weaponPos.x;
			}
			weaponPos.x += this.x;
			weaponPos.y += this.y + 26 - this.velocity.y;
			if(debugging.settings.DEBUGGING_MODE && debugging.settings.SHOW_HITBOXES) {
				c.fillStyle = "rgb(0, 255, 0)";
				c.fillRect(weaponPos.x - 3, weaponPos.y - 3, 6, 6);
			}
			/* check enemies to see if weapon hits any */
			game.dungeon[game.inRoom].getInstancesOf(Enemy).forEach(enemy => {
				if(collisions.objectIntersectsPoint(enemy, weaponPos) && this.canHit) {
					/* hurt enemy that was hit by the weapon */
					var damage = Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh);
					enemy.hurt(damage);
					if(["fire", "water", "earth", "air"].includes(this.attackingWith.element)) {
						Weapon.applyElementalEffect(this.attackingWith.element, enemy, this.facing, weaponPos);
					}
					/* reset variables for weapon swinging */
					this.canHit = false;
					this.attackArmDir = -this.attackArmDir;
					this.timeSinceAttack = 0;
				}
			});
		}
	}
	if(!this.attacking && this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
		this.canHit = true;
	}
	this.timeSinceAttack ++;
	/* Change angle for aiming */
	if(this.aiming && io.keys.ArrowUp && this.aimRot > -45) {
		if((this.attackingWith instanceof RangedWeapon && this.class !== "archer") || (this.attackingWith instanceof MagicWeapon && this.class !== "mage")) {
			this.aimRot += 1.5; // slow down movement if you're not using the right class weapon
		}
		this.aimRot -= 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot -= 2;
			this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	if(this.aiming && io.keys.ArrowDown && this.aimRot < 45) {
		if((this.attackingWith instanceof RangedWeapon && this.class !== "archer") || (this.attackingWith instanceof MagicWeapon && this.class !== "mage")) {
			this.aimRot -= 1.5; // slow down movement if you're using the wrong class weapon
		}
		this.aimRot += 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot += 2;
			this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	/* Launch projectile when A is released */
	if(!this.aiming && this.aimingBefore && this.shootReload < 0 && !(this.attackingWith instanceof MechBow) && ((this.invSlots[this.activeSlot].content instanceof RangedWeapon && !(this.invSlots[this.activeSlot].content instanceof Arrow)) || this.attackingWith instanceof MagicWeapon)) {
		if(this.attackingWith instanceof RangedWeapon && this.hasInInventory(Arrow)) {
			this.shootReload = this.attackingWith.reload * FPS;
			var damage = Math.round(Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh));
			var speed = {
				"medium": 5,
				"long": 5.7,
				"very long": 8,
				"super long": 10
			}[this.attackingWith.range];
			var velocity = Math.rotate(1, 0, this.aimRot);
			if(this.facing === "left") {
				velocity.x *= -1;
			}
			var arrow = new ShotArrow(
				(this.x + this.hitbox[this.facing]), (velocity.y + this.y + 26),
				(velocity.x * speed), (velocity.y * speed),
				damage, "player", this.attackingWith.element
			);
			if(this.attackingWith instanceof LongBow) {
				arrow.ORIGINAL_X = arrow.x;
			}
			game.dungeon[game.inRoom].content.push(arrow);
			this.removeArrow();
		}
		else {
			var aimedCharges = game.dungeon[game.inRoom].getInstancesOf(MagicCharge).filter(charge => charge.beingAimed);
			if(aimedCharges.length !== 0) {
				var aimedCharge = aimedCharges.onlyItem();
				aimedCharge.beingAimed = false;
				aimedCharge.velocity = {
					x: this.chargeLoc.x / 10,
					y: this.chargeLoc.y / 10
				};
			}
		}
	}
	if(this.facingBefore !== this.facing) {
		this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
	}
	if(!this.aiming) {
		this.aimRot = null;
	}
	if(this.aiming && this.attackingWith instanceof MechBow && utils.frameCount % 20 === 0 && this.hasInInventory(Arrow)) {
		this.shootReload = 60;
		var damage = Math.round(Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh));
		var speed = {
			"medium": 5,
			"long": 5.7,
			"very long": 8,
			"super long": 10
		}[this.attackingWith.range];
		var velocity = Math.rotate(1, 0, this.aimRot);
		if(this.facing === "left") {
			velocity.x *= -1;
		}
		var arrow = new ShotArrow(
			(this.x + this.hitbox[this.facing]), (velocity.y + this.y + 26),
			(velocity.x * speed), (velocity.y * speed),
			damage, "player", this.attackingWith.element
		);
		if(this.attackingWith instanceof LongBow) {
			arrow.ORIGINAL_X = arrow.x;
		}
		game.dungeon[game.inRoom].content.push(arrow);
		/* remove arrows from inventory */
		this.removeArrow();
	}
	this.aimingBefore = this.aiming;
	this.facingBefore = this.facing;
	this.shootReload --;
});
Player.method("removeArrow", function() {
	/*
	Removes an arrow from the player's inventory (or does nothing randomly, if the player has an item that lets them sometimes keep arrows)
	*/
	var arrowEfficiency = this.calculateStat("arrowEfficiency");
	if(Math.random() < (1 - (arrowEfficiency / 100))) {
		var slot = this.invSlots.find((slot) => slot.content instanceof Arrow);
		if(Object.typeof(slot) !== "object") {
			throw new Error("removeArrow() expects the player to already have arrows in inventory");
		}
		if(slot.content.quantity > 1) {
			slot.content.quantity --;
		}
		else {
			slot.content = "empty";
		}
	}
});
Player.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.velocity.y = Math.min(0, this.velocity.y);
		this.canJump = true;
		/* Hurt the player if they've fallen from a height */
		if(this.fallDmg !== 0) {
			this.hurt(this.fallDmg, "falling", true);
			this.fallDmg = 0;
		}
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.max(2, this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.max(this.velocity.x, 0);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = Math.min(this.velocity.x, 0);
	}
});
Player.method("gui", function() {
	/* Delete Consumed Items */
	this.invSlots.forEach(slot => {
		if(slot.content.consumed) { slot.content = "empty"; }
	})
	/* Change GUI Open */
	if(io.keys.KeyD && !this.openingBefore) {
		if(this.guiOpen === "none") {
			this.guiOpen = "inventory";
		}
		else if(this.guiOpen === "inventory") {
			this.guiOpen = "none";
		}
		else if(this.guiOpen.substr(0, 7) === "reforge") {
			this.guiOpen = "none";
		}
		this.openCooldown = 2;
	}
	if(io.keys.Escape) {
		/* escape key to exit guis */
		this.guiOpen = "none";
	}
	/* Display GUIs */
	function selectionGraphic(invSlot) {
		/*
		Display 4 triangles on 'invSlot'
		*/
		c.fillStyle = "rgb(59, 67, 70)";
		c.save(); {
			c.translate(invSlot.x + 35, invSlot.y + 35);
			for(var i = 0; i < 4; i ++) {
				c.rotate(Math.rad(90));
				c.fillPoly(
					{ x: 0, y: -25 },
					{ x: -10, y: -35 },
					{ x: 10, y: -35 }
				);
			}
		} c.restore();
		return;
	};
	function display(invSlot) {
		/*
		Displays the item in the slot 'invSlot'.
		*/
		if(invSlot.content === "empty" || invSlot.content === undefined) {
			return;
		}
		c.save(); {
			c.translate(invSlot.x + 35, invSlot.y + 35);
			c.globalAlpha = invSlot.content.opacity;
			invSlot.content.display("holding");
		} c.restore();
		invSlot.content.opacity += 0.05;
		/* Weapon Particles */
		if(invSlot.content instanceof Weapon) {
			c.save(); {
				c.translate(invSlot.x, invSlot.y);
				invSlot.content.displayParticles();
			} c.restore();
		}
	};
	if(this.guiOpen === "inventory") {
		ui.infoBar.actions.d = "close inventory";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* Display Items */
		var hoverIndex = null;
		this.invSlots.forEach((slot, index) => {
			/* Item Slot */
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(slot.x, slot.y, 70, 70);
			c.strokeRect(slot.x, slot.y, 70, 70);
			/* Item */
			if(slot.content !== "empty") {
				/* Display Items */
				display(slot);
			}
			/* Selection Graphic (4 triangles) */
			if(index === this.activeSlot) {
				selectionGraphic(slot);
			}
		});
		/* Find which item is being hovered over */
		var hoveredSlot = this.invSlots.find(slot => utils.mouseInRect(slot.x, slot.y, 70, 70));
		if(hoveredSlot !== undefined && hoveredSlot.content !== "empty") {
			if(hoveredSlot.type === "holding") {
				ui.infoBar.actions.click = "unequip " + hoveredSlot.content.name;
			}
			else if(hoveredSlot.type === "equip") {
				ui.infoBar.actions.click = "take off " + hoveredSlot.content.name;
			}
			else if(!(hoveredSlot.content instanceof Arrow)) {
				if(hoveredSlot.content instanceof Equipable) {
					ui.infoBar.actions.click = "put on " + hoveredSlot.content.name;
				}
				else {
					ui.infoBar.actions.click = "equip " + hoveredSlot.content.name;
				}
			}
		}
		/* Item hovering */
		if(hoveredSlot !== undefined && hoveredSlot.content !== "empty") {
			/* Display descriptions */
			hoveredSlot.content.desc = hoveredSlot.content.getDesc();
			hoveredSlot.content.displayDesc(hoveredSlot.x + ((hoveredSlot.type === "equip") ? 0 : 70), hoveredSlot.y + 35, (hoveredSlot.type === "equip") ? "left" : "right");
			/* Move Item if clicked */
			if(io.mouse.pressed) {
				if(hoveredSlot.type === "storage") {
					if(!(hoveredSlot.content instanceof Equipable)) {
						/* Move from a storage slot to a "wearing" slot */
						for(var i = 0; i < 3; i ++) {
							if(this.invSlots[i].content === "empty") {
								this.invSlots[i].content = hoveredSlot.content.clone();
								hoveredSlot.content = "empty";
								break;
							}
						}
					}
					else {
						/* Move from a storage slot to a "equipable" slot */
						for(var i = 0; i < this.invSlots.length; i ++) {
							if(this.invSlots[i].type === "equip" && this.invSlots[i].content === "empty") {
								this.invSlots[i].content = hoveredSlot.content.clone();
								hoveredSlot.content = "empty";
								break;
							}
						}
					}
				}
				else if(hoveredSlot.type === "holding") {
					/* Move from a "held" slot to a storage slot */
					for(var i = 0; i < this.invSlots.length; i ++) {
						if(this.invSlots[i].type === "storage" && this.invSlots[i].content === "empty") {
							this.invSlots[i].content = hoveredSlot.content.clone();
							hoveredSlot.content = "empty";
							break;
						}
					}
				}
				else if(hoveredSlot.type === "equip") {
					/* Move from a "wearing" slot to a storage slot */
					for(var i = 0; i < this.invSlots.length; i ++) {
						if(this.invSlots[i].type === "storage" && this.invSlots[i].content === "empty") {
							this.invSlots[i].content = hoveredSlot.content.clone();
							hoveredSlot.content = "empty";
							break;
						}
					}
				}
			}
		}
	}
	else if(this.guiOpen === "crystal-infusion") {
		ui.infoBar.actions.d = "cancel";
		if(io.keys.KeyD) {
			this.guiOpen = "none";
		}
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* GUI Title */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillText("Select a weapon to infuse", 400, 165);
		var hoverIndex = null;
		this.invSlots.forEach((slot, index) => {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(slot.x, slot.y, 70, 70);
			c.strokeRect(slot.x, slot.y, 70, 70);
			if(slot.content !== "empty") {
				display(slot);
				/* Gray out invalid choices */
				var item = slot.content;
				if(!item.canBeInfused(this.infusedGui)) {
					c.globalAlpha = 0.75;
					c.fillStyle = "rgb(150, 150, 150)";
					c.fillRect(slot.x + 2, slot.y + 2, 66, 66);
					c.globalAlpha = 1;
				}
			}
			/* Selection graphic */
			if(index === this.activeSlot) {
				selectionGraphic(slot);
			}
		});
		/* Find which is hovered */
		var hoveredSlot = this.invSlots.find(slot => utils.mouseInRect(slot.x, slot.y, 70, 70));
		if(hoveredSlot !== undefined && hoveredSlot.content !== "empty") {
			/* Display desc of hovered item */
			hoveredSlot.content.desc = hoveredSlot.content.getDesc();
			hoveredSlot.content.displayDesc(hoveredSlot.x + (hoveredSlot.type === "equip" ? 0 : 70), hoveredSlot.y + 35, hoveredSlot.type === "equip" ? "left" : "right");
			/* Detect clicks */
			if(hoveredSlot.content.canBeInfused(this.infusedGui)) {
				ui.infoBar.actions.click = "infuse " + hoveredSlot.content.name;
				if(io.mouse.pressed) {
					hoveredSlot.content.element = this.infusedGui;
					this.guiOpen = "none";
					this.invSlots[this.activeSlot].content = "empty";
					return;
				}
			}
		}
	}
	else if(this.guiOpen === "reforge-item") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* Text */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillText("Select a weapon to reforge", 400, 165);
		var hoverIndex = null;
		this.invSlots.forEach((slot, index) => {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(slot.x, slot.y, 70, 70);
			c.strokeRect(slot.x, slot.y, 70, 70);
			if(slot.content !== "empty") {
				display(slot);
				/* Gray out invalid choices */
				if(!slot.content.canBeReforged()) {
					c.globalAlpha = 0.75;
					c.fillStyle = "rgb(150, 150, 150)";
					c.fillRect(slot.x + 2, slot.y + 2, 66, 66);
					c.globalAlpha = 1;
				}
			}
			/* Selection graphic */
			if(index === this.activeSlot) {
				selectionGraphic(slot);
			}
		});
		/* Find which is hovered */
		var hoveredSlot = this.invSlots.find(slot => utils.mouseInRect(slot.x, slot.y, 70, 70));
		if(hoveredSlot !== undefined && hoveredSlot.content !== "empty") {
			/* Display desc of hovered item */
			hoveredSlot.content.desc = hoveredSlot.content.getDesc();
			hoveredSlot.content.displayDesc(hoveredSlot.x + (hoveredSlot.type === "equip" ? 0 : 70), hoveredSlot.y + 35, hoveredSlot.type === "equip" ? "left" : "right");
			/* Detect clicks */
			if(hoveredSlot.content.canBeReforged()) {
				ui.infoBar.actions.click = "reforge " + hoveredSlot.content.name;
				if(io.mouse.pressed) {
					/* Find current reforge status of item */
					this.reforgeIndex = this.invSlots.indexOf(hoveredSlot);
					if(hoveredSlot.content.modifier === "none") {
						this.guiOpen = "reforge-trait-none";
					}
					else if(hoveredSlot.content.modifier === "light" || hoveredSlot.content.modifier === "distant" || hoveredSlot.content.modifier === "efficient" || hoveredSlot.content.modifier === "empowering") {
						this.guiOpen = "reforge-trait-light";
					}
					else if(hoveredSlot.content.modifier === "heavy" || hoveredSlot.content.modifier === "forceful" || hoveredSlot.content.modifier === "arcane" || hoveredSlot.content.modifier === "sturdy") {
						this.guiOpen = "reforge-trait-heavy";
					}
					/* Find type of item */
					if(hoveredSlot.content instanceof MeleeWeapon) {
						this.reforgeType = "melee";
					}
					else if(hoveredSlot.content instanceof RangedWeapon) {
						this.reforgeType = "ranged";
					}
					else if(hoveredSlot.content instanceof MagicWeapon) {
						this.reforgeType = "magic";
					}
					else if(hoveredSlot.content instanceof Equipable) {
						this.reforgeType = "equipable";
					}
					return;
				}
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-none") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText((this.reforgeType === "equipable") ? "Defense" : "Damage", 500, 500);
		/* First Choice */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 10;
		choice1.damHigh -= 10;
		if(choice1 instanceof MeleeWeapon) {
			if(choice1.attackSpeed === "normal") {
				choice1.attackSpeed = "fast";
			}
			else if(choice1.attackSpeed === "slow") {
				choice1.attackSpeed = "normal";
			}
		}
		else if(choice1 instanceof RangedWeapon) {
			if(choice1.range === "long") {
				choice1.range = "very long";
			}
			else if(choice1.range === "very long") {
				choice1.range = "super long";
			}
		}
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 10;
		choice2.damHigh += 10;
		if(choice2 instanceof MeleeWeapon) {
			if(choice2.attackSpeed === "normal") {
				choice2.attackSpeed = "slow";
			}
			else if(choice2.attackSpeed === "slow") {
				choice2.attackSpeed = "very slow";
			}
		}
		else if(choice2 instanceof RangedWeapon) {
			if(choice2.range === "long") {
				choice2.range = "medium";
			}
			else if(choice2.range === "very long") {
				choice2.range = "long";
			}
		}
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "speed" : "range") : (this.reforgeType === "magic" ? "mana cost" : "bonuses"));
			if(io.mouse.pressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice1.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Exit GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "equipable") ? "defense" : "damage");
			if(io.mouse.pressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice2.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Exit GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-light") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText("Balance", 300, 500);
		c.fillText((this.reforgeType === "equipable") ? "Defense" : "Damage", 500, 500);
		/* Choice 1 */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 10;
		choice2.damHigh += 10;
		if(choice2 instanceof MeleeWeapon) {
			if(choice2.attackSpeed === "normal") {
				choice2.attackSpeed = "slow";
			}
			else if(choice2.attackSpeed === "slow") {
				choice2.attackSpeed = "very slow";
			}
		}
		else if(choice2 instanceof RangedWeapon) {
			if(choice2.range === "long") {
				choice2.range = "medium";
			}
			else if(choice2.range === "very long") {
				choice2.range = "long";
			}
		}
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge to balance";
			if(io.mouse.pressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = "none";
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Exit GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "equipable") ? "defense" : "damage");
			if(io.mouse.pressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice2.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Close GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-heavy") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText("Balance", 500, 500);
		/* Choice 1 */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 10;
		choice1.damHigh -= 10;
		if(choice1 instanceof MeleeWeapon) {
			if(choice1.attackSpeed === "normal") {
				choice1.attackSpeed = "fast";
			}
			else if(choice1.attackSpeed === "slow") {
				choice1.attackSpeed = "normal";
			}
		}
		else if(choice1 instanceof RangedWeapon) {
			if(choice1.range === "long") {
				choice1.range = "very long";
			}
			else if(choice1.range === "very long") {
				choice1.range = "super long";
			}
		}
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "speed" : "range") : (this.reforgeType === "magic" ? "mana cost" : "bonuses"));
			if(io.mouse.pressed) {
				/* Update Item Stats */
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering");
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = theModifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Close GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge to balance";
			if(io.mouse.pressed) {
				/* Update Item Stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = "none";
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Close GUI and mark forge as used */
				var nearestForge = game.dungeon[game.inRoom].getInstancesOf(Forge).min(forge => Math.dist(forge.x, forge.y, this.x, this.y));
				nearestForge.used = true;
				this.guiOpen = "none";
			}
		}
	}
	else {
		/* Display held items */
		this.invSlots.forEach((slot, index) => {
			slot.content.opacity += 0.05;
			if(slot.type === "holding") {
				c.strokeStyle = "rgb(59, 67, 70)";
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillRect(slot.x, slot.y, 70, 70);
				c.strokeRect(slot.x, slot.y, 70, 70);
				if(slot.content !== "empty") {
					display(slot);
				}
				if(index === this.activeSlot) {
					selectionGraphic(slot);
				}
			}
		});
	}
	this.openingBefore = io.keys.KeyD;
});
Player.method("addItem", function(item) {
	/*
	Adds the item 'item' to the player's inventory.
	*/
	/* Check for matching items if it's stackable */
	if(item.stackable) {
		var firstMatchingSlot = this.invSlots.find(slot => slot.content.constructor === item.constructor);
		if(firstMatchingSlot !== undefined) {
			firstMatchingSlot.content.quantity += item.quantity;
			return;
		}
	}
	/* Check for empty slots if it's not */
	var firstEmptySlot = this.invSlots.find(slot => slot.content === "empty");
	if(firstEmptySlot !== undefined) {
		firstEmptySlot.content = item.clone();
		firstEmptySlot.content.opacity = 0;
	}
});
Player.method("hurt", function(amount, killer, ignoreDef) {
	/*
	Deals 'amount' damage to the player. 'killer' shows up in death message. If 'ignoreDef' is true, the player's defense will be ignored.
	*/
	if(amount !== 0) {
		/* display red flashing screen */
		game.transitions.color = "rgb(255, 0, 0)";
		game.transitions.opacity = 1;
		game.transitions.onScreenChange = function() {
			game.transitions.color = "rgb(0, 0, 0)";
		};
		game.transitions.dir = "fade-in";
	}
	/* Calculate defense */
	var defLow = this.calculateStat("defLow");
	var defHigh = this.calculateStat("defHigh");
	var defense = Math.randomInRange(defLow, defHigh);
	/* Subtract defense from damage dealt*/
	if(ignoreDef) {
		var damage = amount;
	}
	else {
		var damage = amount - defense;
	}
	/* Cap damage at 0 + hurt player */
	damage = Math.max(damage, 0);
	damage = Math.round(damage);
	this.health -= damage;
	/* If player is dead, record killer */
	if(this.health <= 0) {
		this.dead = true;
		this.deathCause = killer;
	}
});
Player.method("reset", function() {
	/*
	This function resets most of the player's properties. (Usually called after starting a new game)
	*/
	/* Reset rooms */
	game.dungeon = [];
	game.rooms.ambient1.add();
	game.inRoom = 0;
	/* Reset player properties */
	var permanentProperties = ["onScreen", "class", "maxGold", "scores"];
	for(var i in this) {
		if(!permanentProperties.includes(i)) {
			var newPlayer = new Player();
			this[i] = newPlayer[i];
		}
	}
	/* Re-add class items */
	switch(this.class) {
		case "warrior":
			this.addItem(new Sword());
			this.addItem(new Helmet());
			break;
		case "archer":
			this.addItem(new WoodBow());
			this.addItem(new Dagger());
			this.addItem(new Arrow(10));
			break;
		case "mage":
			this.addItem(new EnergyStaff());
			this.addItem(new Dagger());
			this.addItem(new WizardHat());
			break;
	}
});
Player.method("updatePower", function() {
	/*
	This function gives a number representing the overall quality of the player's items + health and mana upgrades. (stores in this.power)
	*/
	this.power = 0;
	this.power += (this.maxHealth - 100);
	this.power += (this.maxMana - 100);
	this.power += this.invSlots.filter(slot => slot.content !== "empty").sum(slot => slot.content.power);
});
Player.method("hasInInventory", function(constructor) {
	return this.invSlots.find(slot => slot.content instanceof constructor) !== undefined;
});
Player.method("clearInventory", function() {
	this.invSlots.forEach(slot => { slot.content = "empty"; });
});
Player.method("loadScores", function() {
	if(localStorage.getItem("scores") !== null) {
		p.scores = JSON.parse(localStorage.getItem("scores"));
	}
});
Player.method("saveScores", function() {
	var scores = JSON.stringify(this.scores);
	localStorage.setItem("scores", scores);
});
Player.method("calculateStat", function(statName) {
	const STAT_NAMES = ["damLow", "damHigh", "defLow", "defHigh", "arrowEfficiency", "healthRegen", "manaRegen"];
	if(!STAT_NAMES.includes(statName)) {
		throw new Error("Invalid stat name of '" + statName + "'");
	}

	var result = 0;
	if(this.invSlots[this.activeSlot].content instanceof Weapon) {
		result = this.invSlots[this.activeSlot].content[statName];
		result = (typeof result === "number") ? result : 0;
	}
	result += this.invSlots.filter(slot => slot.type === "equip").sum(slot => slot.content[statName]);
	return result;
});
