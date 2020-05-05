function Particle(color, x, y, velX, velY, size) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.z = 1;
	this.velocity = { x: velX, y: velY };
	this.size = size;
	this.opacity = 1;
};
Particle.method("display", function() {
	var self = this;
	var center = graphics3D.point3D(this.x, this.y, this.z);
	var radius = this.size * this.z;
	var display = function() {
		c.save(); {
			c.fillStyle = self.color;
			c.globalAlpha = Math.max(self.opacity, 0);
			c.fillCircle(center.x, center.y, radius);
		} c.restore();
	};
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			display,
			this.z
		)
	);
});
Particle.method("update", function() {
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.opacity -= 0.05;
	this.toBeRemoved = (this.opacity <= 0);
});

/*
Particle constructor - settings object properties:
 - `color`: an rgb string for the color of the particle.
 - `opacity`: a number between 0 and 1 representing the initial opacity of the particle (default is 1)
 - `opacityDecay`: how much to decrease the opacity by for the particle to fade out.
 - `size`: the size of the particle (not used for custom `shape` values)
 - `shape`: this can be either:
	- a string, with the values "circle" for a circular particle or "polygon-<n>" for a n-sided polygon
	- a function to draw the particle. This function should assume the particle should be drawn at (0, 0).
 - `movement`: this can be either:
	- a string, with the values "drift" (to move only according to its velocity) or "fall" (like drift, but y-velocity increases over time)
	- a function (with the `this`-value being the particle) to move the particle in a custom way
 - `velocity`: multiple possible values:
 	- an object with x and y properties for the x and y velocities
	- a single number to randomize; e.g. `velocity: 3` will make the x and y velocities between -3 and 3.
 - `gravity`: how much to increase the y-velocity by each frame, for particles with movement="fall". (See `movement` property)
 - `depth`: this is the how far back the particle is on the screen. (Middle of floor is depth=1, back is 0.9, and front is 1.1).
*/
function Particle(x, y, settings) {
	this.x = x;
	this.y = y;
	if(typeof settings.velocity === "number") {
		this.velocity = {
			x: Math.randomInRange(-settings.velocity, settings.velocity),
			y: Math.randomInRange(-settings.velocity, settings.velocity)
		};
	}
	else {
		this.velocity = settings.velocity;
	}
	this.color = settings.color;
	this.opacity = settings.opacity || 1;
	this.opacityDecay = settings.opacityDecay || 1/20;
	this.size = settings.size;
	this.sizeDecay = settings.sizeDecay || 0;
	this.shape = settings.shape || "circle";
	this.movement = settings.movement || "drift";
	this.destination = settings.destination || null;
	this.depth = settings.depth || 1;
	this.gravity = settings.gravity || 0.1;
	this.rotation = settings.rotation || 0;
};
Particle.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.save(); {
				c.fillStyle = self.color;
				c.globalAlpha = self.opacity;
				var location = graphics3D.point3D(self.x, self.y, self.depth);
				var radius = self.size * self.depth;
				if(typeof self.shape === "function") {
					c.translate(location.x, location.y);
					c.scale(self.depth, self.depth);
					c.rotate(Math.rad(self.rotation));
					self.shape();
				}
				else if(self.shape === "circle") {
					c.fillCircle(location.x, location.y, radius);
				}
				else if(self.shape.startsWith("polygon")) {
					var numSides = parseInt(/^polygon-(\d+)/g.exec(self.shape)[1]);
					var points = [];
					for(var i = 0; i < numSides; i ++) {
						points.push(Math.rotate(self.size, 0, Math.map(i, 0, numSides, 0, 360)));
					}
					c.translate(location.x, location.y);
					c.rotate(Math.rad(self.rotation));
					c.fillPoly(points);
				}
			} c.restore();
		},
		this.depth
	));
});
Particle.method("update", function() {
	if(typeof this.movement === "function") {
		this.movement();
	}
	else {
		if(this.movement === "seek" && this.destination !== null && !Math.arePointsCollinear(
			{ x: this.x, y: this.y },
			{ x: this.x + this.velocity.x, y: this.velocity.y },
			this.destination
		)) {
			var speed = Math.dist(0, 0, this.velocity.x, this.velocity.y);
			var velocity = Math.normalize(this.destination.x - this.x, this.destination.y - this.y);
			velocity.x *= speed, velocity.y *= speed;
			this.velocity = velocity;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		if(this.movement === "fall") {
			this.y += this.gravity;
		}
	}
	this.size -= this.sizeDecay;
	this.opacity -= this.opacityDecay;
	this.opacity = Math.constrain(this.opacity, 0, 1);
	if(this.opacity <= 0) {
		this.toBeRemoved = true;
	}
});
