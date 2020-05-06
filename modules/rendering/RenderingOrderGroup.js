function RenderingOrderGroup(objects, zOrder) {
	/*
	Represents a group of objects with the same depth that can be rendered in any order since they're all at the same depth.
	*/
	this.objects = objects || [];
	this.zOrder = zOrder || 0;
};
RenderingOrderGroup.method("display", function() {
	this.objects.forEach(obj => { obj.display(); });
});
