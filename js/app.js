import Hello from './Hello';
import React from 'react';
import ReactDOM from 'react-dom';
import ioClient from 'socket.io-client';

ReactDOM.render(<Hello/>, document.getElementById('reactEntry'));
console.log("Testing");

var socket = ioClient.connect('http://' + document.domain + ':' + location.port);
// verify our websocket connection is established
socket.on('connect', function() {
    console.log('Websocket connected!');
});
socket.on('response', function(msg) {
    console.log(msg);
});
function sendNewTest() {
    console.log('Sending test message...');
    socket.emit('test', {data: 'brilliant'});
}
console.log("Trying to attach")
document.getElementById('testButton').onclick = sendNewTest;
