function EnergyStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.name = "staff";
	this.chargeType = "energy";
	this.manaCost = (this.modifier === "none") ? 40 : (this.modifier === "arcane" ? 50 : 30);
	this.damLow = (p.class === "mage") ? 80 : 70; // 47.5 damage average with 1/2 damage nerf
	this.damHigh = (p.class === "mage") ? 110 : 100;
	this.power = 3;
};
EnergyStaff.extends(MagicWeapon);
EnergyStaff.method("display", function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		c.strokeLine(0, -10, 0, 30);
		c.strokeArc(0, -14, 5, Math.rad(180), Math.rad(90));
	} c.restore();
});
EnergyStaff.method("getDesc", function() {
	return [
		{
			content: (this.modifier === "none" ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Energy",
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
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Shoots a bolt of magical energy.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
