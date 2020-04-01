function Arrow(quantity) {
	RangedWeapon.call(this);
	this.name = "arrow";
	this.quantity = quantity;
	this.damLow = "depends on what bow you use";
	this.damHigh = "depends on what bow you use";
	this.stackable = true;
};
Arrow.extends(RangedWeapon);
Arrow.method("display", function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeLine(10, -10, -10, 10);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			{ x: 10, y: -10 },
			{ x: 10, y: -10 + 8 },
			{ x: 20, y: -20 },
			{ x: 10 - 8, y: -10 }
		);
		c.lineWidth = 1;
		c.strokeStyle = "rgb(139, 69, 19)";
		for(var x = 0; x < 10; x += 3) {
			c.strokeLine(-x, x, -x, x + 8);
			c.strokeLine(-x, x, -x - 8, x);
		}
	}
});
Arrow.method("getDesc", function() {
	return [
		{
			content: "Arrow [" + this.quantity + "]",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "It's an arrow. You can shoot it with a bow",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
