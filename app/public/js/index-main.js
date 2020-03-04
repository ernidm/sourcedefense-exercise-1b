let { log } = console;

(function() {
	const FORCE_ORIGIN_PARAM = false;
	const PUBLIC_MESSAGE_ORIGIN_NAME = "public";	// origin name to be used for public messages

	let originalAddEventListener = window.addEventListener;
	let originalDefineProperty = Object.defineProperty;

	let listenerManager = event => {
		log(`listenerManager: message has been received! => "${event.data}"`);
		let { origin } = event;

		if (PubSub.countSubscriptions(`message::${origin}`) > 0) {	// private listener exists
			PubSub.publish(`message::${origin}`, event);	// publish to the private listener only
		} else {
			// no origin specified, can be a public listener - publish to all public listeners
			PubSub.publish(`message::${PUBLIC_MESSAGE_ORIGIN_NAME}`, event);
		}
	};

	window.addEventListener("message", listenerManager, false);

	// override 'addEventListener'
	window.addEventListener = function() {
		let type = arguments[0]; // "message"
		let listener = arguments[1];
		let options = typeof arguments[2] === "object" ? arguments[2] : {};
		let useCapture = typeof arguments[2] === "boolean" ? arguments[2] : false;
		let origin = arguments[3] || PUBLIC_MESSAGE_ORIGIN_NAME;

		log("origin: ", origin);

		// some logs
		if (listener.toString().match(/private listener/)) { 
			log("a private listener attempt"); 
		}
		if (listener.toString().match(/malicious listener/)) { 
			log("a malicious listener attempt"); 
		}
		if (listener.toString().match(/other listener/)) { 
			log("some public listener attempt"); 
		}

		// will throw an error if no origin specified (and "FORCE_ORIGIN_PARAM" is on)
		if (type === "message" 
			&& origin === PUBLIC_MESSAGE_ORIGIN_NAME 
			&& FORCE_ORIGIN_PARAM) {
			throw new Error("window.addEventListener: message 'origin' must be specified");
		}

		options.capture = useCapture;

		if (type !== "message") {	// other type of listener, ok to allow it and use the original "addEventListener"
			originalAddEventListener.call(window, type, listener, options);
		} else {
			let typeWithOrigin = `${type}::${origin}`;				// e.g "message::http://localhost:8000"
			let wrappedListener = (msg, event) => listener(event); 	// to conform with the PubSub library
			
			// verify that the specified origin is not already in use, and if so, don't allow another listener
			if (PubSub.countSubscriptions(typeWithOrigin) > 0 
				&& origin !== PUBLIC_MESSAGE_ORIGIN_NAME) {
				console.warn("window.addEventListener: unable to add listener for origin '" + origin + "', private tunnel; already taken", "\n\n");
				return;
			}

			log("ok!", "\n\n");
			PubSub.subscribe(typeWithOrigin, wrappedListener);
		}
	};

	// remove access to "onmessage" and "addEventListener" properties
	Object.defineProperty(window, "onmessage", { writable: false });
	Object.defineProperty(window, "addEventListener", { writable: false });

	// trying to redefine them is not allowed
	Object.defineProperty = function() {
		let obj = arguments[0];
		let prop = arguments[1];

		if (obj === window && (prop === "onmessage" || prop === "addEventListener")) {
			return;	// exit silently
		}

		originalDefineProperty.apply(null, Array.from(arguments));
	};
}());

// private listeners
function privateListener(event) { 
	log("I'm a private listener!", event);

	// send response back to the iframe
	let iframe = document.getElementById("iframe8000");
	iframe.contentWindow.postMessage("I received your massage!", "*");
}
function privateListener2(event) { log("I'm a private listener!", event); }

// malicious listeners
function maliciousListener(event) { log("I'm a malicious listener!", event); }
function maliciousListener2(event) { log("I'm a malicious listener 2!", event); }

// public listeners
function publicListener(event) { log("I'm a public listener!", event); }
function publicListener2(event) { log("I'm a public listener 2!", event);}

window.onmessage = maliciousListener;	// not allowed to use "onmessage" - will not work
window.addEventListener("message", privateListener, false, "http://localhost:8000");
window.addEventListener("message", privateListener2, false, "http://localhost:9000");

// typically a malicious listener (loaded from another third party plugin) will try to listen after a "good" one had already been listening - will try to eavesdrop
window.addEventListener("message", maliciousListener, false, "http://localhost:8000");
window.addEventListener("message", maliciousListener2, false, "http://localhost:9000");

// other legitimate general listeners
window.addEventListener("message", publicListener, false);	// public listener - "message::public"
window.addEventListener("message", publicListener2, false);	// public listener - "message::public"

// post some message - will be picked up by public listeners, not private
window.postMessage("some public message");