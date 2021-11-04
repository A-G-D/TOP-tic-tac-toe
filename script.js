(async () => {
    'use strict';

    const ROUND_READY_DELAY = 0;
    const PLAYER_READY_DELAY = 1000;

    const boardContainer    = document.querySelector('.gameboard');
    const playerNameLabel   = document.querySelector(".player label.name span");
    const compNameLabel     = document.querySelector(".computer label.name span");
    const playerScoreLabel  = document.querySelector(".player label.score span");
    const compScoreLabel    = document.querySelector(".computer label.score span");
    const roundLabel        = document.querySelector("#current-round span");
    const gameMessageBox    = document.querySelector("#game-message");
    const roundHistoryList  = document.querySelector("#rounds-history ul");

    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    const tripleEquals = (a, b, c) => {
        return a === b && b === c;
    };

    const randInt = (lo, hi) => {
        return lo + Math.floor(Math.random()*(hi - lo + 1));
    };

    const GameBoard = (() => {
        const grid = [];
        const triples = [];

        const getCell = (i, j) => {
            return grid[i][j];
        };

        const getLines = () => {
            return triples;
        };

        const markCell = (i, j, value) => {
            const cell = grid[i][j];

            if (value == null) {
                if (cell.textContent == null || cell.textContent.length === 0)
                    return false;
                cell.textContent = value;
                cell.classList.remove('marked');

            } else {
                if (cell.textContent != null && cell.textContent.length > 0)
                    return false;
                cell.textContent = value;
                cell.classList.add('marked');
            }

            return true;
        };

        const checkTripleMark = (line) => {
            const text1 = line[0].textContent;
            const text2 = line[1].textContent;
            const text3 = line[2].textContent;

            return (
                (text1 != null && text1.length > 0) &&
                (text2 != null && text2.length > 0) &&
                (text3 != null && text3.length > 0) &&
                tripleEquals(text1, text2, text3)
            );
        }

        const traverseCells = (onTraverse) => {
            for (let i = 0; i < grid.length; ++i) {
                for (let j = 0; j < grid[i].length; ++j) {
                    const result = onTraverse(grid[i][j], i, j);
                    if (result != null)
                        return result;
                }
            }
        };

        {
            for (let i = 0; i < 3; ++i) {
                const row = [];
                for (let j = 0; j < 3; ++j) {
                    const cellElement = document.createElement('div');
                    cellElement.classList.add('cell');
                    cellElement.rowIndex = i;
                    cellElement.colIndex = j;
                    cellElement.style.gridRow = `${i + 1} / ${i + 2}`;
                    cellElement.style.gridColumn = `${j + 1} / ${j + 2}`;
                    boardContainer.appendChild(cellElement);
                    row.push(cellElement);
                }
                grid.push(row);
                triples.push(row);
            }

            for (let j = 0; j < grid[0].length; ++j)
                triples.push([grid[0][j], grid[1][j], grid[2][j]]);

            triples.push([grid[0][0], grid[1][1], grid[2][2]]);
            triples.push([grid[0][2], grid[1][1], grid[2][0]]);
        }

        return {
            getCell,
            getLines,
            checkTripleMark,
            markCell,
            traverseCells
        };
    })();


    const Game = (() => {
        const players = [];
        let playerTurnFlag = false;
        let turn = -1;
        let currentRound = 0;

        const updateScores = () => {
            playerScoreLabel.textContent = players[0].score;
            compScoreLabel.textContent = players[1].score;
        };

        const addPlayers = (player, computer) => {
            players.push(player, computer);
        };

        const hasWinner = () => {
            return GameBoard.getLines().some(line => GameBoard.checkTripleMark(line));
        };

        const promptUserName = () => {
            const name = prompt("Enter your name:");
            return (name == null || name.length === 0)? promptUserName() : name;
        };

        const printMessage = (message) => {
            gameMessageBox.textContent = message;
        };

        const printResults = async (winner) => {
            if (winner == null)
                printMessage(`No more available moves for either player. This round is Draw.`);
            else if (winner === players[0])
                printMessage(`Congratulations! You won against ${players[1].name}.`);
            else
                printMessage(`You lost against ${players[1].name}. Better luck next time..`);

            await sleep(2000);
            printMessage('');
        };

        const printCountdown = async (interval, count, message) => {
            for (; count > 0; --count) {
                printMessage(message.replace('%t', `${count*interval/1000}`));
                await sleep(interval);
            }
            printMessage('');
        };

        const startPlayerTurn = async () => {
            await printCountdown(1000, PLAYER_READY_DELAY/1000, "%t...");

            ++turn;
            playerTurnFlag = true;
            const player = players[turn%players.length];
            printMessage(`${player.name}'s Turn'`);

            if (player.ai) {
                const result = await player.makeAIMove();
                if (result === 1) {
                    playerTurnFlag = false;
                    await startPlayerTurn();
                } else if (result === 2) {
                    playerTurnFlag = false;
                }
            }
        };

        const startRound = async () => {
            ++currentRound;
            roundLabel.textContent = `${currentRound}`;

            updateScores();
            GameBoard.traverseCells(cell => {
                GameBoard.markCell(cell.rowIndex, cell.colIndex, null);
            });

            await printCountdown(1000, ROUND_READY_DELAY/1000, "Starting Round in %t...");
            await startPlayerTurn();
        };

        const recordRound = (winner) => {
            let text = `[${currentRound}] `;
            if (winner == null)
                text = text + `DRAW`;
            else
                text = text + `WINNER: ${winner.name}`;

            const node = document.createElement('li');
            node.textContent = text;
            roundHistoryList.appendChild(node);
        };

        const promptRestart = () => {
            const restart = confirm("Play Again?");
            if (restart)
                startRound();
            else
                printMessage("Thank you for playing!");
            return restart;
        };

        const initInitialState = () => {
            playerNameLabel.textContent = players[0].name;
            compNameLabel.textContent = players[1].name;

            updateScores();
        };

        {
            GameBoard.traverseCells((cell, i, j) => {
                cell.addEventListener('click', async e => {
                    if (playerTurnFlag) {
                        const player = players[turn%players.length];
                        if (!player.ai) {
                            const result = await player.makeMove(i, j);
                            if (result === 1) {
                                playerTurnFlag = false;
                                await startPlayerTurn();
                            } else if (result === 2) {
                                playerTurnFlag = false;
                            }
                        }
                    }
                });
            });
        }

        return {
            addPlayers,
            hasWinner,
            promptUserName,
            printResults,
            promptRestart,
            startRound,
            recordRound,
            initInitialState
        };
    })();


    const Player = (() => {
        // Random name generator
        async function getComputerName() {
            let computerName;
            const request = new XMLHttpRequest();
            request.open("GET", "https://randomuser.me/api/?format=json");
            request.onreadystatechange = () => {
                if (request.readyState === 4 && request.status === 200) {
                    const response = JSON.parse(request.responseText);
                    const name = response.results[0].name;
                    computerName = `${name.title} ${name.first} ${name.last}`;
                }
            };
            request.send();

            while (computerName == undefined) await sleep(10);
            return computerName;
        }

        const playerPrototype = {
            async makeMove(i, j) {
                const result = GameBoard.markCell(i, j, this.mark);

                if (!result) return 0;
 
                if (Game.hasWinner()) {
                    ++this.score;
                    await Game.printResults(this);
                    Game.recordRound(this);
                    return Game.promptRestart()? 2 : 0;
                }

                const hasEmptyCell = GameBoard.traverseCells(cell => {
                    if (cell.textContent == null || cell.textContent.length === 0)
                        return true;
                });
                if (hasEmptyCell == undefined) {
                    await Game.printResults(null);
                    Game.recordRound(null);
                    return Game.promptRestart()? 2 : 0;
                }

                return 1;
            },

            async makeAIMove(level = 0) {
                let i = 0;
                let j = 0;

                // if (level === 0) {
                    i = randInt(0, 2);
                    j = randInt(0, 2);
                    const result = await this.makeMove(i, j);
                    if (result === 0)
                        return await this.makeAIMove(0);
                    return result;

                // } else {
                    

                    //     switch (randInt(0, 3)) {
                    //         case 0:
                    //             i = 0;
                    //             j = 1
                    //             break;
                    //         case 1:
                    //             i = 1;
                    //             j = 2;
                    //             break;
                    //         case 2:
                    //             i = 2;
                    //             j = 1
                    //             break;
                    //         case 3:
                    //             i = 1;
                    //             j = 0;
                    //     }
                    // return await this.makeMove(i, j);
                // }
            }
        };

        return async (name, mark, ai = false) => {
            if ((name == null || name.length === 0) && ai)
                name = await getComputerName();

            return Object.assign(
                Object.create(playerPrototype),
                {name, mark, ai, score: 0}
            );
        };
    })();


    /*
    *   on initialization
    */
    {
        const player = await Player(Game.promptUserName(), 'X');
        const ai = confirm("Play against AI?");
        const computer = await Player(ai? null : Game.promptUserName(), 'O', ai);

        Game.addPlayers(player, computer);
        Game.initInitialState();
        await Game.startRound();
    }
})();