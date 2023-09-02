import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Game from './Game.js';

const PORT = process.env.PORT || 3000

const app = express()
const server = createServer(app)

const io = new Server(server, { cors: { origin: '*' } });

const rooms = {};

const createRoom = async (socket) => {
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    for (let i = 0; i < 4; i++) {
        const index = Math.floor(Math.random() * 26);
        const char = chars[index];
        code += char;
    }

    rooms[code] = {
        members: 1,
        player1: socket,
        player2: undefined
    }

    await socket.join(code);

    socket.emit('roomCreated', code)
}

const enterRoom = async (code, socket) => {
    const isRoom = !!rooms[code];

    if (!isRoom) {
        socket.emit('roomNotExist');
        return;
    }

    if (rooms[code].members === 2) {
        socket.emit('roomFull');
        return;
    }

    rooms[code].members += 1;
    rooms[code].player2 = socket;
    await socket.join(code);
    socket.emit('roomEntered');
    new Game(io, rooms[code], code);
}

io.on('connection', (socket) => {
    console.log('client connected: ', socket.id);

    socket.on('singlePlayerGame', async () => {
        new Game(io, { player1: socket }, '');
    });

    socket.on('createRoom', async () => await createRoom(socket));

    socket.on('enterRoom', async (code) => await enterRoom(code, socket))

    socket.on('disconnect', (reason) => {
        console.log(reason)
    })
})

server.listen(PORT, err => {
    if (err) console.log(err)
    console.log('Server running on Port ', PORT)
})