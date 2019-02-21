/** PRIMITIVES & CONSTANTS **/
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");
var fps = 60;
var mouseX;
var mouseY;
var mouseIsPressed;
var pMouseX = 400;
var pMouseY = 400;
var pMouseIsPressed = false;
var scrollDir = "none";
var cursor = "default";
function getMousePos(evt) {
	var canvasRect = canvas.getBoundingClientRect();
	mouseX = (evt.clientX - canvasRect.left) / (canvasRect.right - canvasRect.left) * canvas.width;
	mouseY = (evt.clientY - canvasRect.top) / (canvasRect.bottom - canvasRect.top) * canvas.height;
};
function onScroll(event) {
	var y = event.deltaY;
	if(y < 0) {
		scrollDir = "up";
	}
	else if(y > 0) {
		scrollDir = "down";
	}
	else {
		scrollDir = "none";
	}
};
document.addEventListener("wheel", onScroll);
function resizeCanvas() {
	if(window.innerWidth < window.innerHeight) {
		canvas.style.width = "100%";
		canvas.style.height = "";
	}
	else {
		canvas.style.width = "";
		canvas.style.height = "100%";
	}
	if(canvas.style.width === "100%") {
		canvas.style.top = (window.innerHeight / 2) - (window.innerWidth / 2) + "px";
		canvas.style.left = "0px";
	}
	else {
		canvas.style.left = (window.innerWidth / 2) - (window.innerHeight / 2) + "px";
		canvas.style.top = "0px";
	}
};

/** UTILITIES **/
function hslToRgb(h, s, l){
    var r, g, b;
    if(s == 0){
        r = g = b = l; // achromatic
    }
	else {
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) {
				t += 1;
			}
            if(t > 1) {
				t -= 1;
			}
            if(t < 1/6) {
				return p + (q - p) * 6 * t;
			}
            if(t < 1/2) {
				return q;
			}
            if(t < 2/3) {
				return p + (q - p) * (2/3 - t) * 6;
			}
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/** GUI OBJECTS **/
var guiOpen = "none";
var scroll = {
	y: 0,
	ideal: 0,
	max: "none"
};
var settings = {
	coords: true
};
var colorPicker = {
	h: 0,
	s: 0,
	l: 0,
	sqDragged: false,
	rectDragged: false
};
function grayBackground() {
	//gray out background
	c.fillStyle = "rgb(0, 0, 0)";
	c.globalAlpha = 0.5;
	c.fillRect(0, 0, 800, 800);
	c.globalAlpha = 1;
};
function scrollFade() {
	//fading
	for(var y = 0; y < 20; y ++) {
		c.fillStyle = "rgb(255, 255, 255)";
		c.globalAlpha = 1 - (y / 20);
		c.fillRect(205, 280 + y - 1, 390, 2);
		c.fillRect(205, 580 - y, 390, 2);
	}
	c.globalAlpha = 1;
	c.fillRect(205, 270, 390, 10);
};
function displayColorPicker() {
	mouseY -= scroll.y;
	c.lineWidth = 2;
	for(var x = 0; x < 200; x += 2) {
		for(var y = 0; y < 200; y += 2) {
			if(y + scroll.y > -20) {
				var col = "hsl(" + colorPicker.h / 200 * 360 + ", " + (x / 2) + "%, " + (y / 2) + "%)";
				c.strokeStyle = col;
				c.strokeRect(x + 275, y + 300, 2, 2);
			}
		}
	}
	//sat + brightness rect collisions and crosshair
	if(mouseX > 275 && mouseX < 475 && mouseY > 300 && mouseY < 500) {
		cursor = "crosshair";
		if(mouseIsPressed && !colorPicker.rectDragged) {
			colorPicker.sqDragged = true;
		}
	}
	if(!mouseIsPressed) {
		colorPicker.sqDragged = false;
	}
	if(colorPicker.sqDragged) {
		colorPicker.s = mouseX - 275;
		colorPicker.l = mouseY - 300;
	}
	colorPicker.s = (colorPicker.s > 0 && colorPicker.s < 200) ? colorPicker.s : (colorPicker.s <= 0 ? 0 : 200);
	colorPicker.l = (colorPicker.l > 0 && colorPicker.l < 200) ? colorPicker.l : (colorPicker.l <= 0 ? 0 : 200);
	if(colorPicker.l + 300 + scroll.y > 280) {
		c.strokeStyle = "rgb(0, 0, 0)";
		c.beginPath();
		c.arc(colorPicker.s + 275, colorPicker.l + 300, 5, 0, 2 * Math.PI);
		c.stroke();
	}
	//color picker - hue rect
	for(var y = 0; y < 200; y += 2) {
		if(y + scroll.y > -20) {
			c.strokeStyle = "hsl(" + Math.round(y / 200 * 360) + ", 100%, 50%)";
			c.beginPath();
			c.moveTo(495, y + 300);
			c.lineTo(525, y + 300);
			c.stroke();
		}
	}
	//hue rect collisions and crosshair
	if(mouseX > 495 && mouseX < 525 && mouseY > 300 && mouseY < 500) {
		cursor = "crosshair";
		if(mouseIsPressed && !colorPicker.sqDragged) {
			colorPicker.rectDragged = true;
		}
	}
	if(!mouseIsPressed) {
		colorPicker.rectDragged = false;
	}
	if(colorPicker.rectDragged) {
		colorPicker.h = mouseY - 300;
	}
	colorPicker.h = (colorPicker.h > 0 && colorPicker.h < 200) ? colorPicker.h : (colorPicker.h <= 0 ? 0 : 200);
	if(colorPicker.h + 300 + scroll.y > 280) {
		c.strokeStyle = "rgb(0, 0, 0)";
		c.beginPath();
		c.arc(510, colorPicker.h + 300, 5, 0, 2 * Math.PI);
		c.stroke();
	}
	mouseY += scroll.y;
};
function scrollBar() {
	
};
function button(x, y, w, h, dest, txt) {
	//button 1
	c.save();
	c.strokeStyle = "rgb(100, 100, 100)";
	c.lineWidth = 4;
	c.fillStyle = "rgb(255, 255, 255)";
	if(mouseX > x && mouseX < x + w && mouseY > y + scroll.y && mouseY < y + h + scroll.y) {
		c.fillStyle = "rgb(150, 150, 150)";
		if(mouseIsPressed) {
			guiOpen = dest;
		}
	}
	if(y + scroll.y < 580) {
		c.fillStyle = "rgb(255, 255, 255)";
		// c.fillRect(x, y, w, (y + h + scroll.y < 580) ? y + h : (580 - y - scroll.y));
		c.beginPath();
		c.moveTo(x, y);
		c.lineTo(x + w, y);
		c.stroke();
		c.beginPath();
		c.moveTo(x, y);
		c.lineTo(x, (y + h + scroll.y < 580) ? y + h : 580 - scroll.y);
		c.stroke();
		c.beginPath();
		c.moveTo(x + w, y);
		c.lineTo(x + w, (y + h + scroll.y < 580) ? y + h : 580 - scroll.y);
		c.stroke();
		if(y + scroll.y + h < 580) {
			c.beginPath();
			c.moveTo(x, y + h);
			c.lineTo(x + w, y + h);
			c.stroke();
		}
	}
	if(y + (h / 2) + scroll.y < 575) {
		c.textAlign = "center";
		c.fillStyle = "rgb(100, 100, 100)";
		c.font = "20px monospace";
		c.fillText(txt, x + (w / 2), y + (h / 2) + 5);
	}
	c.restore();
};
function gui(guiType) {
	if(guiType === "select-type") {
		grayBackground();
		//box
		c.fillStyle = "rgb(255, 255, 255)";
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillRect(200, 200, 400, 400);
		c.strokeRect(200, 200, 400, 400);
		//title
		c.fillStyle = "rgb(100, 100, 100)";
		c.font = "bold 20px monospace";
		c.textAlign = "center";
		c.fillText("Choose Shape Type", 400, 250);
		//buttons
		button(300, 300, 200, 50, "something relating to polygons", "Polygon");
		button(300, 370, 200, 50, "arc-color", "Arc");
	}
	else if(guiType === "arc-color") {
		grayBackground();
		scroll.max = 100;
		//box
		c.fillStyle = "rgb(255, 255, 255)";
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillRect(200, 200, 400, 400);
		c.strokeRect(200, 200, 400, 400);
		//title
		c.fillStyle = "rgb(100, 100, 100)";
		c.font = "bold 20px monospace";
		c.textAlign = "center";
		c.fillText("Select Color", 400, 250);
		//color picker - saturation and brightness rect
		c.save();
		c.translate(0, scroll.y);
		displayColorPicker();
		//rgb code for color picker
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "left";
		c.font = "20px monospace";
		if(scroll.y + 550 > 280) {
			var theCol = hslToRgb(colorPicker.h / 200, colorPicker.s / 200, colorPicker.l / 200);
			c.fillText("rgb(" + theCol[0] + ", " + theCol[1] + ", " + theCol[2] + ")", 270, 550);
		}
		//button
		button(300, 600, 200, 50, "arc-loc", "Ok");
		c.restore();
		//fading
		scrollFade();
	}
};

/** DRAWING OBJECTS **/
function Path(points, fillColor, strokeColor, fill, stroke) {
	this.points = points;
	this.fillColor = fillColor;
	this.strokeColor = strokeColor;
	this.fill = fill;
	this.stroke = stroke;
};
function Curve(x, y, r, startAngle, endAngle) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.startAngle = startAngle;
	this.endAngle = endAngle;
};
var scrollX = 400;
var scrollY = 400;
function doByTime() {
	resizeCanvas();
	cursor = "default";
	//background
	c.fillStyle = "rgb(255, 255, 255)";
	c.fillRect(0, 0, 800, 800);
	//coordinate plane
	if(settings.coords) {
		c.save();
		c.translate(scrollX % 10 + 400, scrollY % 10 + 400);
		for(var x = -410; x < 410; x += 10) {
			c.strokeStyle = "rgb(200, 200, 200)";
			c.beginPath();
			c.moveTo(x, -410);
			c.lineTo(x, 410);
			c.stroke();
		}
		for(var y = -410; y < 410; y += 10) {
			c.strokeStyle = "rgb(200, 200, 200)";
			c.beginPath();
			c.moveTo(-410, y);
			c.lineTo(410, y);
			c.stroke();
		}
		c.restore();
	}
	//axes
	c.strokeStyle = "rgb(0, 0, 0)";
	c.beginPath();
	c.moveTo(scrollX, 0);
	c.lineTo(scrollX, 800);
	c.stroke();
	c.beginPath();
	c.moveTo(0, scrollY);
	c.lineTo(800, scrollY);
	c.stroke();
	//new shape button
	c.strokeStyle = "rgb(100, 100, 100)";
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillRect(10, 10, 30, 30);
	c.fillStyle = "rgb(100, 100, 100)";
	c.textAlign = "center";
	c.font = "bold 20px monospace";
	c.fillText("+", 25, 28);
	if(mouseX > 10 && mouseX < 40 && mouseY > 10 && mouseY < 40 && mouseIsPressed) {
		guiOpen = "select-type";
	}
	if(mouseIsPressed && pMouseX !== undefined && guiOpen === "none") {
		//cursor = "all-scroll";
		scrollX += (mouseX - pMouseX);
		scrollY += (mouseY - pMouseY);
	}
	//guis
	gui(guiOpen);
	//mouse cursors
	pMouseX = mouseX;
	pMouseY = mouseY;
	pMouseIsPressed = mouseIsPressed;
	canvas.style.cursor = cursor;
	if(guiOpen !== "none") {
		if(scrollDir === "up" && scroll.ideal < 0) {
			scroll.ideal += 20;
			scrollDir = "none";
		}
		else if(scrollDir === "down" && scroll.ideal > -scroll.max) {
			scroll.ideal -= 20;
			scrollDir = "none";
		}
		scroll.y += (scroll.ideal - scroll.y) / 2.5;
	}
	window.setTimeout(doByTime, 1000 / fps);
};
window.setTimeout(doByTime, 1000 / fps);