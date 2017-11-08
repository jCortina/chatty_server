// server.js

const express = require('express');
const WebsocketLib = require('ws');
const SocketServer = WebsocketLib.Server;
const uuidv4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;
// Counter for number of users
var   usersCount = 0;

// Create a new express server
const server = express() 
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// broadcast to all (each) clients
function broadcast(message) {
  wss.clients.forEach( (client) => {
    if (client.readyState === WebsocketLib.OPEN)  {
      client.send(message);
    }
  });
}
var outMsg = {};

// when message received, broadcast to all clients
wss.on('connection', (ws) => {
  console.log('Client connected');
  // new user, update count and broadcast
  usersCount++;
  outMsg = JSON.stringify( {type: 'UsersCount', usersOnline: usersCount});
  broadcast(outMsg);

  ws.on('message', (inMsg) => {
    const msgJson = JSON.parse(inMsg);
    outMsg = null;
    if (msgJson.type == 'postMessage')  {
      outMsg = JSON.stringify( {type: 'inMessage', id: uuidv4(), usrName: msgJson.username, usrMsg: msgJson.content} );
    } else if (msgJson.type == 'postNotification') {
      outMsg = JSON.stringify( {type: 'inNotification', id: uuidv4(), content: msgJson.content} );
    } else {
      return;
    }
    broadcast(outMsg);
  });

  ws.on('close', () => {
    // dropped user, update count and broadcast
    usersCount--;
    console.log('Client Disconnected');
  });

});