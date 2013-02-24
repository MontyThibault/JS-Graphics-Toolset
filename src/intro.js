'use strict';
(function($, THREE, undefined) {

var engine = {};

// Little shim so that functions that will always be called in a given context
function context(func, context) {
	return function() {
		func.apply(context, arguments);
	};
};