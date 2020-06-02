function Stairs(x, y, numSteps, dir) {
	this.x = x;
	this.y = y;
	this.numSteps = numSteps;//each step is 20px * 20px
	this.dir = dir;
	if(this.dir === "right") {
		this.steps = [];
		for(var x = 0; x < this.numSteps * 20; x += 20) {
			this.steps.push(new Block(
				x + this.x, -this.numSteps * 20 + x + this.y,
				21, this.numSteps * 20 - x + 1,
				{
					obscuresLight: true,
					lightBlockingEdges: ["right", "top"],
					rayVertices: ["top-right", "top-left"]
				}
			));
		}
		this.steps[0].rayVertices.remove("top-left");
		this.steps.lastItem().rayVertices.push("bottom-right");
	}
	else {
		this.steps = [];
		for(var x = 0; x > -this.numSteps * 20; x -= 20) {
			this.steps.push(new Block(
				x - 20 + this.x, -this.numSteps * 20 - x + this.y,
				21, this.numSteps * 20 + x + 1,
				{
					obscuresLight: true,
					lightBlockingEdges: ["left", "top"],
					rayVertices: ["top-right", "top-left"]
				}
			));
		}
		this.steps[0].rayVertices.remove("top-right");
		this.steps.lastItem().rayVertices.push("bottom-left");
	}
};
Stairs.method("display", function() {
	utils.tempVars.partOfAStair = true;
	this.steps.forEach(step => { step.display(); });
	utils.tempVars.partOfAStair = false;
});
Stairs.method("update", function() {
	utils.tempVars.partOfAStair = true;
	this.steps.forEach(step => { step.update(); });
	utils.tempVars.partOfAStair = false;
});
Stairs.method("translate", function(x, y) {
	this.steps.forEach(step => {
		step.x += x, step.y += y;
	})
});
Stairs.method("reflect", function() {
	return new Stairs(-this.x, this.y, this.numSteps, (this.dir === "right" ? "left" : "right"));
});
