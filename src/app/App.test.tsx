/**
 * App.test.tsx — render smoke tests. Verifies the component tree mounts without runtime
 * errors and that core content and the baseline numbers appear.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App renders', () => {
  it('mounts with header, tabs, and result cards', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Scenario Simulator/i })).toBeTruthy();
    expect(screen.getAllByText(/Indoor temperature/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/what changed and why/i)).toBeTruthy();
    // Baseline label present (proof-of-concept framing).
    expect(screen.getByText(/Illustrative representative room/i)).toBeTruthy();
  });

  it('switches to the Methodology tab and shows the disclaimer', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Methodology' }));
    expect(screen.getByText(/Core equations/i)).toBeTruthy();
    expect(screen.getAllByText(/sol-air/i).length).toBeGreaterThan(0);
  });

  it('applies a preset without crashing', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Envelope retrofit' }));
    expect(screen.getByText(/Baseline vs scenario/i)).toBeTruthy();
  });

  it('renders the Phase 5 tabs: Hourly, Optimise, Economics', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Hourly' }));
    expect(screen.getByText(/hourly quasi-steady-state scenario analysis/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Optimise' }));
    expect(screen.getByText(/Brute-force search/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Economics' }));
    expect(screen.getByText(/sustainability dimensions/i)).toBeTruthy();
    expect(screen.getByText(/Simple payback/i)).toBeTruthy();
  });
});
