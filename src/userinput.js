// state of keyboard and mouse
engine.userInput = (function() {
    
    var pressed = {};
    
    // Array of handlers for each type of event (keydown/up, mousedown/up/move)
    // Functions are added to these arrays by game objects so that they can 
    // respond to keypresses and such
    var kd = [],
        ku = [],
        md = [],
        mu = [],
        mm = [];
    
    
    function keydown(e) {
        var code = e.charCode || e.keyCode;
        pressed[code] = new Date().getTime();
        
        for(var i = 0; i < kd.length; i++) { 
            kd[i](code, e); 
        }
    }
    
    function keyup(e) {
        var code = e.charCode || e.keyCode;
        delete pressed[code];
        
        for(var i = 0; i < ku.length; i++) { 
            ku[i](code, e); 
        }
    }
    
    function mousedown(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        pressed[button] = new Date().getTime();
        
        for(var i = 0; i < md.length; i++) { 
            md[i](button, e); 
        }
    }
    
    function mouseup(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        delete pressed[button];
        
        for(var i = 0; i < mu.length; i++) { 
            mu[i](button, e); 
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
            
            clientX = e.clientX;
            clientY = e.clientY;
            
            for(var i = 0; i < mm.length; i++) {
                mm[i](e);   
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
        pressed = {};
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
	
	return {
        pressed: pressed,
        listen: listen,
        clientX: clientX,
        clientY: clientY,
        kd: kd,
        ku: ku,
        md: md,
        mu: mu,
        mm: mm
	};
})();