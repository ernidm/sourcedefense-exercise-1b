let { log } = console;

log(`\n %c 'index-iframe.js' loaded at origin ${window.location} \n`, "background: blue");

function responseListener(event) {
	let response = "at origin: " + window.location + ": '" + event.data + "' from origin: " + event.origin + "'";
	log(`%c ${response}`, "background: blue");
}

window.addEventListener("message", responseListener, false);

window.parent.postMessage(`this is a private message - received from iframe at '${window.location}'`, "http://localhost:5000");