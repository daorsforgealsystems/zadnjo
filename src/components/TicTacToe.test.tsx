import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TicTacToe, { calculateWinner } from './TicTacToe';

describe('calculateWinner', () => {
  it('returns X when X wins', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(calculateWinner(board as any)).toBe('X');
  });

  it('returns null when no winner', () => {
    const board = [null, 'X', 'O', 'O', 'X', null, null, null, null];
    expect(calculateWinner(board as any)).toBeNull();
  });
});

describe('TicTacToe component', () => {
  it('lets players click squares and shows turns', async () => {
    render(<TicTacToe />);
    const user = userEvent.setup();

    const firstSquare = screen.getByLabelText('square-0');
    await user.click(firstSquare);
    expect(firstSquare).toHaveTextContent('X');

    const secondSquare = screen.getByLabelText('square-1');
    await user.click(secondSquare);
    expect(secondSquare).toHaveTextContent('O');

    // ensure history buttons exist
    const jumpButtons = screen.getAllByRole('button', { name: /Go to/ });
    expect(jumpButtons.length).toBeGreaterThanOrEqual(1);
  });
});
