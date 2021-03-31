'use strict';


function Graphtool() {
	this.canvas = null;

	this.num_nodes = 0;
	this.num_lines = 0;

	this.nodes = [];
	this.lines = [];
	this.ends = [];
	this.starts = [];
	this.node_name_to_num = {};

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


Graphtool.prototype.setup_events = function() {
	document.getElementById('btn_zoomin').addEventListener('click', this.mv_zoom_in.bind(this));
	document.getElementById('btn_zoomout').addEventListener('click', this.mv_zoom_out.bind(this));

	this.canvas.addEventListener('touchmove', this.mv_touch_move.bind(this));
	this.canvas.addEventListener('mousemove', this.mv_mouse_move.bind(this));
	this.canvas.addEventListener('touchend', this.mv_end.bind(this));
	this.canvas.addEventListener('touchcancel', this.mv_end.bind(this));
	this.canvas.addEventListener('mouseup', this.mv_end.bind(this));
	this.canvas.addEventListener('touchstart', this.mv_touch_start_canvas.bind(this));
	this.canvas.addEventListener('mousedown', this.mv_mouse_start_canvas.bind(this));
	this.canvas.addEventListener('wheel', this.mv_wheel_zoom.bind(this));
	this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

	this.canvas.addEventListener('dragover', (event) => {
		event.stopPropagation();
		event.preventDefault();
	});

	this.canvas.addEventListener('drop', (event) => {
		event.stopPropagation();
		event.preventDefault();
		this.upload_file(event.dataTransfer.files[0]);
	});
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
	this.reset();

	this.add_node({
		'type': 'circle',
		'cx': 100, 'cy': 100, 'r': 20,
		'style': {'fill': 'green', 'stroke': 'black'},
		'attr': {},
	});

	this.add_node({
		'type': 'ellipse',
		'cx': 400, 'cy': 600, 'rx': 120, 'ry': 60,
		'style': {'fill': 'red', 'stroke': 'black'},
		'attr': {},
		'subnodes': [
			{
				'type': 'polygon',
				'style': {'fill': '#442222'},
				'attr': {'points': '0,-40 25,40 -40,-10 40,-10 -25,40'},
			},
			{
				'type': 'rect',
				'style': {'fill': '#aaffff'},
				'attr': {'x': -5, 'y': -5, 'width': 10, 'height': 10},
			},
		],
	});

	this.add_node({
		'type': 'circle',
		'cx': 340, 'cy': 200, 'r': 50,
		'style': {'fill': 'blue', 'stroke': 'white', 'strokeWidth': 5},
		'attr': {},
	});

	this.add_node({
		'type': 'ellipse',
		'cx': 600, 'cy': 95, 'rx': 20, 'ry': 80,
		'style': {'fill': 'black', 'stroke': 'black', 'fillOpacity': 0.4},
		'attr': {},
	});

	this.add_node({
		'type': 'rect',
		'x': 540, 'y': 200, 'width': 200, 'height': 50,
		'style': {'fill': 'white', 'stroke': 'black'},
		'attr': {},
		'subnodes': [
			{
				'type': 'text',
				'text': 'Node name',
				'style': {'fill': '#aa0000', 'textAnchor': 'middle', 'dominantBaseline': 'central'},
				'attr': {'x': 0, 'y': 0},
			},
		],
	});

	this.add_node({
		'type': 'rect',
		'x': 150, 'y': 295, 'width': 20, 'height': 80,
		'style': {'fill': 'teal', 'stroke': 'black', 'strokeDasharray': '4 2'},
		'attr': {},
	});

	this.add_line(0, 1, 'triangle', {'stroke': 'black'}, {});
	this.add_line(0, 2, 'triangle', {'stroke': 'black'}, {});
	this.add_line(3, 0, 'none', {'stroke': 'black'}, {});
	this.add_line(2, 1, 'bar', {'stroke': 'black'}, {});
	this.add_line(4, 5, 'triangle', {'stroke': 'black', 'strokeDasharray': '5'}, {});
	this.add_line(5, 2, 'bar', {'stroke': 'black'}, {});
};


Graphtool.prototype.reset = function() {
	for(let i = 0; i < this.num_lines; i++) {
		this.canvas.removeChild(this.lines[i]);
	}

	for(let i = 0; i < this.num_nodes; i++) {
		this.canvas.removeChild(this.nodes[i]);
	}

	this.num_nodes = 0;
	this.num_lines = 0;

	this.nodes = [];
	this.lines = [];
	this.ends = [];
	this.starts = [];
	this.node_name_to_num = {};

	this.x_pos = 0;
	this.y_pos = 0;
	this.scale = 1;
	this.viewbox_width = this.svg_width;
	this.viewbox_height = this.svg_height;
};


Graphtool.prototype.load_from_json = function(obj) {
	this.reset();

	for(let i = 0; i < obj.nodes.length; i++) {
		this.add_node(obj.nodes[i]);
	}

	for(let i = 0; i < obj.edges.length; i++) {
		this.add_edge(obj.edges[i]);
	}
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


Graphtool.prototype.add_node = function(desc) {
	if(!['circle', 'rect', 'ellipse'].includes(desc.type)) {
		console.warn(`Node type ${desc.type} is not valid. Using circle instead.`);
		desc.type = 'circle';
	}

	if(!desc.hasOwnProperty('id')) {
		desc.id = this.num_nodes;
	}

	let node;

	if(desc.type === 'rect') {
		node = this.add_rectangle(desc.x, desc.y, desc.width, desc.height, desc.style, desc.attr);
	}
	else if(desc.type === 'ellipse') {
		node = this.add_ellipse(desc.cx, desc.cy, desc.rx, desc.ry, desc.style, desc.attr);
	}
	else {
		node = this.add_circle(desc.cx, desc.cy, desc.r, desc.style, desc.attr);
	}

	node.setAttribute('graph:num', this.num_nodes);
	node.setAttribute('graph:id', desc.id);

	if(desc.hasOwnProperty('subnodes')) {
		for(const subnode of desc.subnodes) {
			this.add_subnode(node, subnode);
		}
	}

	this.canvas.appendChild(node);

	this.node_name_to_num[desc.id] = this.num_nodes;

	this.starts.push([]);
	this.ends.push([]);
	this.nodes.push(node);
	this.num_nodes++;
};


Graphtool.prototype.add_subnode = function(node, subnode) {
	const sub = document.createElementNS('http://www.w3.org/2000/svg', subnode.type);

	for(const key in subnode.style) {
		sub.style[key] = subnode.style[key];
	}

	for(const key in subnode.attr) {
		sub.setAttribute(key, subnode.attr[key]);
	}

	if(subnode.hasOwnProperty('text')) {
		const text = document.createTextNode(subnode.text);
		sub.appendChild(text);
	}

	node.appendChild(sub);
};


Graphtool.prototype.add_rectangle = function(x, y, width, height, style, attr) {
	const cx = x + width/2;
	const cy = y + height/2;

	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', cx);
	node.setAttribute('graph:cy', cy);
	node.setAttribute('graph:width', width);
	node.setAttribute('graph:height', height);
	node.setAttribute('graph:type', 'rect');
	node.setAttribute('transform', `translate(${cx},${cy})`);

	const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
	rect.setAttribute('x', -width/2);
	rect.setAttribute('y', -height/2);
	rect.setAttribute('width', width);
	rect.setAttribute('height', height);
	rect.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	rect.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	for(const key in style) {
		rect.style[key] = style[key];
	}

	for(const key in attr) {
		rect.setAttribute(key, attr[key]);
	}

	node.appendChild(rect);

	return node;
};


Graphtool.prototype.add_ellipse = function(cx, cy, rx, ry, style, attr) {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', cx);
	node.setAttribute('graph:cy', cy);
	node.setAttribute('graph:rx', rx);
	node.setAttribute('graph:ry', ry);
	node.setAttribute('graph:type', 'ellipse');
	node.setAttribute('transform', `translate(${cx},${cy})`);

	const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
	ellipse.setAttribute('cx', 0);
	ellipse.setAttribute('cy', 0);
	ellipse.setAttribute('rx', rx);
	ellipse.setAttribute('ry', ry);
	ellipse.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	ellipse.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	for(const key in style) {
		ellipse.style[key] = style[key];
	}

	for(const key in attr) {
		ellipse.setAttribute(key, attr[key]);
	}

	node.appendChild(ellipse);

	return node;
};


Graphtool.prototype.add_circle = function(cx, cy, r, style, attr) {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	node.setAttribute('graph:cx', cx);
	node.setAttribute('graph:cy', cy);
	node.setAttribute('graph:r', r);
	node.setAttribute('graph:type', 'circle');
	node.setAttribute('transform', `translate(${cx},${cy})`);

	const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	circle.setAttribute('cx', 0);
	circle.setAttribute('cy', 0);
	circle.setAttribute('r', r);
	circle.addEventListener('touchstart', this.mv_touch_start_node.bind(this));
	circle.addEventListener('mousedown', this.mv_mouse_start_node.bind(this));

	for(const key in style) {
		circle.style[key] = style[key];
	}

	for(const key in attr) {
		circle.setAttribute(key, attr[key]);
	}

	node.appendChild(circle);

	return node;
};


Graphtool.prototype.add_edge = function(obj) {
	const type = obj.hasOwnProperty('type') ? obj.type : null;
	const style = obj.hasOwnProperty('style') ? obj.style : null;
	const attr = obj.hasOwnProperty('attr') ? obj.attr : null;

	this.add_line(obj.from, obj.to, type, style, attr);
};


Graphtool.prototype.add_line = function(from, to, type=null, style={}, attr={}) {
	if(from === to) {
		console.log(`Tried to draw a line from ${from} to itself. This is not implemented, yet.`);
		return;
	}

	if(this.node_name_to_num.hasOwnProperty(from)) {
		from = this.node_name_to_num[from];
	}
	if(this.node_name_to_num.hasOwnProperty(to)) {
		to = this.node_name_to_num[to];
	}

	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	if(type || type !== 'none') {
		line.setAttribute('marker-end', `url(#${type})`);
	}
	line.setAttribute('visibility', 'visible');
	line.setAttribute('graph:from', from);
	line.setAttribute('graph:to', to);

	for(const key in style) {
		line.style[key] = style[key];
	}

	for(const key in attr) {
		line.setAttribute(key, attr[key]);
	}

	this.starts[from].push(line);
	this.ends[to].push(line);

	this.calc_line_pos(line);
	this.canvas.appendChild(line);

	this.lines.push(line);
	this.num_lines++;
};
