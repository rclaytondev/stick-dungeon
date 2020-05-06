function MechBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "bow";
	this.attackSpeed = "fast";
	this.range = "long";
	this.reload = 1;
	this.damLow = (p.class === "archer") ? 70 : 60;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 4;
};
MechBow.extend(RangedWeapon);
MechBow.method("display", function(type) {
	type = type || "item";
	c.save(); {
		if(type === "aiming") {
			c.translate(-10, 0);
			c.scale(0.9, 0.9);
			c.rotate(Math.rad(45));
		}
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.strokeArc(-5, 5, 23, Math.rad(225 - 11), Math.rad(405 + 11));
		c.lineWidth = 1;
		/* bowstring */
		c.strokeLine(-22, -13, 13, 22);
		/* bowstring holders */
		c.strokeLine(-5, 5, 5, -17);
		c.strokeLine(-5, 5, 17, -5);
		c.fillStyle = "rgb(210, 210, 210)";
		/* 2nd bowstring */
		c.strokeLine(-13, -15, 15, 13);
		/* gears */
		c.save(); {
			c.translate(12, 2);
			c.fillCircle(0, 0, 4);
			for(var r = 0; r <= 360; r += 45) {
				c.save(); {
					c.rotate(Math.rad(r));
					c.fillRect(-1, -6, 2, 6);
				} c.restore();
			}
		} c.restore();
		c.save(); {
			c.translate(-2, -12);
			c.fillCircle(0, 0, 4);
			for(var r = 0; r <= 360; r += 45) {
				c.save(); {
					c.rotate(Math.rad(r));
					c.fillRect(-1, -6, 2, 6);
				} c.restore();
			}
		} c.restore();
	} c.restore();
});
MechBow.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Mechanical Bow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: " + this.range.substr(0, 1).toUpperCase() + this.range.substr(1, Infinity).toLowerCase(),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Firing Speed: Fast",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This automated crossbow-like device can shoot arrows much faster than regular ones.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	]
});
