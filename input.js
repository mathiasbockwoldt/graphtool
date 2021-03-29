'use strict';


Graphtool.prototype.mv_touch_start_node = function(event) {
	event.preventDefault();
	event.stopPropagation();

	if(event.which !== 0) {
		// So far, don't accept second finger
		return;
	}

	this.mv_node = event.target.parentNode;

	this.mv_orig_x = Number(this.mv_node.getAttribute('graph:cx')) * this.scale;
	this.mv_orig_y = Number(this.mv_node.getAttribute('graph:cy')) * this.scale;

	this.mv_dx = event.touches[event.which].clientX;
	this.mv_dy = event.touches[event.which].clientY;
};


Graphtool.prototype.mv_mouse_start_node = function(event) {
	event.preventDefault();
	event.stopPropagation();

	this.mv_node = event.target.parentNode;

	this.mv_orig_x = Number(this.mv_node.getAttribute('graph:cx')) * this.scale;
	this.mv_orig_y = Number(this.mv_node.getAttribute('graph:cy')) * this.scale;

	this.mv_dx = event.clientX;
	this.mv_dy = event.clientY;
};


Graphtool.prototype.mv_touch_start_canvas = function(event) {
	event.preventDefault();
	event.stopPropagation();

	if(event.which !== 0) {
		// So far, don't accept second finger
		return;
	}

	this.mv_orig_x = this.x_pos;
	this.mv_orig_y = this.y_pos;

	this.mv_canvas = event.target;

	this.mv_dx = event.touches[event.which].clientX;
	this.mv_dy = event.touches[event.which].clientY;
};


Graphtool.prototype.mv_mouse_start_canvas = function(event) {
	event.preventDefault();
	event.stopPropagation();

	this.mv_orig_x = this.x_pos;
	this.mv_orig_y = this.y_pos;

	this.mv_canvas = event.target;

	this.mv_dx = event.clientX;
	this.mv_dy = event.clientY;
};


Graphtool.prototype.mv_touch_move = function(event) {
	event.preventDefault();
	if(event.which !== 0) {
		// So far, don't accept second finger
		return;
	}

	if(this.mv_node) {
		this.mv_move_node(
			event.touches[event.which].clientX - this.mv_dx,
			event.touches[event.which].clientY - this.mv_dy
		);
	}
	else if(this.mv_canvas) {
		this.mv_move_canvas(
			event.touches[event.which].clientX - this.mv_dx,
			event.touches[event.which].clientY - this.mv_dy
		);
	}
};


Graphtool.prototype.mv_mouse_move = function(event) {
	event.preventDefault();

	if(this.mv_node) {
		this.mv_move_node(
			event.clientX - this.mv_dx,
			event.clientY - this.mv_dy
		);
	}
	else if(this.mv_canvas) {
		this.mv_move_canvas(
			event.clientX - this.mv_dx,
			event.clientY - this.mv_dy
		);
	}
};


Graphtool.prototype.mv_move_node = function(new_x, new_y) {
	new_x = (this.mv_orig_x + new_x) / this.scale;
	new_y = (this.mv_orig_y + new_y) / this.scale;
	this.mv_node.setAttribute('graph:cx', new_x);
	this.mv_node.setAttribute('graph:cy', new_y);
	this.mv_node.setAttribute('transform', 'translate(' + new_x + ', ' + new_y + ')');
	this.update_lines(this.mv_node.getAttribute('graph:num'));
};


Graphtool.prototype.mv_move_canvas = function(new_x, new_y) {
	this.x_pos = this.mv_orig_x - new_x;
	this.y_pos = this.mv_orig_y - new_y;
	this.update_viewbox();
};


Graphtool.prototype.mv_wheel_zoom = function(event) {
	if(event.deltaY < 0) {
		this.mv_zoom_in();
	}
	else {
		this.mv_zoom_out();
	}
};


Graphtool.prototype.mv_zoom_in = function(event) {
	// Some rounding to make sure we end up at 1.0 again if zooming in and out
	const new_scale = Math.round(this.scale * 1250) / 1000;
	if(new_scale < 10) {
		this.mv_zoom(new_scale);
	}
};


Graphtool.prototype.mv_zoom_out = function(event) {
	// Some rounding to make sure we end up at 1.0 again if zooming in and out
	const new_scale = Math.round(this.scale * 800) / 1000;
	if(new_scale > 0.1) {
		this.mv_zoom(new_scale);
	}
};


Graphtool.prototype.mv_zoom = function(factor) {
	this.scale = factor;

	console.log(this.scale);

	this.update_viewbox();
};


Graphtool.prototype.mv_end = function(event) {
	event.preventDefault();

	this.mv_node = null;
	this.mv_canvas = null;
};
