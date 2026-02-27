import { useMemo, useState } from 'react';

const GRID_SIZE = 9;
const BOX_SIZE = 3;

const createEmptyGrid = () =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));

const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const isValid = (board, row, col, value) => {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (board[row][i] === value || board[i][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if (board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
};

const solveBoard = (board) => {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] === 0) {
        for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveBoard(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generatePuzzle = (emptyCells = 48) => {
  const solved = createEmptyGrid();
  solveBoard(solved);

  const puzzle = solved.map((row) => [...row]);
  let removed = 0;

  while (removed < emptyCells) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed += 1;
    }
  }

  return {
    puzzle,
    solution: solved,
  };
};

const toCellGrid = (puzzle) =>
  puzzle.map((row) => row.map((value) => ({
    value: value === 0 ? '' : String(value),
    fixed: value !== 0,
  })));

const findConflicts = (cells) => {
  const conflicts = new Set();

  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const current = cells[r][c].value;
      if (!current) {
        continue;
      }

      for (let i = 0; i < GRID_SIZE; i += 1) {
        if (i !== c && cells[r][i].value === current) {
          conflicts.add(`${r}-${c}`);
          conflicts.add(`${r}-${i}`);
        }
        if (i !== r && cells[i][c].value === current) {
          conflicts.add(`${r}-${c}`);
          conflicts.add(`${i}-${c}`);
        }
      }

      const startRow = Math.floor(r / BOX_SIZE) * BOX_SIZE;
      const startCol = Math.floor(c / BOX_SIZE) * BOX_SIZE;
      for (let row = startRow; row < startRow + BOX_SIZE; row += 1) {
        for (let col = startCol; col < startCol + BOX_SIZE; col += 1) {
          if ((row !== r || col !== c) && cells[row][col].value === current) {
            conflicts.add(`${r}-${c}`);
            conflicts.add(`${row}-${col}`);
          }
        }
      }
    }
  }

  return conflicts;
};

const App = () => {
  const [game, setGame] = useState(() => generatePuzzle());
  const [cells, setCells] = useState(() => toCellGrid(game.puzzle));
  const [message, setMessage] = useState('Fill the grid with numbers 1–9.');

  const conflicts = useMemo(() => findConflicts(cells), [cells]);

  const startNewGame = () => {
    const next = generatePuzzle();
    setGame(next);
    setCells(toCellGrid(next.puzzle));
    setMessage('New puzzle generated. Good luck!');
  };

  const updateCell = (row, col, nextValue) => {
    if (!/^([1-9])?$/.test(nextValue) || cells[row][col].fixed) {
      return;
    }

    setCells((prev) => prev.map((line, r) => line.map((cell, c) => {
      if (r === row && c === col) {
        return {
          ...cell,
          value: nextValue,
        };
      }
      return cell;
    })));
  };

  const checkProgress = () => {
    if (conflicts.size > 0) {
      setMessage('There are conflicts in the grid.');
      return;
    }

    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (cells[r][c].value === '') {
          setMessage('Keep going — puzzle is not complete yet.');
          return;
        }
      }
    }

    const solved = cells.every((row, r) => row.every((cell, c) => Number(cell.value) === game.solution[r][c]));
    setMessage(solved ? '🎉 You solved it!' : 'Almost there — some values are incorrect.');
  };

  const revealSolution = () => {
    setCells(game.solution.map((row) => row.map((value) => ({ value: String(value), fixed: true }))));
    setMessage('Solution revealed. Start a new game to try again.');
  };

  return (
    <main className="app">
      <header>
        <h1>React Sudoku</h1>
        <p>{message}</p>
      </header>

      <section className="board" aria-label="Sudoku board">
        {cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const borderClass = [
              colIndex % 3 === 0 ? 'left-bold' : '',
              rowIndex % 3 === 0 ? 'top-bold' : '',
              colIndex === GRID_SIZE - 1 ? 'right-bold' : '',
              rowIndex === GRID_SIZE - 1 ? 'bottom-bold' : '',
            ].join(' ');

            return (
              <input
                aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                className={`cell ${borderClass} ${cell.fixed ? 'fixed' : ''} ${conflicts.has(cellKey) ? 'conflict' : ''}`}
                disabled={cell.fixed}
                inputMode="numeric"
                key={cellKey}
                maxLength={1}
                onChange={(event) => updateCell(rowIndex, colIndex, event.target.value.trim())}
                type="text"
                value={cell.value}
              />
            );
          }),
        )}
      </section>

      <section className="actions">
        <button onClick={startNewGame} type="button">New Game</button>
        <button onClick={checkProgress} type="button">Check Progress</button>
        <button onClick={revealSolution} type="button">Solve</button>
      </section>
    </main>
  );
};

export default App;
