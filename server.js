// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require( 'websocket' ).server;
var http = require( 'http' );

/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities( str ) {
	return String( str ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort( function( a, b ) {
	return Math.random() > 0.5;
} );

/**
 * HTTP server
 */
var server = http.createServer( function( request, response ) {
	// Not important for us. We're writing WebSocket server, not HTTP server
} );
server.listen( webSocketsServerPort, function() {
	console.log( (new Date()) + " Server is listening on port " + webSocketsServerPort );
} );

/**
 * WebSocket server
 */
var wsServer = new webSocketServer( {
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
} );

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on( 'request', function( request ) {
	console.log( (new Date()) + ' Connection from origin ' + request.origin + '.' );
	console.log( request );

	// accept connection - you should check 'request.origin' to make sure that
	// client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept( null, request.origin );
	// we need to know client index to remove them on 'close' event
	var index = clients.push( connection ) - 1;
	var userName = false;
	var userColor = false;

	console.log( (new Date()) + ' Connection accepted.' );

	// user disconnected
	connection.on( 'close', function( connection ) {
		if ( userName !== false && userColor !== false ) {
			console.log( (new Date()) + " Peer "
				+ connection.remoteAddress + " disconnected." );
			// remove user from the list of connected clients
			clients.splice( index, 1 );
			// push back user's color to be reused by another user
			colors.push( userColor );
		}
	} );

	connection.on( 'message', function( message ) {
		if ( message.type === 'utf8' ) {
			console.log( 'Received Message: ' + message.utf8Data );
			connection.sendUTF( message.utf8Data );

			for ( var i = 0; i < clients.length; i ++ ) {
				var obj = {
					time: (new Date()).getTime(),
					text: message.utf8Data,
				};

				// broadcast message to all connected clients
				var json = JSON.stringify( { type: 'message', data: obj } );
				clients[ i ].sendUTF( json );
			}
		}
		else if ( message.type === 'binary' ) {
			console.log( 'Received Binary Message of ' + message.binaryData.length + ' bytes' );
			connection.sendBytes( message.binaryData );
		}
	} );

} );

function sendEmail() {
	// we want to keep history of all sent messages

	for ( var i = 0; i < clients.length; i ++ ) {
		var obj = {
			time: (new Date()).getTime(),
			text: 'Client ' + i,
		};

		// broadcast message to all connected clients
		var json = JSON.stringify( { type: 'message', data: obj } );
		clients[ i ].sendUTF( json );
	}
}
