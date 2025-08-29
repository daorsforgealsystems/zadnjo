import React, { useState } from 'react';

export type SquareValue = 'X' | 'O' | null;

export function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

const initialSquares = (): SquareValue[] => Array(9).fill(null);

export default function TicTacToe(): JSX.Element {
  const [history, setHistory] = useState<{ squares: SquareValue[] }[]>([{ squares: initialSquares() }]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);

  const current = history[step];

  function handleClick(i: number) {
    const sliced = history.slice(0, step + 1);
    const currentEntry = sliced[sliced.length - 1];
    const squares = currentEntry.squares.slice() as SquareValue[];
    if (calculateWinner(squares) || squares[i]) return;
    squares[i] = xIsNext ? 'X' : 'O';
    setHistory(sliced.concat([{ squares }]));
    setStep(sliced.length);
    setXIsNext(!xIsNext);
  }

  function jumpTo(move: number) {
    setStep(move);
    setXIsNext((move % 2) === 0);
  }

  const winner = calculateWinner(current.squares);

  return (
    <div className="tic-tac-toe">
      <div className="game-board grid grid-cols-3 gap-2 max-w-xs">
        {current.squares.map((value, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className="h-12 w-12 bg-white/5 rounded-md flex items-center justify-center text-xl font-semibold border"
            aria-label={`square-${i}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 font-medium">{winner ? `Winner: ${winner}` : `Next player: ${xIsNext ? 'X' : 'O'}`}</div>
        <ol className="list-decimal pl-5 space-y-1 max-w-xs">
          {history.map((stepEntry, move) => {
            const desc = move ? `Go to move #${move}` : 'Go to game start';
            return (
              <li key={move}>
                <button
                  type="button"
                  onClick={() => jumpTo(move)}
                  className={`text-sm text-left underline decoration-dotted ${move === step ? 'font-semibold' : ''}`}
                >
                  {desc}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
