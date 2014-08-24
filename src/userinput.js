// state of keyboard and mouse
engine.userInput = (function() {
        

    var exports = {
        pressed: {},
        listen: listen,

    // Array of handlers for each type of event (keydown/up, mousedown/up/move)
    // Functions are added to these arrays by game objects so that they can 
    // respond to keypresses and such
        kd: [],
        ku: [],
        md: [],
        mu: [],
        mm: [],

        clientX: null,
        clientY: null
    };
    
    function keydown(e) {
        var code = e.charCode || e.keyCode;
        exports.pressed[code] = new Date().getTime();
        
        for(var i = 0; i < exports.kd.length; i++) { 
            exports.kd[i](code, e); 
        }
    }
    
    function keyup(e) {
        var code = e.charCode || e.keyCode;
        delete exports.pressed[code];
        
        for(var i = 0; i < exports.ku.length; i++) { 
            exports.ku[i](code, e); 
        }
    }
    
    function mousedown(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        exports.pressed[button] = new Date().getTime();
        
        for(var i = 0; i < exports.md.length; i++) { 
            exports.md[i](button, e); 
        }
    }
    
    function mouseup(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        delete exports.pressed[button];
        
        for(var i = 0; i < exports.mu.length; i++) { 
            exports.mu[i](button, e); 
        }
    }
    
    var lastcalled = 0,
        clientX, 
        clientY;
    function mousemove(e) {
        // Limit to video framerate. Browsers call this at 999fps for some reason
        var timestamp = new Date().getTime();
        if((timestamp - lastcalled) >= (1000 / engine.fps)) {
            lastcalled = timestamp;
            
            exports.clientX = e.clientX;
            exports.clientY = e.clientY;
            
            for(var i = 0; i < exports.mm.length; i++) {
                exports.mm[i](e);   
            }
        }
    }
    
    function contextmenu(e) {
        e.preventDefault();
    }
    
    function focus(e) {
        // If the user does something weird, no keyup event will be fired and 
        // a key will seem to be stuck down. This will let them refocus the page
        // to reset everything.
        exports.pressed = {};
    }
    
    function listen() {
		window.addEventListener('keydown', keydown, false);
		window.addEventListener('keyup', keyup, false);
		window.addEventListener('mousedown', mousedown, false);
		window.addEventListener('mouseup', mouseup, false);
		window.addEventListener('mousemove', mousemove, false);
		window.addEventListener('contextmenu', contextmenu, false);
		window.addEventListener('focus', focus, false);
	}
	
	return exports;
})();