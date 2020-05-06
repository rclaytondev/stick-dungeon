function Dragonling(x, y) {
	Enemy.call(this, x, y);
	this.destX = p.x;
	this.destY = p.y;
	this.pos = [];
	for(var i = 0; i < 30; i ++) {
		this.pos.push({ x: this.x, y: this.y });
	}
	this.rot = 0;
	this.mouth = 20;
	this.mouthDir = 0;
	this.currentAction = "bite";
	this.reload = 0;
	/* stats */
	this.damLow = 50;
	this.damHigh = 60;
	this.defLow = 50;
	this.defHigh = 60;
	this.health = 150;
	this.maxHealth = 150;
	this.name = "a dragonling";
	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -5,
		right: 5,
		top: -5,
		bottom: 20
	});
};
Dragonling.extend(Enemy);
Dragonling.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			/* back wing */
			c.globalAlpha = Math.constrain(self.opacity, 0, 1);
			c.fillStyle  = "rgb(0, 235, 0)";
			var p1 = {x: self.pos[25].x, y: self.pos[25].y};
			var slope = Math.normalize(self.pos[11].x - self.pos[5].x, self.pos[11].y - self.pos[5].y);
			var p2 = graphics3D.point3D((slope.x * 15) + self.pos[25].x, (slope.y * 15) + self.pos[25].y, 0.9);
			var p3 = graphics3D.point3D((-slope.x * 15) + self.pos[25].x, (-slope.y * 15) + self.pos[25].y, 0.9);
			var p4 = graphics3D.point3D(p1.x, p1.y, 0.8);
			c.fillPoly(p2, p4, p3, p1);
			/* mouth */
			c.fillStyle = "rgb(0, 255, 0)";
			c.save(); {
				c.translate(self.x, self.y);
				c.rotate(Math.rad(self.rot));
				c.fillPoly(
					0, -10,
					20, -20,
					self.mouth, -50,
					0, 10,
					-self.mouth, -50,
					-20, -20
				);
			} c.restore();
			/* tail */
			c.strokeStyle = "rgb(0, 255, 0)";
			c.lineWidth = 5;
			c.strokeLine.apply(c, self.pos);
			/* front wing */
			c.fillStyle = "rgb(20, 255, 20)";
			var p2 = graphics3D.point3D((slope.x * 15) + self.pos[25].x, (slope.y * 15) + self.pos[25].y, 1.1);
			var p3 = graphics3D.point3D((-slope.x * 15) + self.pos[25].x, (-slope.y * 15) + self.pos[25].y, 1.1);
			var p4 = graphics3D.point3D(p1.x, p1.y, 1.2);
			c.fillPoly(p2, p4, p3, p1);
		},
		1
	));
});
Dragonling.method("update", function(dest) {
	if(dest !== "player") {
		this.destX = dest.x;
		this.destY = dest.y;
	}
	/* move according to rotation */
	var theVel = Math.rotate(0, -10, this.rot);
	this.velocity.x += theVel.x / 100;
	this.velocity.y += theVel.y / 100;
	if(!this.frozen) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
	/* accelerate towards destination */
	var idealAngle = Math.calculateDegrees(this.x - this.destX, this.y - this.destY) - 90;
	var cw = Math.dist(this.rot, idealAngle + 360);
	var ccw = Math.dist(this.rot, idealAngle - 360);
	var normal = Math.dist(this.rot, idealAngle);
	var theClosest = Math.min(cw, ccw, normal);
	if(theClosest === cw) {
		this.rot -= 360;
	}
	else if(theClosest === ccw) {
		this.rot += 360;
	}
	this.rot += (this.rot < idealAngle) ? 2 : -2;
	/* update destination */
	if(this.currentAction === "bite") {
		this.destX = p.x;
		this.destY = p.y;
	}
	else if(this.currentAction === "shoot") {
		if(this.velocity.y > 0) {
			this.destX = this.x + (this.velocity.x > 0) ? 100 : -100;
			this.destY = this.y - 50;
		}
		else {
			this.destX = this.x;
			this.destY = this.y;
		}
	}
	/* bite mouth */
	if(collisions.objectIntersectsCircle(p, { x: this.x, y: this.y, r: 40 }) && this.mouthDir === 0 && this.currentAction === "bite") {
		this.mouthDir = -1;
		this.currentAction = "shoot";
	}
	if(this.mouth < 0) {
		this.mouthDir = 1;
	}
	if(this.mouth > 20 && this.mouthDir === 1) {
		this.mouthDir = 0;
	}
	this.mouth += this.mouthDir;
	/* shoot fireballs */
	var idealAngle = Math.calculateDegrees(this.x - p.x, this.y - p.y) - 90;
	if(this.reload > 120 && Math.dist(this.rot, idealAngle) <= 2 && Math.distSq(this.x, this.y, p.x, p.y) >= 10000) {
		game.dungeon[game.theRoom].content.push(new MagicCharge(this.x, this.y, theVel.x, theVel.y, "fire", Math.randomInRange(40, 50)));
		game.dungeon[game.theRoom].content.lastItem().shotBy = "enemy";
		this.currentAction = "bite";
		this.reload = 0;
	}
	this.reload ++;
	/* update hitbox */
	this.rot = Math.modulateIntoRange(this.rot, 0, 360);
	this.hitbox = new utils.geom.Rectangle({ left: -20, right: 20, top: -20, bottom: 20 });
	/* update tail position */
	this.pos.push({x: this.x, y: this.y});
	if(this.pos.length > 30) {
		this.pos.splice(0, 1);
	}
});
Dragonling.method("handleCollision", function() {

});
Dragonling.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.pos.forEach((point) => {
		point.x += x, point.y += y;
	});
});
Dragonling.method("onDoorEntry", function() {
	this.pos = [];
	for(var i = 0; i < 30; i ++) {
		this.pos.push({ x: this.x, y: this.y });
	}
	this.rot = Math.deg(Math.atan2(this.y - p.y, this.x - p.x)) - 90;
});
Dragonling.generationCriteria = function() {
	return game.dungeon[game.theRoom].getInstancesOf(Torch).length === 0;
};
