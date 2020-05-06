function LongBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "longbow";
	this.range = "very long";
	this.reload = 2;
	this.damLow = (p.class === "archer") ? 90 : 80;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 5;
};
LongBow.extend(RangedWeapon);
LongBow.method("display", function(type) {
	type = type || "item";
	c.save(); {
		if(type === "aiming") {
			c.translate(-10, 0);
			c.scale(0.9, 0.9);
			c.rotate(Math.rad(45));
		}
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeArc(-5, 5, 23, Math.rad(225 - 11), Math.rad(405 + 11));
		c.lineWidth = 1;
		/* bowstring */
		c.strokeLine(-22, -13, 13, 22);
		/* 2nd bowstring */
		c.strokeLine(-13, -15, 15, 13);
	} c.restore();
});
LongBow.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Longbow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh + " [more if farther away]",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Firing Speed: Slow",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: " + this.range.substr(0, 1).toUpperCase() + this.range.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This large bow can shoot over an immense distance, and, surprisingly, hurts enemies more if shot from farther away.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
