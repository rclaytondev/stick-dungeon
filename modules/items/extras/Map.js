function Map() {
	Extra.call(this);
	this.name = "map";
};
Map.extend(Extra);
Map.method("display", function() {
	c.save(); {

		c.fillStyle = "rgb(255, 255, 200)";
		c.fillRect(-20, -20, 40, 40);

		c.fillStyle = "rgb(255, 0, 0)";
		c.fillText("x", 10, -10);

		c.strokeStyle = "rgb(0, 0, 0)";
		c.setLineDash([3, 3]);
		c.lineWidth = 1;
		c.strokeLine(
			10, -5,
			10, 5,
			-5, 5,
			-20, 20
		)
	} c.restore();
});
Map.method("getDesc", function() {
	return [
		{
			content: "Map",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Shows you the way",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Dead ends are marked with x's. Unexplored doors are marked with a '?'. Doors eventually leading to unexplored doors are marked with arrows.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
Map.method("whenItemHeld", function() {
	var highlighedDoor = Map.getHighlightedDoor();
	if(highlighedDoor === null) {
		return;
	}
	const DOOR_PARTICLE_MARGIN = 5; // distance between particles and door
	if(highlighedDoor.type === "arch") {
		var particleLocations = [];
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x - 35 - DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x - 35 - DOOR_PARTICLE_MARGIN, highlighedDoor.y - 60
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x + 35 + DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x + 35 + DOOR_PARTICLE_MARGIN, highlighedDoor.y - 60
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x - 35 - DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x + 35 + DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN
		));
		particleLocations = particleLocations.concat(Math.findPointsCircular(
			highlighedDoor.x, highlighedDoor.y - 60,
			35 + DOOR_PARTICLE_MARGIN,
			[1, 4]
		));
	}
	else {
		var particleLocations = [];
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x - 30 - DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x - 30 - DOOR_PARTICLE_MARGIN, highlighedDoor.y - 90 - DOOR_PARTICLE_MARGIN
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x + 30 + DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x + 30 + DOOR_PARTICLE_MARGIN, highlighedDoor.y - 90 - DOOR_PARTICLE_MARGIN
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x - 30 - DOOR_PARTICLE_MARGIN, highlighedDoor.y - 90 - DOOR_PARTICLE_MARGIN,
			highlighedDoor.x + 30 + DOOR_PARTICLE_MARGIN, highlighedDoor.y - 90 - DOOR_PARTICLE_MARGIN
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			highlighedDoor.x - 30 - DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN,
			highlighedDoor.x + 30 + DOOR_PARTICLE_MARGIN, highlighedDoor.y + DOOR_PARTICLE_MARGIN
		));
	}
	const PARTICLE_DENSITY = 3; // number of new particles to be added each new frame
	for(var i = 0; i < PARTICLE_DENSITY; i ++) {
		var location = particleLocations.randomItem();
		var particle = new Particle(
			location.x + Math.randomInRange(-2, 2), location.y + Math.randomInRange(-2, 2),
			{
				velocity: 0,
				color: "rgb(255, 255, 255)",
				shape: function() {
					c.fillStyle = "rgb(255, 255, 255)";
					c.beginPath();
					c.moveTo(0, this.size);
					c.arc(-this.size, -this.size, this.size, Math.rad(0), Math.rad(90));
					c.arc(this.size, -this.size, this.size, Math.rad(90), Math.rad(180));
					c.arc(this.size, this.size, this.size, Math.rad(180), Math.rad(270));
					c.arc(-this.size, this.size, this.size, Math.rad(270), Math.rad(360));
					c.fill("evenodd");
				},
				size: 7,
				opacityDecay: 1 / 40,
				depth: 0.91
			}
		);
		game.dungeon[game.inRoom].content.push(particle);
	}

	/* add arrow for when door is offscreen */
	const OFFSCREEN_BUFFER = -50;
	var doorPosition = {
		x: highlighedDoor.x + game.camera.getOffsetX(),
		y: highlighedDoor.y + game.camera.getOffsetY(),
	};
	if(
		doorPosition.x < -OFFSCREEN_BUFFER || doorPosition.x > canvas.width + OFFSCREEN_BUFFER ||
		doorPosition.y < -OFFSCREEN_BUFFER || doorPosition.y > canvas.height + OFFSCREEN_BUFFER
	) {
		var position = Math.normalize(doorPosition.x - (canvas.width / 2), doorPosition.y - (canvas.height / 2));
		var scaledPosition = position.clone();
		if(Math.abs(position.x) > Math.abs(position.y)) {
			if(position.x < 0) {
				var scaleFactor = -(canvas.width / 2) / position.x;
			}
			else {
				var scaleFactor = (canvas.width / 2) / position.x;
			}
		}
		else {
			if(position.y < 0) {
				var scaleFactor = -(canvas.height / 2) / position.y;
			}
			else {
				var scaleFactor = (canvas.height / 2) / position.y;
			}
		}
		scaledPosition.x *= scaleFactor, scaledPosition.y *= scaleFactor;
		scaledPosition.x += (canvas.width / 2), scaledPosition.y += (canvas.height / 2);

		scaledPosition = Math.scaleAboutPoint(scaledPosition.x, scaledPosition.y, canvas.width / 2, canvas.height / 2, 0.9, 0.9);

		var arrowRotation = Math.deg(Math.atan2(
			scaledPosition.y - (canvas.height / 2),
			scaledPosition.x - (canvas.width / 2)
		)) + 90;
		const ARROW_SIZE = 30;
		var endPoint1 = Math.rotate(-ARROW_SIZE, ARROW_SIZE, arrowRotation);
		var endPoint2 = Math.rotate(ARROW_SIZE, ARROW_SIZE, arrowRotation);
		endPoint1.x += scaledPosition.x, endPoint1.y += scaledPosition.y;
		endPoint2.x += scaledPosition.x, endPoint2.y += scaledPosition.y;

		var particleLocations = [];
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			scaledPosition.x, scaledPosition.y,
			endPoint1.x, endPoint1.y
		));
		particleLocations = particleLocations.concat(Math.findPointsLinear(
			scaledPosition.x, scaledPosition.y,
			endPoint2.x, endPoint2.y
		));

		const ARROW_PARTICLE_DENSITY = 30;
		for(var i = 0; i < ARROW_PARTICLE_DENSITY; i ++) {
			var location = particleLocations.randomItem();
			var particle = new Particle(
				location.x, location.y,
				{
					velocity: 0,
					color: "rgb(255, 255, 255)",
					shape: function() {
						c.fillStyle = "rgb(255, 255, 255)";
						c.beginPath();
						c.moveTo(0, this.size);
						c.arc(-this.size, -this.size, this.size, Math.rad(0), Math.rad(90));
						c.arc(this.size, -this.size, this.size, Math.rad(90), Math.rad(180));
						c.arc(this.size, this.size, this.size, Math.rad(180), Math.rad(270));
						c.arc(-this.size, this.size, this.size, Math.rad(270), Math.rad(360));
						c.fill("evenodd");
					},
					size: 7,
					opacityDecay: 1 / 8,
					depth: 0.91
				}
			);
			particle.absolutePosition = true;
			game.dungeon[game.inRoom].content.push(particle);
		}
	}
});
Map.getHighlightedDoor = function() {
	var room = game.dungeon[game.inRoom];
	var doors = room.getInstancesOf(Door);
	var unBarricaded = doors.filter(door => !door.barricaded);
	if(unBarricaded.length === 1) {
		return unBarricaded.onlyItem();
	}
	else if(unBarricaded.length === 0) {
		return null;
	}
	if(room.containsUnexploredDoor()) {
		var unexplored = unBarricaded.filter(door => typeof door.dest !== "number");
		var rewardDoors = unexplored.filter(door => door.dest.includes("reward"));
		if(rewardDoors.length > 0) {
			return rewardDoors.min(door => Math.dist(door.x, door.y, p.x, p.y));
		}
		else {
			return unexplored.min(door => Math.dist(door.x, door.y, p.x, p.y));
		}
	}
	else {
		unBarricaded.forEach(door => {
			var destinationRoom = door.getDestinationRoom();
			destinationRoom.mapDistance = Map.calculatePaths(destinationRoom, door);
		});
		return unBarricaded.min(door => Math.dist(door.x, door.y, p.x, p.y) + door.getDestinationRoom().mapDistance);
	}
};
Map.calculatePaths = function(room, entrance) {
	/*
	This function returns the distance between this room and the nearest unexplored door. The distance represents the sum of the distance in pixels between each door and the next.
	The parameter `entrance` is the door that leads toward the room currently occupied by the player (and therefore must not be checked, to prevent infinite recursion).
	*/
	if(room.containsUnexploredDoor()) {
		var unexploredDoors = room.getInstancesOf(Door).filter(door => typeof door.dest !== "number");
		var closestUnexplored = unexploredDoors.min(door => Math.dist(door.x, door.y, entrance.x, entrance.y));
		return Math.dist(closestUnexplored.x, closestUnexplored.y, entrance.x, entrance.y);
	}
	else if(room.getInstancesOf(Door).length > 1) {
		var doors = room.getInstancesOf(Door).filter(door => door !== entrance);
		doors.forEach(door => {
			var destinationRoom = door.getDestinationRoom();
			// `mapDistance` property is the distance you would have to go to get to the nearest unexplored door from that door.
			destinationRoom.mapDistance = Map.calculatePaths(destinationRoom, door.getDestinationDoor());
		});
		var closest = doors.min(door => Math.dist(door.x, door.y, entrance.x, entrance.y) + door.getDestinationRoom().mapDistance);
		return Math.dist(closest.x, closest.y, entrance.x, entrance.y) + closest.getDestinationRoom().mapDistance;
	}
	else {
		return Infinity;
	}
};
testing.addTest({
	run: function() {
		testing.resetter.resetGameState();
		game.dungeon = [testing.utils.emptyRoom("floor-only")];
		var unexploredDoor = new Door(-250, 0, ["this door has not been generated"]);
		var exploredDoor = new Door(250, 0, 12345);
		game.dungeon[0].content.push(unexploredDoor);
		game.dungeon[0].content.push(exploredDoor);
		testing.assertEqual(Map.getHighlightedDoor(), unexploredDoor);
	},
	unit: "Map.getHighlightedDoor()",
	name: "map leads to unexplored doors"
});
testing.addTest({
	run: function() {
		testing.resetter.resetGameState();
		game.dungeon = [testing.utils.emptyRoom("floor-only")];
		var rewardDoor = new Door(500, 0, ["reward"]);
		var otherDoor = new Door(0, 0, ["combat"]);
		game.dungeon[0].content.push(rewardDoor);
		game.dungeon[0].content.push(otherDoor);
		testing.assertEqual(Map.getHighlightedDoor(), rewardDoor);
	},
	unit: "Map.getHighlightedDoor()",
	name: "map prioritizes reward rooms over other rooms"
})
testing.addTest({
	run: function() {
		testing.resetter.resetGameState();
		game.dungeon = [testing.utils.emptyRoom("floor-only")];

		var deadEndDoor = new Door(0, 0, null);
		deadEndDoor.containingRoomID = 0;
		game.dungeon[0].content.push(deadEndDoor);
		testing.utils.addRoomFromDoor("reward1", deadEndDoor);
		var door = new Door(250, 0, null);
		game.dungeon[0].content.push(door);
		testing.utils.addRoomFromDoor("ambient2", door);

		/* assert that the map points toward the door not leading to a dead end */
		testing.assertEqual(Map.getHighlightedDoor(), door);

		/* move the player into the dead end + assert that the map points the way out */
		game.inRoom = 1;
		testing.assertEqual(Map.getHighlightedDoor(), game.dungeon[1].getInstancesOf(Door)[0]);
	},
	unit: "Map.getHighlightedDoor()",
	name: "map does not lead to dead-ends"
});
testing.addTest({
	run: function() {
		testing.resetter.resetGameState();
		game.dungeon = [testing.utils.emptyRoom("floor-only")];

		var door1 = new Door(-100, 0, null);
		door1.containingRoomID = 0;
		game.dungeon[0].content.push(door1);
		testing.utils.addRoomFromDoor("ambient2", door1);

		var door2 = new Door(100, 0, null);
		door2.containingRoomID = 0;
		game.dungeon[0].content.push(door2);
		testing.utils.addRoomFromDoor("combat3", door2);

		testing.assertEqual(Map.getHighlightedDoor(), door1);
		testing.utils.exit();
	},
	unit: "Map.getHighlightedDoor()",
	name: "map leads to the shortest route"
})
