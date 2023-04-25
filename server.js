import http from 'http';
import { parse } from 'querystring';
import { FrontPageEngineSocketServer } from './websocket.js';
import messages from './messages.js';
import fs from 'fs';

// Create a single, shared WebSocket server.
const socketServer = new FrontPageEngineSocketServer();
const start_time = Date.now();
const readme = fs.readFileSync('README.md', 'utf8');

export const server = {
    sockets: new Set,
    port: process.env.PORT || 3000,
    start: function() {
        this.init();
        return new Promise( ( resolve, reject ) => {
            this.app.listen( this.port, () => {
                console.log( `Server listening on port ${ this.port }...` );
                resolve();
            } );
            this.app.on( 'error', ( err ) => {
                console.error( err );
                reject( err );
            } );
        } );
    },

    stop: function() {
        console.log("Stopping server...");
        return new Promise( ( resolve, reject ) => {
            for (const socket of this.sockets) {
                socket.destroy();
                this.sockets.delete(socket);
            }
        
          this.app.close( ( err ) => {
                if ( err ) {
                    console.error( err );
                    reject( err );
                }
                resolve();
            } );
        } );
    },

    app: http.createServer( ( req, res ) => {
        const baseUrl = `http://${ req.headers.host }`;
        const { pathname: requestPath } = new URL( req.url, baseUrl );
        console.log( `Request for ${ req.method } ${ requestPath }` );
        if ( '/' === requestPath && [ 'GET', 'HEAD' ].includes( req.method ) ) {
            res.writeHead( 200 );
            res.end(readme);
            return;
        }

        /**
         * An http callback that you can use to broadcast a message to a specific
         * domain and channel.
         * 
         * Test: curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:3000/broadcast"
         */
        else if ( '/broadcast' === requestPath && [ 'POST' ].includes( req.method ) ) {
            try {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString(); // convert Buffer to string
                });
                req.on('end', () => {
                    try {
                        const { domain, channel, message, uid } = parse(body);
                        if (!domain || !channel || !message) {
                            throw new Error('Missing required parameters');
                        }
                        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                        const sender = uid || ip;
                        const messageObj = messages.add(domain, channel, message, sender);
                        socketServer.broadcastMessage(messageObj);
                        const response = JSON.stringify({ event: 'broadcast', data: messageObj, domain, channel, status: 'ok' });
                        res.writeHead(200, {
                            'Content-Length': Buffer.byteLength( response),
                            'Content-Type': 'application/json',
                        });
                        res.end( response );
                        console.log(res);
                    } catch (err) {
                        console.error(err);
                        res.writeHead( 500 );
                        res.end( err.message || err );
                    }
                });
            } catch ( err ) {
                res.writeHead( 500 );
                res.end( 'Internal server error' );
                return;
            }
        }

        /**
         * Handle health checks
         * https://docs.wpvip.com/technical-references/vip-platform/node-js/
         *
         * This is a requirement for any application running on WordPress VIP:
         *
         * - must handle url "/cache-healthcheck?" with trailing question mark
         * - must respond with a 200 status code
         * - must send a short response (e.g., "ok")
         * - must respond immediately, without delay
         * - must prioritize this above other routes
         *
         * Test: curl -v "https://example.com/cache-healthcheck?"
         */
        else if ( '/cache-healthcheck' === requestPath && [ 'GET', 'HEAD' ].includes( req.method ) ) {
            res.writeHead( 200 );
            res.end( 'ok' );
            return;
        } 
        else if ( '/stats' === requestPath && [ 'GET' ].includes( req.method ) ) {
            res.writeHead( 200 );
            const time_running = Math.ceil((Date.now() - start_time) / 1000);
            const sockets_open = socketServer.size();
            const message_count = messages.size();
            const response = JSON.stringify({ status: 'ok', time_running, sockets_open, message_count });
            res.end( response );
            return;
        }
        else {
            res.writeHead( 404 );
            res.end("Not found");
        }
    } ),

    init: function() {
        this.app.on( 'listening', () => {
            console.log( 'App is listening on port:', server.port );
            console.log( 'Try this command in another terminal window to open a websocket:' );
            console.log( `websocat "ws://localhost:${ server.port }/_ws/"\n` );
            console.log( 'Subscribe to a channel:' );
            console.log( `{ "event": "subscribe", "domain": "http://blah.com", "channel": "test" }\n` );
            console.log( 'Send a message to a channel:' );
            console.log( `{ "event": "message", "domain": "http://blah.com", "channel": "test", "message": "Hello" }\n` );
            console.log( 'Send a message via the http endpoint (in another terminal):' );
            console.log( `curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:${ server.port }/broadcast"\n` );
            console.log( 'Unsubscribe from a channel:' );
            console.log( `{ "event": "unsubscribe", "domain": "http://blah.com", "channel": "test" }\n` );
        } );

        this.app.on( 'upgrade', ( req, socket, head ) => {
            const baseUrl = `http://${ req.headers.host }`;
            const { pathname: requestPath } = new URL( req.url, baseUrl );
            if ( requestPath.startsWith( '/socket.io/' ) || requestPath.startsWith( '/_ws/' ) ) {
                socketServer.onConnectionUpgrade( req, socket, head );
                return;
            }
            // WebSocket connections are not supported on VIP at any other path.
            socket.destroy();
        } );

        this.app.on('connection', (socket) => {
            this.sockets.add(socket);
            this.app.once('close', () => {
                this.sockets.delete(socket);
            });
        });
    },
};