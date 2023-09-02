const triplets = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

export default class Game {
    constructor(io, room, roomCode) {
        this.io = io;
        this.room = room;
        this.roomCode = roomCode;

        this.gameState = Array(9).fill(null);
        this.currentPlayer = 'player1';

        this.startGame();

        this.turn = this.turn.bind(this);

        this.on('turn', this.turn);
    }

    startGame() {
        this.toPlayer1('startGame', { player: 'player1', currentPlayer: this.currentPlayer });

        if (this.room.player2) {
            this.toPlayer2('startGame', { player: 'player2', currentPlayer: this.currentPlayer });
        }
    }

    on(event, callback) {
        this.room.player1.on(event, callback);

        if (this.room.player2) {
            this.room.player2.on(event, callback);
        }
    }

    emit(event, ...args) {
        if (this.room.player2) {
            this.io.to(this.roomCode).emit(event, ...args);
            return;
        }
        this.toPlayer1(event, ...args);
    }

    toPlayer1(event, ...args) {
        this.io.to(this.room.player1.id).emit(event, ...args)
    }

    toPlayer2(event, ...args) {
        this.io.to(this.room.player2.id).emit(event, ...args)
    }

    nextPlayer() {
        if (this.currentPlayer === 'player1') {
            this.currentPlayer = 'player2';
        } else {
            this.currentPlayer = 'player1';
        }
    }

    turn(index) {
        this.gameState[Number(index)] = this.currentPlayer === 'player1' ? 'x' : 'o';

        const gameOver = this.checkGameOver();

        if (gameOver) {
            this.emit('gameOver', { newGameState: this.gameState, winner: this.currentPlayer, combination: this.combination });
            return;
        }

        this.nextPlayer();

        this.emit('turnEnded', { currentPlayer: this.currentPlayer, newGameState: this.gameState })

        if (!this.room.player2 && this.currentPlayer === 'player2') {
            this.playOpponentTurn()
        }
    }

    playOpponentTurn() {
        const emptyFields = [];
        this.gameState.forEach((val, index) => !val && emptyFields.push(index));
        const rand = Math.floor(emptyFields.length * Math.random());

        setTimeout(() => {
            this.turn(emptyFields[rand]);
        }, 1000)
    }

    checkGameOver() {
        let gameOver = false;

        for (let i = 0; i < triplets.length; i++) {
            const triplet = triplets[i];
            const res = [this.gameState[triplet[0]], this.gameState[triplet[1]], this.gameState[triplet[2]]];
            gameOver = res.every((val, i, arr) => val && val === arr[0])
            if (gameOver) {
                this.combination = triplet;
                break;
            }
        }

        return gameOver;
    }
}