import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../src/components/ProgressBar';

describe('ProgressBar', () => {
  it('shows the completed/total counts', () => {
    render(<ProgressBar completed={3} total={10} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('computes 0% without dividing by zero when total is 0', () => {
    render(<ProgressBar completed={0} total={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('computes a rounded percentage for the bar width', () => {
    render(<ProgressBar completed={1} total={3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });
});
