import Board from "./board.js";
import Pool, { BonusPool } from "./pool.js";
import Dice, { DICE_1, DICE_2, DICE_3, DICE_4 } from "./dice.js";
import { Cell } from "./cell.js";
import Tile from "./tile.js";
import * as html from "./html.js";

const DEMO = ["bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t"];
//const DEMO = ["bridge"];

export default class Round {
	node: HTMLElement;
	_num: number;
	_pending: Dice | null = null;
	_pool: Pool;
	_bonusPool: BonusPool;
	_board: Board;
	_end: HTMLButtonElement = html.node("button");
	_placedTiles = new Set<Tile>();

	constructor(num: number, board: Board, bonusPool: BonusPool) {
		this._num = num;
		this._board = board;
		this._bonusPool = bonusPool;

		this._pool = new Pool();
		this.node = this._pool.node;

		this._end.textContent = `End round #${this._num}`;
		this._end.disabled = true;
	}

	start(type = "") {
		this._pool.onClick = dice => this._onPoolClick(dice);
		this._bonusPool.onClick = dice => this._onPoolClick(dice);
		this._board.onClick = cell => this._onBoardClick(cell);

		switch (type) {
			case "demo":
				DEMO.map(type => Dice.withTile(type, "0"))
					.forEach(dice => this._pool.add(dice));
			break;

			default:
				this._pool.add(Dice.withRandomTile(DICE_1));
				this._pool.add(Dice.withRandomTile(DICE_2));
				this._pool.add(Dice.withRandomTile(DICE_3));
				this._pool.add(Dice.withRandomTile(DICE_4));
			break;
		}

		this.node.appendChild(this._end);
		this._bonusPool.unlock();

		return new Promise(resolve => {
			this._end.addEventListener("pointerdown", () => resolve());
		});
	}

	_onPoolClick(dice: Dice) {
		if (this._pending == dice) {
			this._pending = null;
			this._board.signalAvailable(null);
			this._pool.signal(null);
			this._bonusPool.signal(null);
		} else {
			this._pending = dice;
			this._board.signalAvailable(dice.tile);
			this._pool.signal(dice);	
			this._bonusPool.signal(dice);	
		}
	}

	_onBoardClick(cell: Cell) {
		const x = cell.x;
		const y = cell.y;
		if (this._pending) {
			let tile = this._pending.tile;
			if (!this._board.wouldFit(tile, x, y)) { return false; }

			this._board.placeBest(tile, x, y, this._num);
			this._board.signalAvailable(null);

			this._pool.signal(null);
			this._bonusPool.signal(null);

			this._pool.disable(this._pending);
			this._bonusPool.disable(this._pending);

			this._pending = null;
			this._placedTiles.add(tile);

			if (this._pool.length == 0) { this._end.disabled = false; } // fixme re-disable on return
		} else {
			let tile = cell.tile;
			if (!tile) { return; }
			if (!this._placedTiles.has(tile)) { return; }
			this._board.cycleTransform(x, y);
		}
	}
}
