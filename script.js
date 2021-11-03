(async () => {
    'use strict';

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

    const GameBoard = (() => {
        const grid = [];
        const triples = [];

        const getCell = (i, j) => {
            return grid[i][j];
        };

        const getLines = () => {
            return triples;
        }

        const markCell = (i, j, value) => {
            const cell = grid[i][j];
            cell.textContent = value;
            if (value == null)
                cell.classList.remove('marked');
            else
                cell.classList.add('marked');
        };

        const checkTripleMark = (line) => {
            return tripleEquals(
                line[0].textContent,
                line[1].textContent,
                line[2].textContent
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
            const onCellElementClick = () => {

            };

            for (let i = 0; i < 3; ++i) {
                const row = [];
                for (let j = 0; j < 3; ++j) {
                    const cellElement = document.createElement('div');
                    cellElement.classList.add('gameboard');
                    cellElement.rowIndex = i;
                    cellElement.colIndex = j;
                    cellElement.style.gridRow = `${i + 1} / ${i + 2}`;
                    cellElement.style.gridColumn = `${j + 1} / ${j + 2}`;
                    cellElement.addEventListener('click', onCellElementClick);
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


    const Game = {
        hasWinner() {
            return GameBoard.getLines().some(line => GameBoard.checkTripleMark(line));
        },

        announceWinner(player) {

        },

        promptUserName() {
            const name = prompt("Enter your name:");
            return (name == null || name.length == 0)? this.promptUserName() : name;
        }
    };


    const Player = (() => {
        async function getComputerName() {
            let computerName;
            const request = new XMLHttpRequest();
            request.open("GET", "https://randomuser.me/api/?format=json");
            request.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    const response = JSON.parse(this.responseText);
                    const name = response.results[0].name;
                    computerName = `${name.title} ${name.first} ${name.last}`;
                }
            };
            request.send();
        
            while (computerName == undefined) await sleep(10);
            return computerName;
        }

        const playerPrototype = {
            makeMove(i, j) {
                GameBoard.markCell(i, j, mark);
                if (Game.hasWinner()) {
                    Game.announceWinner(this);
                }
            },

            makeAIMove() {
                const i = 0;
                const j = 0;
                makeMove(i, j);
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
        const playerName = await Player(Game.promptUserName(), 'X');
        const compName = await Player(null, 'O', true);

        const players = [];
        players.push(playerName);
        players.push(compName);

        playerNameLabel.textContent = players[0].name;
        compNameLabel.textContent = players[1].name;
        // for (let turn = 0; ; ++turn) {
        //     if (turn%players.length == 0) {
                
        //     }
        // }
    }
})()