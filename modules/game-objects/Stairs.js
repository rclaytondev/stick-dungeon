function Stairs(x, y, numSteps, dir) {
	this.x = x;
	this.y = y;
	this.numSteps = numSteps;//each step is 20px * 20px
	this.dir = dir;
	if(this.dir === "right") {
		this.steps = [];
		for(var x = 0; x < this.numSteps * 20; x += 20) {
			this.steps.push(new Block(x + this.x, -this.numSteps * 20 + x + this.y, 21, this.numSteps * 20 - x + 1));
		}
	}
	else {
		this.steps = [];
		for(var x = 0; x > -this.numSteps * 20; x -= 20) {
			this.steps.push(new Block(x - 20 + this.x, -this.numSteps * 20 - x + this.y, 21, this.numSteps * 20 + x + 1));
		}
	}
};
Stairs.method("display", function() {
	utils.tempVars.partOfAStair = true;
	for(var i = 0; i < this.steps.length; i ++) {
		this.steps[i].display();
	}
	utils.tempVars.partOfAStair = false;
});
Stairs.method("update", function() {
	utils.tempVars.partOfAStair = true;
	for(var i = 0; i < this.steps.length; i ++) {
		this.steps[i].update();
	}
	utils.tempVars.partOfAStair = false;
});
Stairs.method("translate", function(x, y) {
	for(var i = 0; i < this.steps.length; i ++) {
		var step = this.steps[i];
		step.x += x;
		step.y += y;
	}
});
