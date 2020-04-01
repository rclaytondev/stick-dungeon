function MagicQuiver(modifier) {
	Equipable.call(this, modifier);
	this.name = "quiver";
	this.defLow = (this.modifier === "sturdy") ? 5 : 0;
	this.defHigh = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.arrowEfficiency = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 2;
};
MagicQuiver.extends(Equipable);
MagicQuiver.method("display", function() {
	c.save(); {
		c.fillStyle = "rgb(139, 69, 19)";
		c.translate(-5, 5);
		c.rotate(Math.rad(45));
		c.fillRect(-10, -20, 20, 40);
		c.fillCircle(0, 20, 10);
		game.dungeon[game.theRoom].displayImmediately(function() {
			new ShotArrow(-3, -20, 0, -2).display();
			new ShotArrow(3, -30, 0, -2).display();
		});
	} c.restore();
});
MagicQuiver.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity) + " ") + "Magic Quiver",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + ((this.defHigh > 0) ? (this.defLow + "-" + this.defHigh) : this.defHigh),
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Arrow Efficiency: " + this.arrowEfficiency + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "For some reason, arrows placed inside this quiver are able to be shot multiple times.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
});
