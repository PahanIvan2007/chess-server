const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let waitingPlayers = [];
let rooms = {};

console.log(`Шахматный сервер запущен на порту ${PORT}`);

wss.on('connection', (ws) => {
    ws.id = uuidv4();
    console.log(`грок подключился: ${ws.id}`);

    waitingPlayers.push(ws);

    if (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        const roomId = uuidv4();

        rooms[roomId] = {
            players: [player1, player2],
            turn: 'white'
        };

        player1.roomId = roomId;
        player2.roomId = roomId;

        player1.send(JSON.stringify({ type: 'start', color: 'white' }));
        player2.send(JSON.stringify({ type: 'start', color: 'black' }));

        console.log(`гра началась: ${roomId}`);
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const room = rooms[ws.roomId];
        if (!room) return;

        if (data.type === 'move') {
            room.players.forEach(player => {
                if (player !== ws) {
                    player.send(JSON.stringify({
                        type: 'move',
                        fr: data.fr, fc: data.fc,
                        tr: data.tr, tc: data.tc
                    }));
                }
            });
            room.turn = room.turn === 'white' ? 'black' : 'white';
        }
    });

    ws.on('close', () => {
        console.log(`грок отключился: ${ws.id}`);
        waitingPlayers = waitingPlayers.filter(p => p !== ws);
        if (rooms[ws.roomId]) delete rooms[ws.roomId];
    });
});