/*jshint esversion: 6 */

// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const port = process.env.PORT || 3000;
app.set('port', port);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/static', 'index.html'));
});

// Starts the server.
server.listen(port, function() {
    console.log('Starting server on port ' + port);
});

let players = [];

let lastDataUrl = null;

let drawingPlayer = null;

// Add the WebSocket handlers
io.on('connection', function(socket) {
    socket.on('newPlayer', function(username) {
        console.log("A player on socket " + socket.id + " connected, with username: " + username);
        players.push({ id: socket.id, username: username });
        io.sockets.emit('updateSB', players);
        if (players.length == 1) {
            drawingPlayer = socket.id;
            io.to(players[0].id).emit('letsDraw');
        } else {
            io.sockets.emit('letsWatch', players[0].id, lastDataUrl);
        }
    });

    socket.on('view', function(leaderSocket, dataURL) {
        lastDataUrl = dataURL;
        io.sockets.emit('letsWatch', leaderSocket, dataURL);
    });

    socket.on('disconnect', function() {
        let i = players.map(function(e) { return e.id; }).indexOf(socket.id);
        console.log("Player " + players[i].username + " disconnected");
        players.splice(i, 1);

        io.sockets.emit('updateSB', players);
        if (socket.id == drawingPlayer) {
            lastDataUrl = null;
            if (players.length > 0) {
                drawingPlayer = players[0].id;
                io.to(players[0].id).emit('letsDraw');
                io.sockets.emit('letsWatch', drawingPlayer, lastDataUrl);
            } else
                drawingPlayer = null;
        }
    });
});
