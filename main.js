'use strict';


function Graphtool() {
	this.canvas = null;

	this.num_nodes = 0;
	this.num_lines = 0;

	this.nodes = [];
	this.lines = [];
	this.ends = [];
	this.starts = [];

	this.svg_bb = null;
	this.x_pos = 0;
	this.y_pos = 0;
	this.svg_width = 300;
	this.svg_height = 150;
	this.scale = 1;
	this.viewbox_width = this.svg_width;
	this.viewbox_height = this.svg_height;

	this.mv_dx = 0;
	this.mv_dy = 0;
	this.mv_orig_x = 0;
	this.mv_orig_y = 0;
	this.mv_node = null;
	this.mv_canvas = null;

	this.distance = 10;
}


Graphtool.prototype.update_viewbox = function() {
	this.canvas.setAttribute('viewBox',
		`${this.x_pos} ${this.y_pos} ${this.svg_width/this.scale} ${this.svg_height/this.scale}`);
};


Graphtool.prototype.setup_buttons = function() {
	document.getElementById('btn_zoomin').addEventListener('click', this.mv_zoom_in.bind(this));
	document.getElementById('btn_zoomout').addEventListener('click', this.mv_zoom_out.bind(this));
};


Graphtool.prototype.setup_svg = function(target) {
	this.canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	document.getElementById(target).appendChild(this.canvas);
	this.svg_bb = this.canvas.getBoundingClientRect();
	this.svg_width = this.svg_bb.width;
	this.svg_height = this.svg_bb.height;
	this.viewbox_width = this.svg_width;
	this.viewbox_height = this.svg_height;
	this.x_pos = 0;
	this.y_pos = 0;
	this.update_viewbox();
	this.canvas.addEventListener('touchmove', this.mv_touch_move.bind(this));
	this.canvas.addEventListener('mousemove', this.mv_mouse_move.bind(this));
	this.canvas.addEventListener('touchend', this.mv_end.bind(this));
	this.canvas.addEventListener('touchcancel', this.mv_end.bind(this));
	this.canvas.addEventListener('mouseup', this.mv_end.bind(this));
	this.canvas.addEventListener('touchstart', this.mv_touch_start_canvas.bind(this));
	this.canvas.addEventListener('mousedown', this.mv_mouse_start_canvas.bind(this));
	this.canvas.addEventListener('wheel', this.mv_wheel_zoom.bind(this));
	this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

	const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
	this.canvas.appendChild(defs);

	const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
	triangle.setAttribute('id', 'triangle');
	triangle.setAttribute('orient', 'auto');
	triangle.setAttribute('markerWidth', '16');
	triangle.setAttribute('markerHeight', '10');
	triangle.setAttribute('refX', '8');
	triangle.setAttribute('refY', '5');
	defs.appendChild(triangle);

	const triangle_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	triangle_path.setAttribute('d', 'M0,0 V10 L16,5 Z');
	triangle.appendChild(triangle_path);

	const bar = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
	bar.setAttribute('id', 'bar');
	bar.setAttribute('orient', 'auto');
	bar.setAttribute('markerWidth', '2');
	bar.setAttribute('markerHeight', '12');
	bar.setAttribute('refX', '1');
	bar.setAttribute('refY', '6');
	defs.appendChild(bar);

	const bar_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	bar_path.setAttribute('d', 'M0,0 V12 H2 V-12 Z');
	bar.appendChild(bar_path);
};


Graphtool.prototype.load_example = function() {
	this.add_circle(100, 100, 20, 'green');
	this.add_ellipse(400, 600, 120, 60, 'red');
	this.add_circle(340, 200, 50, 'blue');
	this.add_ellipse(600, 95, 20, 80, 'black');
	this.add_rectangle(540, 200, 200, 50, 'purple');
	this.add_rectangle(150, 295, 20, 80, 'teal');
	this.add_line(this.nodes[0], this.nodes[1], 'triangle');
	this.add_line(this.nodes[0], this.nodes[2], 'triangle');
	this.add_line(this.nodes[3], this.nodes[0], 'bar');
	this.add_line(this.nodes[2], this.nodes[1], 'bar');
	this.add_line(this.nodes[4], this.nodes[5], 'triangle');
	this.add_line(this.nodes[5], this.nodes[2], 'bar');
};


Graphtool.prototype.update_lines = function(num) {
	for(let i = 0; i < this.starts[num].length; i++) {
		this.calc_line_pos(this.starts[num][i]);
	}

	for(let i = 0; i < this.ends[num].length; i++) {
		this.calc_line_pos(this.ends[num][i]);
	}
};


Graphtool.prototype.calc_line_pos = function(line) {
	const from = this.nodes[line.getAttribute('graph:from')];
	const to = this.nodes[line.getAttribute('graph:to')];

	const from_type = from.getAttribute('graph:type');
	const to_type = to.getAttribute('graph:type');

	const from_x = Number(from.getAttribute('graph:cx'));
	const from_y = Number(from.getAttribute('graph:cy'));
	const to_x = Number(to.getAttribute('graph:cx'));
	const to_y = Number(to.getAttribute('graph:cy'));

	const angle = Math.atan2(
		from_x - to_x,
		from_y - to_y
	);
	const sin_angle = Math.sin(angle);
	const cos_angle = Math.cos(angle);

	let from_r, to_r;

	if(from_type === 'rect') {
		let dx = this.distance + Number(from.getAttribute('graph:height')) / 2;
		let dy = this.distance + Number(from.getAttribute('graph:width')) / 2;
		if(cos_angle <= 0) {
			dx = - dx
		}
		if(sin_angle <= 0) {
			dy = - dy
		}

		if(Math.abs(dx * sin_angle) < Math.abs(dy * cos_angle)) {
			dy = (dx * sin_angle) / cos_angle;
		}
		else {
			dx = (dy * cos_angle) / sin_angle;
		}

		from_r = Math.sqrt(dx**2 + dy**2);
	}
	else if(from_type === 'ellipse') {
		const from_rx =  + Number(from.getAttribute('graph:rx'));
		const from_ry =  + Number(from.getAttribute('graph:ry'));
		from_r = this.distance + Math.sqrt(1/((sin_angle / from_rx)**2 + (cos_angle / from_ry)**2));
	}
	else {  // Circle is default
		from_r = this.distance + Number(from.getAttribute('graph:r'));
	}

	if(to_type === 'rect') {
		let dx = this.distance + Number(to.getAttribute('graph:height')) / 2;
		let dy = this.distance + Number(to.getAttribute('graph:width')) / 2;
		if(cos_angle <= 0) {
			dx = - dx
		}
		if(sin_angle <= 0) {
			dy = - dy
		}

		if(Math.abs(dx * sin_angle) < Math.abs(dy * cos_angle)) {
			dy = (dx * sin_angle) / cos_angle;
		}
		else {
			dx = (dy * cos_angle) / sin_angle;
		}

		to_r = Math.sqrt(dx**2 + dy**2);
	}
	else if(to_type === 'ellipse') {
		const to_rx =  + Number(to.getAttribute('graph:rx'));
		const to_ry =  + Number(to.getAttribute('graph:ry'));
		to_r = this.distance + Math.sqrt(1/((sin_angle / to_rx)**2 + (cos_angle / to_ry)**2));
	}
	else {  // Circle is default
		to_r = this.distance + Number(to.getAttribute('graph:r'));
	}

	const dist = Math.sqrt((from_x - to_x)**2 + (from_y - to_y)**2);

	if(dist < from_r + to_r) {
		// If the two nodes are too close together, funny things start
		// to happen, so just make the line invisible until they are
		// further apart again.
		line.setAttribute('visibility', 'hidden');
		return;
	}

	line.setAttribute('visibility', 'visible');

	const start_x = from_x - from_r * sin_angle;
	const start_y = from_y - from_r * cos_angle;
	const end_x = to_x + to_r * sin_angle;
	const end_y = to_y + to_r * cos_angle;

	line.setAttribute('x1', start_x);
	line.setAttribute('y1', start_y);
	line.setAttribute('x2', end_x);
	line.setAttribute('y2', end_y);
};


Graphtool.prototype.add_rectangle = function(x, y, width, height, fill, stroke='black') {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', x + width/2);
	node.setAttribute('graph:cy', y + height/2);
	node.setAttribute('graph:width', width);
	node.setAttribute('graph:height', height);
	node.setAttribute('graph:type', 'rect');
	node.setAttribute('graph:num', this.num_nodes);
	node.setAttribute('transform', 'translate(' + (x + width/2) + ', ' + (y + height/2) + ')');

	const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
	rect.setAttribute('x', -width/2);
	rect.setAttribute('y', -height/2);
	rect.setAttribute('width', width);
	rect.setAttribute('height', height);
	rect.style.stroke = stroke;
	rect.style.fill = fill;
	rect.style.fillOpacity = '0.4';
	rect.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	rect.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	node.appendChild(rect);
	this.canvas.appendChild(node);

	this.starts.push([]);
	this.ends.push([]);
	this.nodes.push(node);
	this.num_nodes++;
};


Graphtool.prototype.add_ellipse = function(cx, cy, rx, ry, fill, stroke='black') {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', cx);
	node.setAttribute('graph:cy', cy);
	node.setAttribute('graph:rx', rx);
	node.setAttribute('graph:ry', ry);
	node.setAttribute('graph:type', 'ellipse');
	node.setAttribute('graph:num', this.num_nodes);
	node.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

	const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
	ellipse.setAttribute('cx', 0);
	ellipse.setAttribute('cy', 0);
	ellipse.setAttribute('rx', rx);
	ellipse.setAttribute('ry', ry);
	ellipse.style.stroke = stroke;
	ellipse.style.fill = fill;
	ellipse.style.fillOpacity = '0.4';
	ellipse.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	ellipse.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	node.appendChild(ellipse);
	this.canvas.appendChild(node);

	this.starts.push([]);
	this.ends.push([]);
	this.nodes.push(node);
	this.num_nodes++;
};


Graphtool.prototype.add_circle = function(cx, cy, r, fill, stroke='black') {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', cx);
	node.setAttribute('graph:cy', cy);
	node.setAttribute('graph:r', r);
	node.setAttribute('graph:type', 'circle');
	node.setAttribute('graph:num', this.num_nodes);
	node.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

	const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	circle.setAttribute('cx', 0);
	circle.setAttribute('cy', 0);
	circle.setAttribute('r', r);
	circle.style.stroke = stroke;
	circle.style.fill = fill;
	circle.style.fillOpacity = '0.4';
	circle.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	circle.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	node.appendChild(circle);
	this.canvas.appendChild(node);

	this.starts.push([]);
	this.ends.push([]);
	this.nodes.push(node);
	this.num_nodes++;
};


Graphtool.prototype.add_line = function(from, to, type='triangle') {
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.setAttribute('marker-end', `url(#${type})`);
	line.setAttribute('visibility', 'visible');
	line.style.stroke = 'black';

	const from_num = from.getAttribute('graph:num');
	const to_num = to.getAttribute('graph:num');
	line.setAttribute('graph:from', from_num);
	line.setAttribute('graph:to', to_num);

	this.starts[from_num].push(line);
	this.ends[to_num].push(line);

	this.calc_line_pos(line);
	this.canvas.appendChild(line);

	this.lines.push(line);
	this.num_lines++;
};
