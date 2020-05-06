function Pulley(x1, w1, x2, w2, y, maxHeight) {
	this.x1 = x1;
	this.y1 = y;
	this.w1 = w1;
	this.x2 = x2;
	this.y2 = y;
	this.w2 = w2;
	this.velocity = { x: 0, y: 0 };
	this.ORIGINAL_Y = y;
	this.maxHeight = maxHeight;
};
Pulley.method("display", function() {
	function platform(x, y, w) {
		new Platform(x, y, w).display();
		c.lineWidth = 3;
		c.strokeStyle = "rgb(150, 150, 150)";
		graphics3D.line3D(x, y, 0.8999999, x, -100, 0.8999999, 3);
		graphics3D.line3D(x, y, 1.1, x, -100, 1.1, 3);
		graphics3D.line3D(x + w, y, 0.8999999, x + w, -100, 0.8999999, 3);
		graphics3D.line3D(x + w, y, 1.1, x + w, -100, 1.1, 3);
	};
	platform(this.x1, this.y1, this.w1);
	platform(this.x2, this.y2, this.w2);
});
Pulley.method("update", function() {
	new Platform(this.x1, this.y1, this.w1).update();
	new Platform(this.x2, this.y2, this.w2).update();
	/* Moving */
	this.steppedOn1 = false;
	this.steppedOn2 = false;
	if(p.x + p.hitbox.right > this.x1 && p.x + p.hitbox.left < this.x1 + this.w1 && p.canJump && this.y1 < this.ORIGINAL_Y + this.maxHeight) {
		this.velocity.y += (this.velocity.y < 3) ? 0.1 : 0;
		this.steppedOn1 = true;
	}
	if(p.x + p.hitbox.right > this.x2 && p.x + p.hitbox.left < this.x2 + this.w2 && p.canJump && this.y2 < this.ORIGINAL_Y + this.maxHeight) {
		this.velocity.y += (this.velocity.y > -3) ? -0.1 : 0;
		this.steppedOn2 = true;
	}
	this.y1 += this.velocity.y;
	this.y2 -= this.velocity.y;
	if(this.steppedOn1) {
		p.y += this.velocity.y;
	}
	else if(this.steppedOn2) {
		p.y -= this.velocity.y;
	}
	if(!this.steppedOn1 && !this.steppedOn2) {
		this.velocity.y = 0;
	}
	if(this.y1 > this.ORIGINAL_Y + this.maxHeight) {
		this.steppedOn1 = false;
	}
	if(this.y2 > this.ORIGINAL_Y + this.maxHeight) {
		this.steppedOn2 = false;
	}
});
Pulley.method("translate", function(x, y) {
	this.x1 += x;
	this.y1 += y;
	this.x2 += x;
	this.y2 += y;
});
