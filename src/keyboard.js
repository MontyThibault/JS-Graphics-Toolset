engine.Keyboard = (function() {

	var _vec = new THREE.Vector2();

	function Keyboard() {
		this.bindings = {
			// '^keyDown 32$': function() { console.log(':)'); }
			// 'p.*65.*83.*68': function() { console.log('ASD in that order.') }
			// 'p(?=.* 65)(?=.* 83)(?=.* 68)': function() { console.log('ASD in any order'); },
			// '^d 65$': function() { console.log('Exactly A'); },
			// 'd(?!.* 83).*': function() { console.log('Not S'); }
		};

		this._pressed = {};
		this._mouseBefore = new THREE.Vector2();
		this._mouseAfter = new THREE.Vector2();
		this._mouseE;

		this.initListeners();
	}	

	Keyboard.prototype.addBindings = function(bindings) {
		$.extend(this.bindings, bindings);
	};

	/* Scans all the bindings and executes any occurances. */
	Keyboard.prototype.searchKeys = function(bindings, eventType, data) {

		// Sort keypresses in chronological order
		var order = [];
		for(var key in this._pressed) {
			order.push([key, this._pressed[key]]);	
		}
		order.sort(function(a, b) {
			return a[1] - b[1];
		});

		// Form a 'trigger' string that characterizes this event
		var trigger = eventType;
		for(var i = 0; i < order.length; i++) {
			trigger += ' ' + order[i][0];
		}
		trigger.trim();

		// Test and execute callbacks
		for(var regex in bindings) {
			if(new RegExp(regex).test(trigger)) {

				var callback = bindings[regex];

				if(typeof callback === 'object') {
					searchKeys(callback, eventType, data);
				} else if(typeof callback === 'function') {
					callback(data);
				}
			}
		}
	};

	Keyboard.prototype._keydown = function(e) {
		var code = e.charCode || e.keyCode;
		// e.preventDefault();

		// Stop that repeating thing that happens when you hold a key down
		if(this._pressed[code]) {
			return;
		}

		console.log(code);

		this._pressed[code] = new Date().getTime();
		this.searchKeys(this.bindings, 'kd', { e: e });
	};

	Keyboard.prototype._keyup = function(e) {
		var code = e.charCode || e.keyCode;

		this.searchKeys(this.bindings, 'ku', { e: e });
		delete this._pressed[code];
	};

	Keyboard.prototype._mousedown = function(e) {
		var button = ([
			'left',
			'middle',
			'right'
		])[e.which - 1];

		this._pressed[button] = new Date().getTime();
		this.searchKeys(this.bindings, 'md', { e: e });
	};

	Keyboard.prototype._mouseup = function(e) {
		var button = ([
			'left',
			'middle',
			'right'
		])[e.which - 1];

		this.searchKeys(this.bindings, 'mu', { e: e });
		delete this._pressed[button];
	};

	Keyboard.prototype._mousemove = function(e) {
		this._mouseE = e;
		this._mouseAfter.set(e.clientX, e.clientY);
	};

	Keyboard.prototype._contextmenu = function(e) {
		e.preventDefault();
	};

	Keyboard.prototype._focus = function(e) {
		// Incase the user does something bad and a key gets stuck down
		this._pressed = {};
	};

	Keyboard.prototype.update = function() {
		this.searchKeys(this.bindings, 'u');

		// If the mouse has moved
		_vec.subVectors(this._mouseAfter, this._mouseBefore);
		if(_vec.x || _vec.y) {
			
			this.searchKeys(this.bindings, 'mm', {
				difference: _vec.clone(),
				e: this._mouseE
			});

			this._mouseBefore.copy(this._mouseAfter);
		}
	};


	Keyboard.prototype.initListeners = function() {
		window.addEventListener('keydown', engine.context(this._keydown, this), false);
		window.addEventListener('keyup', engine.context(this._keyup, this), false);
		window.addEventListener('mousedown', engine.context(this._mousedown, this), false);
		window.addEventListener('mouseup', engine.context(this._mouseup, this), false);
		window.addEventListener('mousemove', engine.context(this._mousemove, this), false);
		window.addEventListener('contextmenu', this._contextmenu, false);
		window.addEventListener('focus', engine.context(this._focus, this), false);
	};

	return Keyboard;
})();