'use strict';

var config = require('./config/config.json');
var gpio = require('onoff').Gpio;

var http = require('http');
var fs = require('fs');
var zlib = require('zlib');
var filePath = './public/index.html';
var htmlFile = fs.readFileSync(filePath).toString('utf8');
var fileStats = fs.statSync(filePath);
var route = {
    file: htmlFile
};
var headers = {
    'Content-Type': 'text/html',
    'Cache-Control': 'public, max-age=31536000',
    'X-Powered-By': 'Raspberry Pi',
    'Last-Modified': fileStats.mtime,
    'Expires': 'Wed, 01 Jan 2020 16:20:00 GMT',
    'ETag': fileStats.size + '-' + Date.parse(fileStats.mtime)
};
var server = http.createServer(app);

var relayObjects = {};
var relays = [];

var sensorObjects = {};
var sensors = [];

var states = {
    0: 'closed',
    1: 'open'
}

var gi = 0;

function init() {
    if(config.sensors) {
        console.log('Initializing configured sensors and relays...');
        var i = 0;
        Object.keys(config.sensors).forEach(function(sensorId) {
            var sensor = config.sensors[sensorId];
            console.log('Initializing sensor \'' + sensor.name + '\' on pin ' + sensor.pin);
            sensors[i] = new gpio(sensor.pin, 'in', 'both', { persistentWatch: true });
            var state = sensors[i].readSync();
            console.log('Current state of sensor \'' + sensor.name + '\' is: \'' + states[state] + '\'');
            sensorObjects[sensorId] = { index: i, name: sensor.name, state: states[state], value: state, occurred: new Date().toUTCString() };
            sensors[i].watch(function(err, state) {
                if(err) {
                    throw err;
                }
                console.log('State of sensor \'' + sensor.name + '\' changed to: \'' + states[state] + '\'');
                if(state === 1) {
                    sensorObjects[sensorId].state = "opening...";
                    sensorObjects[sensorId].value = state;
                    setTimeout(function() {
                        sensorObjects[sensorId].state = states[state];
                        sensorObjects[sensorId].occurred = new Date();
                        wss.emit('sendAll', JSON.stringify({ type: 'sensors', data: sensorObjects }));
                    }, sensor.openingTimeout);
                } else {
                    sensorObjects[sensorId].state = states[state];
                    sensorObjects[sensorId].value = state;
                }
                sensorObjects[sensorId].occurred = new Date();
                wss.emit('sendAll', JSON.stringify({ type: 'sensors', data: sensorObjects }));
            });
            i += 1;
        });
    }
    if(config.relays) {
        var j = 0;
        Object.keys(config.relays).forEach(function(relayId) {
            var relay = config.relays[relayId];
            console.log('Initializing relay \'' + relayId + '\' for sensor \'' + relay.sensorId + ' on pin ' + relay.pin);
            relays[j] = new gpio(relay.pin, 'out');
            relayObjects[relayId] = { 
                index: j, 
                sensorId: relay.sensorId, 
                name: sensorObjects[relay.sensorId].name 
            };
            j += 1;
        });
    }
}

// setup the in-memory http-server with both gzipped and deflated files
// after this is done, we can start listening on the server
['gzip', 'deflate'].forEach(function (gz) {
    zlib[gz](htmlFile, function (err, gzipped) {
        if (!err) {
            route[gz] = gzipped;
        }
        if (gi === 1) {
            server.listen(config.port);
        } else {
            gi += 1;
        }
    });
});

// this is the connectionhandler for the http-server
function app(req, res) {
    var reqHeaders = req.headers;
    if (reqHeaders['if-none-match'] === headers['ETag']) {
        res.statusCode = 304;
        return res.end();
    }
    var resHeaders = headers;
    var acceptEncoding = reqHeaders['accept-encoding'];
    if (acceptEncoding) {
        var gzipd = acceptEncoding.match(/\bgzip|deflate\b/);
        if (gzipd) {
            resHeaders['content-encoding'] = gzipd[0];
            res.writeHead(200, resHeaders);
            return res.end(route[gzipd[0]]);
        }
    }
    res.writeHead(200, resHeaders);
    return res.end(route.file);
}

var WebSocketServer = require('websocket').server;
var connectionIds = [];
var wss = new WebSocketServer({ httpServer: server });
wss.clientConnections = {};

wss.on('request', function(request) {
    console.log('WebSocket request received');
    var connection = request.accept(null, request.origin);
    var cid = request.key;
    var self = this;
    connection.id = cid;
    this.clientConnections[cid] = setConnectionListeners(connection);
    connectionIds.push(cid);
    connection.send(JSON.stringify({ type: 'sensors', data: sensorObjects }));
    connection.send(JSON.stringify({ type: 'relays', data: relayObjects }));
}).on('sendAll', function(message) {
    var self = this;
    connectionIds.forEach(function(id) {
        var conn = self.clientConnections[id];
        if(conn.connected) {
            conn.send(message);
        }
    });
});

function setConnectionListeners(connection) {
    connection.on('message', function(msg) {
        if(msg.type === 'utf8') {
            console.log(msg);
        } else {
            connection.close();
        }
    }).on('error', function(error) {
        connection.close();
    }).on('close', function() {
        delete wss.clientConnections[connection.id];
        connectionIds = Object.keys(wss.clientConnections);
    });
    return connection;
}

process.on('SIGINT', function() {
    console.log('Exiting...');
    relays.forEach(function(relay) {
        relay.unexport();
    });
    sensors.forEach(function(sensor) {
        sensor.unexport();
    });
});

init();
console.log('Running...');