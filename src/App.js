import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { TicTacToe } from './Game';

class TicTacToeClient {
  constructor(rootElement, { playerID } = {}) {
    this.client = Client({
		game: TicTacToe,
		multiplayer: SocketIO({ server: 'localhost:8000' }),
		playerID,
	});
    this.client.start();
    this.rootElement = rootElement;
    this.createBoard();
    this.attachListeners();
    this.client.subscribe(state => this.update(state));
  }

  createBoard() {
    // Create cells in rows for the Tic-Tac-Toe board.
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const cells = [];
      for (let j = 0; j < 3; j++) {
        const id = 3 * i + j;
        cells.push(`<td class="cell" data-id="${id}"></td>`);
      }
      rows.push(`<tr>${cells.join('')}</tr>`);
    }

    // Add the HTML to our app <div>.
    // We’ll use the empty <p> to display the game winner later.
    this.rootElement.innerHTML = `
      <table>${rows.join('')}</table>
      <p class="winner"></p>
    `;
  }

  attachListeners() {
    // Attach event listeners to the board cells.
    const cells = this.rootElement.querySelectorAll('.cell');
    // This event handler will read the cell id from the cell’s
    // `data-id` attribute and make the `clickCell` move.
    const handleCellClick = event => {
      const id = parseInt(event.target.dataset.id);
      this.client.moves.clickCell(id);
    };
    cells.forEach(cell => {
      cell.onclick = handleCellClick;
    });
  }

  update(state) {
	if (state === null) return;
    // Get all the board cells.
    const cells = this.rootElement.querySelectorAll('.cell');
    // Update cells to display the values in game state.
    cells.forEach(cell => {
      const cellId = parseInt(cell.dataset.id);
      const cellValue = state.G.cells[cellId];
      cell.textContent = cellValue !== null ? cellValue : '';
    });
    // Get the gameover message element.
    const messageEl = this.rootElement.querySelector('.winner');
    // Update the element to show a winner if any.
    if (state.ctx.gameover) {
      messageEl.textContent =
        state.ctx.gameover.winner !== undefined
          ? 'Winner: ' + state.ctx.gameover.winner
          : 'Draw!';
    } else {
      messageEl.textContent = '';
    }
  }
}

async function joinGame() {
	const lobbyClient = new LobbyClient({ server: 'http://localhost:8000' });
	const { matches } = await lobbyClient.listMatches('default');
	for (const match of matches) {
	  try {
		console.log(match);
		await lobbyClient.joinMatch(
		  match.gameName,
		  match.matchID,
		  {
			  playerName: '1',
			  playerID: '0',
		  }
		)
		return '0';
	  } catch {};
	}
	const { matchID } = await lobbyClient.createMatch('default', {numPlayers: 2});
	await lobbyClient.joinMatch(
	  'default',
	  matchID,
	  {
		  playerName: '0',
		  playerID: '0',
	  }
	)
	return '0';
}
joinGame().then((playerID) => {
	const appElement = document.getElementById('app');
	const app = new TicTacToeClient(appElement, {playerID: playerID});
	console.log(playerID);
});