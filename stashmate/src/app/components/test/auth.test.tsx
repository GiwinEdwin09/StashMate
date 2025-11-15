import { it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor,cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '../auth';


vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));


beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

it('switches to sign up form when button is clicked', async () => {
  render(<Auth />);
  
  const switchButton = screen.getByText("Don't have an account? Sign Up");
  
  await userEvent.click(switchButton);
  
  screen.getByText('Please create an account');
});


  it('shows error when email is empty', async () => {
    render(<Auth />);
    
    const submitButton = screen.getByText('Sign In');
    await userEvent.click(submitButton);
    
    screen.getByText('Email is required');
  });

    it('shows error when email format is invalid', async () => {
      render(<Auth />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByText('Sign In');
      await userEvent.click(submitButton);
      
    });
