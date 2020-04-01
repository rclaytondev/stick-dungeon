
function Item() {
	this.location = null;
	this.initialized = false;
	this.mode = "visual"; // the mode of the item - "visual" for when it is coming out of a chest and "held" if it is in the inventory.
	this.velocity = { x: 0, y: 0 };
};
Item.method("init", function() {
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i].requestingItem && game.dungeon[game.inRoom].content[i] instanceof Chest) {
			this.x = game.dungeon[game.inRoom].content[i].x;
			this.y = game.dungeon[game.inRoom].content[i].y - 10;
			game.dungeon[game.inRoom].content[i].requestingItem = false;
			break;
		}
	}
	this.initialized = true;
	this.velocity.y = -4;
	this.opacity = 1;
});
Item.method("animate", function() {
	/**
	Run the animation for the item when coming out of chests
	**/
	this.y += (this.velocity.y < 0) ? this.velocity.y : 0;
	this.velocity.y += 0.1;
	if(this.velocity.y >= 0) {
		this.opacity -= 0.05;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
});
Item.method("remove", function() {
	this.opacity = 1;
	p.addItem(this);
});
Item.method("exist", function() {
	this.update();
	this._display();
});
Item.method("displayDesc", function(x, y, dir) {
	dir = dir || "left";
	/* add special stat text for elemental weapons */
	if(this instanceof Weapon && this.element !== "none" && !(this instanceof ElementalStaff)) {
		loop1: for(var i = 1; i < this.desc.length; i ++) {
			if(this.desc[i].font !== "bold 10pt Courier") {
				this.desc.splice(i + 1, 0, {
					content: "Special: " + ((this.element === "fire" || this.element === "water") ?
					((this.element === "fire") ? "Burning" : "Freezing") :
					((this.element === "earth") ? "Crushing" : "Knockback")),
					font: "10pt monospace",
					color: "rgb(255, 255, 255)"
				});
				break loop1;
			}
		}
		this.desc.push({
			content: "Enhanced with the power of " + ((this.element === "fire" || this.element === "water") ?
			((this.element === "fire") ? "flame." : "ice.") :
			((this.element === "earth") ? "stone." : "wind.")),
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		});
	}
	/* out-of-class warning info */
	if((this instanceof MeleeWeapon && !(this instanceof Dagger) && p.class !== "warrior") || (this instanceof RangedWeapon && p.class !== "archer") || (this instanceof MagicWeapon && p.class !== "mage")) {
		if(this instanceof MeleeWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by warriors",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		} else if(this instanceof RangedWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by archers",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		}
		else if(this instanceof MagicWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by mages",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		}
	}
	/* calculate text height for description */
	var textY = 0;
	c.globalAlpha = 0;
	for(var i = 0; i < this.desc.length; i ++) {
		c.font = this.desc[i].font;
		textY = c.displayTextOverLines(this.desc[i].content, x + 15, textY + 12, 190, 12);
	}
	c.globalAlpha = 1;
	var descHeight = textY + 10;
	var idealY = y - (descHeight / 2);
	var textBoxY = Math.constrain(idealY, 20, 780 - (descHeight / 2));
	if(dir === "right") {
		/* display text box */
		c.textAlign = "left";
		var textY = 0;
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillPoly(x, y, x + 10, y - 10, x + 10, y + 10);
		c.fillRect(x + 10, textBoxY, 190, descHeight);

		textY = textBoxY + 4;
		/* display the text */
		for(var i = 0; i < this.desc.length; i ++) {
			c.font = this.desc[i].font;
			c.fillStyle = this.desc[i].color;
			textY = c.displayTextOverLines(this.desc[i].content, x + 15, textY + 12, 190, 12);
		}
	}
	else {
		/* text box */
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillPoly(x, y, x - 10, y - 10, x - 10, y + 10);
		c.fillRect(x - 210, textBoxY, 200, descHeight);
		/* text */
		c.textAlign = "left";
		textY = textBoxY + 4;
		for(var i = 0; i < this.desc.length; i ++) {
			c.font = this.desc[i].font;
			c.fillStyle = this.desc[i].color;
			textY = c.displayTextOverLines(this.desc[i].content, x - 205, textY + 12, 190, 12);
		}
	}
});
Item.method("_display", function() {
	/*
	This function is used to display the items in-game (the ones in chests). It is used because the individual items already have a method `display`.
	*/
	var nearestChest = game.dungeon[game.theRoom].content[0];
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		var obj = game.dungeon[game.theRoom].content[i];
		if(obj instanceof Chest && Math.distSq(obj.x, obj.y, this.x, this.y) < Math.distSq(nearestChest.x, nearestChest.y, this.x, this.y)) {
			nearestChest = obj;
		}
	}
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.save(); {
				c.globalAlpha = Math.constrain(self.opacity, 0, 1);
				c.beginPath();
				c.rect(nearestChest.x - 30, nearestChest.y - 1000, 60, 1000);
				c.clip();
				c.save(); {
					c.translate(self.x, self.y);
					self.display("item");
				}
			} c.restore();
		},
		1
	));
});
Item.method("update", function() {
	this.animate();
});
