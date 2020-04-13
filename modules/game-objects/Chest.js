function Chest(x, y) {
	this.x = x;
	this.y = y;
	this.r = 0;
	this.opening = false;
	this.openDir = null;
	this.lidArray = Math.findPointsCircular(40, 50, 64); // circle passing through origin
	this.initialized = false;
	this.spawnedItem = false;
};
Chest.method("update", function() {
	/* Initialize */
	if(!this.initialized) {
		this.lidArray = this.lidArray.filter((point => point.y <= 0));
		this.lidArray.forEach((point) => {
			point.x /= 2, point.y /= 2;
		});
		this.initialized = true;
	}
	/* Decide which direction to open from */
	if(!this.opening) {
		if(p.x < this.x) {
			this.openDir = "right";
		}
		else {
			this.openDir = "left";
		}
	}
	if(Math.dist(this.x, p.x) < 65 && Math.dist(this.y, p.y + p.hitbox.bottom) < 10 && p.canJump && !this.opening) {
		ui.infoBar.actions.s = "open chest";
		if(io.keys.KeyS) {
			this.opening = true;
			if(p.x < this.x) {
				this.openDir = "right";
			}
			else {
				this.openDir = "left";
			}
		}
	}
	/* Animation */
	if(this.r >= -84 && this.opening) {
		this.r -= 6;
	}
	/* Item spawning - give the player an item they don't already have */
	if(this.r <= -84 && !this.spawnedItem && this.opening) {
		this.spawnedItem = true;
		this.requestingItem = true;
		game.dungeon[game.theRoom].content.push(this.generateItem());
	}
});
Chest.method("generateItem", function() {
	if(game.onScreen === "how") {
		return new WoodBow();
	}
	if(p.hasInInventory(RangedWeapon)) {
		/* 25% arrows, 25% coins, 50% miscellaneous */
		var options = [
			this.generateCoins,
			this.generateArrows,
			this.generateMiscellaneousItem,
			this.generateMiscellaneousItem
		];
	}
	else {
		/* 50% coins, 50% miscellaneous */
		var options = [this.generateCoins, this.generateMiscellaneousItem];
	}
	if(debugging.settings.DEBUGGING_MODE && debugging.settings.ALWAYS_ITEMS_IN_CHESTS) {
		options = [this.generateMiscellaneousItem];
	}
	return (options.randomItem()).call(this);
});
Chest.method("generateCoins", function() {
	return new Coin(Math.round(Math.randomInRange(6, 10)));
});
Chest.method("generateArrows", function() {
	return new Arrow(Math.round(Math.randomInRange(6, 10)));
});
Chest.method("generateMiscellaneousItem", function() {
	/*
	This function is used to select an item at random (not coins or arrows) and give it to the player after first making sure the player doesn't already have that item. See Chest.generateItem(), where this function is called.
	*/
	var possibleItems = game.items.clone().filter(function(item) {
		return !p.hasInInventory(item);
	});
	if(possibleItems.length === 0) {
		/* the player has every item in the game, so just give them coins */
		return this.generateCoins();
	}
	var randomItemConstructor = possibleItems.randomItem();
	return new randomItemConstructor();
});
Chest.method("display", function() {
	// openDir is which corner the chest is rotating around
	var self = this;
	var centerOfRotation = {
		x: -20,
		y: -40
	};
	var scaleFactor = (this.openDir === "left" ? -1 : 1);
	var rotationDegrees = this.r;

	var centerMiddle = { x: this.x, y: this.y };
	var centerBack = graphics3D.point3D(this.x, this.y, 0.95);
	var centerFront = graphics3D.point3D(this.x, this.y, 1.05);
	var cornerMiddle = { x: this.x + 20, y: this.y - 30 };
	var cornerBack = graphics3D.point3D(this.x + 20, this.y - 30, 0.95);
	var cornerFront = graphics3D.point3D(this.x + 20, this.y - 30, 0.95);

	function displayChestLid(color) {
		/* clip out rest of circle for chest lid */
		c.beginPath();
		c.rect(-1000, 0, 2000, 1000);
		c.invertPath();
		c.clip("evenodd");

		/* draw circle for chest lid */
		var radius = 25;
		c.fillStyle = color;
		c.fillCircle(
			-20, // centered on chest
			/*
			Circle passes through corner of chest (0, 0) and is centered at x=-20
			20^2 + y^2 = radius^2
			y^2 = (radius^2 - 20^2)
			y = Math.sqrt(radius^2 - 20^2)
			*/
			Math.sqrt(radius * radius - 20 * 20),   //
			radius
		);
	};
	/* draw back of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.save(); {
					c.translate(centerBack.x, centerBack.y); // translate to chest location
					c.scale(0.95, 0.95);                     // scale for perspective
					c.scale(scaleFactor, 1);                 // flip so it can open from both sides
					c.translate(20, -30);                    // translate to upper-right corner
					c.rotate(Math.rad(-rotationDegrees));    // rotate according to how much the chest is open
					displayChestLid("rgb(159, 89, 39)");
				} c.restore();
			},
			0.95
		)
	);
	/* draw front of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.save(); {
					c.translate(centerFront.x, centerFront.y); // translate to chest location
					c.scale(1.05, 1.05);                       // scale for perspective
					c.scale(scaleFactor, 1);                   // flip so it can open from both sides
					c.translate(20, -30);                      // translate to upper-right corner
					c.rotate(Math.rad(-rotationDegrees));      // rotate according to how much the chest is open
					displayChestLid("rgb(139, 69, 19)");
				} c.restore();
			},
			1.05
		)
	);
	/* draw underside of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var p1 = graphics3D.point3D(
					self.x + (self.openDir === "left" ? -20 : 20),
					self.y - 30,
					0.95
				);
				var p2 = graphics3D.point3D(
					self.x + (self.openDir === "left" ? -20 : 20),
					self.y - 30,
					1.05
				);
				var chestSide = { x: self.x - 20, y: self.y - 30 };
				chestSide = Math.rotate(
					chestSide.x, chestSide.y,
					-rotationDegrees,
					cornerMiddle.x, cornerMiddle.y
				);
				chestSide = Math.scaleAboutPoint(
					chestSide.x, chestSide.y,
					centerMiddle.x, centerMiddle.y,
					scaleFactor, 1
				)
				var p3 = graphics3D.point3D(chestSide.x, chestSide.y, 1.05);
				var p4 = graphics3D.point3D(chestSide.x, chestSide.y, 0.95);
				c.fillStyle = "rgb(159, 89, 39)";
				c.fillPolyWithoutOrder(p1, p2, p3, p4);
			},
			0.95
		)
	);
	/* draw box for chest */
	graphics3D.cube(this.x - 20, this.y - 30, 40, 30, 0.95, 1.05, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
});
