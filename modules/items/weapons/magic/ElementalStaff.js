function ElementalStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.name = "staff";
	this.element = "none";
	this.manaCost = (this.modifier === "none") ? 30 : (this.modifier === "arcane" ? 40 : 20);
	this.damLow = (p.class === "mage") ? 60 : 50;
	this.damHigh = (p.class === "mage") ? 90 : 80;
	this.power = 4;
};
ElementalStaff.extends(MagicWeapon);
ElementalStaff.method("display", function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.fillStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		/* staff base */
		c.strokeLine(0, -7, 0, 30);

		c.save(); {
			/* cutout in middle of staff */
			c.beginPath();
			c.polygon(
				0, -10,
				7, -17,
				0, -20,
				-7, -17
			);
			c.invertPath();
			c.clip("evenodd");
			/* top of staff (with cutout) */
			c.fillPoly(
				{ x: -7 - 5, y: -17 },
				{ x: 0, y: -20 - 5},
				{ x: 7 + 5, y: -17 },
				{ x: 0, y: -10 + 5 }
			);
		} c.restore();

		/* crystal */
		if(this.element !== "none") {
		if(this.element === "fire") {
			c.fillStyle = "rgb(255, 100, 0)";
			c.strokeStyle = "rgb(255, 0, 0)";
		}
		else if(this.element === "water") {
			c.fillStyle = "rgb(0, 255, 255)";
			c.strokeStyle = "rgb(0, 128, 255)";
		}
		else if(this.element === "earth") {
			c.fillStyle = "rgb(0, 128, 128)";
			c.strokeStyle = "rgb(0, 128, 0)";
		}
		else if(this.element === "air") {
			c.fillStyle = "rgb(150, 150, 150)";
			c.strokeStyle = "rgb(220, 220, 220)";
		}
		c.lineWidth = 1;
		c.fillPoly(
			0, -10,
			7, -17,
			0, -20,
			-7, -17,
			0, -10
		);
		c.stroke();

		c.strokeLine(0, -10, 0, -20);
	}
	} c.restore();
	/* update charge type */
	if(this.element !== "none") {
		this.chargeType = this.element;
	}
});
ElementalStaff.method("getDesc", function() {
	if(this.element === "none") {
		return [
			{
				content: "Wooden Staff",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "This staff has no magical properties. It can, however, be infused with crystals to create an elemental staff",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "fire") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Fire",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot an enhanced fireball.",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "water") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Water",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot a freezing water projectile",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "earth") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Earth",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to cause cave-ins",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "air") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Air",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot a burst of strengthened wind",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
});
