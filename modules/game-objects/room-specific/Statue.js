function Statue(x, y) {
	this.x = x;
	this.y = y;
	var possibleItems = game.rooms.secret1.getPossibleStatueItems();
	this.itemHolding = new (possibleItems.randomItem()) ();
	this.facing = ["left", "right"].randomItem();
	this.pose = ["kneeling", "standing"].randomItem();
};
Statue.method("display", function() {
	/* item in hands */
	var self = this;
	if(!this.itemStolen) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					if(self.itemHolding instanceof MeleeWeapon) {
						if(self.pose === "standing") {
							c.translate(self.x, self.y + 72);
							c.scale((self.facing === "left" ? -1 : 1), 1);
							c.translate(20, 0);
							c.rotate(Math.rad(45));
							self.itemHolding.display("attacking");
						}
						else {
							c.translate(self.x, self.y + 52);
							c.scale((self.facing === "left" ? -1 : 1), 1);
							c.translate(24, 0);
							self.itemHolding.display("attacking");
						}
					}
					else {
						c.translate(self.x, self.y + (self.itemHolding instanceof MagicWeapon ? 32 : 52));
						c.scale((self.facing === "left" ? -1 : 1), 1);
						c.translate((self.itemHolding instanceof MagicWeapon ? 28 : 20), 0);
						c.scale(2, 2);
						self.itemHolding.display("aiming");
					}
				},
				1,
				(this.itemHolding instanceof RangedWeapon) ? 1 : -1
			)
		);
	}
	/* statue */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.fillStyle = "rgb(125, 125, 125)";
				c.lineCap = "round";
				c.lineWidth = 10;
				c.save(); {
					c.translate(self.x, self.y);
					c.scale(1, 1.2);
					c.fillCircle(0, 24, 20);
				} c.restore();
				/* body */
				c.strokeStyle = "rgb(125, 125, 125)";
				c.strokeLine(self.x, self.y + 24, self.x, self.y + 72);
				/* legs */
				if(self.pose === "standing") {
					c.strokeLine(self.x, self.y + 72, self.x - 10, self.y + 92);
					c.strokeLine(self.x, self.y + 72, self.x + 10, self.y + 92);
				}
				else if(self.facing === "left") {
					c.strokeLine(
						self.x, self.y + 72,
						self.x - 20, self.y + 72,
						self.x - 20, self.y + 92
					);
					c.strokeLine(
						self.x, self.y + 72,
						self.x, self.y + 92,
						self.x + 20, self.y + 92
					);
				}
				else if(self.facing === "right") {
					c.strokeLine(
						self.x, self.y + 72,
						self.x + 20, self.y + 72,
						self.x + 20, self.y + 92
					);
					c.strokeLine(
						self.x, self.y + 72,
						self.x, self.y + 92,
						self.x - 20, self.y + 92
					);
				}
				/* arms */
				var leftArmUp = (self.facing === "left" && (!(self.itemHolding instanceof MeleeWeapon) || self.pose === "kneeling"));
				var rightArmUp = (self.facing === "right" && (!(self.itemHolding instanceof MeleeWeapon) || self.pose === "kneeling"));
				c.strokeLine(self.x, self.y + 52, self.x - 20, self.y + (leftArmUp ? 52 : 72));
				c.strokeLine(self.x, self.y + 52, self.x + 20, self.y + (rightArmUp ? 52 : 72));
			},
			1
		)
	);
	/* pedestal */
	graphics3D.cube(this.x - 60, this.y + 96, 120, 34, 0.95, 1.05, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
});
Statue.method("update", function() {
	/* stealing Weapons */
	if(io.keys.KeyS && Math.dist(this.x, this.y, p.x, p.y) <= 100 && !this.itemStolen) {
		this.itemStolen = true;
		p.addItem(this.itemHolding);
	}
});
