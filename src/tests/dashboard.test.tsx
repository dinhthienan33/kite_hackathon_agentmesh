// @vitest-environment jsdom
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

import App from '../App';

describe('Dashboard React Tests', () => {
  let latestES: any = null;

  beforeEach(() => {
    latestES = null;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    
    (global as any).EventSource = class {
      onmessage: ((evt: any) => void) | null = null;
      onerror: ((evt: any) => void) | null = null;
      close() {}
      constructor(_url: string) {
        latestES = this;
      }
    };

    (global as any).fetch = () => Promise.resolve({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders live thought process events (TC-4.1)', async () => {
    const { container } = render(<App />);
    
    const textarea = screen.getByPlaceholderText(/describe a complex task/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Design a logo' } });
    });
    
    const submitButton = screen.getByText(/DEPLOY AGENT MESH/i);
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // EventSource should now be created
    expect(latestES).not.toBeNull();

    await act(async () => {
      latestES.onmessage!({ data: JSON.stringify({ type: 'init', logs: [], transactions: [] }) });
    });

    await act(async () => {
      latestES.onmessage!({ 
        data: JSON.stringify({
          type: 'log',
          log: {
            id: 1,
            timestamp: new Date().toISOString(),
            agent: 'Manager',
            message: 'Negotiating...',
            type: 'thought'
          }
        })
      });
    });

    expect(screen.getByText('Negotiating...')).toBeInTheDocument();
  });

  it('renders transaction receipts (TC-4.2)', async () => {
    const { container } = render(<App />);
    
    const textarea = screen.getByPlaceholderText(/describe a complex task/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Design a logo' } });
    });
    
    const submitButton = screen.getByText(/DEPLOY AGENT MESH/i);
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(latestES).not.toBeNull();

    await act(async () => {
      latestES.onmessage!({ 
        data: JSON.stringify({
          type: 'transaction',
          transaction: {
            id: '0x1234567890abcdef',
            from: '0xAAA',
            to: '0xBBB',
            amount: 5,
            currency: 'USDC',
            status: 'Success',
            gas: '0.00 (Paymaster Sponsored)',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    // The App renders tx.id.slice(0, 10) which is '0x12345678'
    // So we search for that substring
    expect(screen.getByText(/TX: 0x12345678/)).toBeInTheDocument();
    expect(screen.getByText('5 USDC')).toBeInTheDocument();
  });
  
  it('renders final output (TC-4.3)', async () => {
    const { container } = render(<App />);
    
    const textarea = screen.getByPlaceholderText(/describe a complex task/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Design a logo' } });
    });
    
    const submitButton = screen.getByText(/DEPLOY AGENT MESH/i);
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(latestES).not.toBeNull();

    await act(async () => {
      latestES.onmessage!({ 
        data: JSON.stringify({
          type: 'log',
          log: {
            id: 3,
            timestamp: new Date().toISOString(),
            agent: 'Designer',
            message: 'DELIVERABLE: logo.png',
            type: 'deliverable'
          }
        })
      });
    });

    expect(screen.getByText('DELIVERABLE: logo.png')).toBeInTheDocument();
  });
});
