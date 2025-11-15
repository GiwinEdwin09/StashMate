'use client'

import React, { useState, FormEvent } from 'react';
import { supabase } from "../../lib/supabaseClient";

export default function Auth() {
  const [isSignUp, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  const validateForm = () => {
    // Reset previous messages
    setErrorMessage('');
    
    // Email validation
    if (!email) {
      setErrorMessage('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (!password) {
      console.log('Email is empty'); 
      setErrorMessage('Password is required');
      return false;
    }
    
    if (isSignUp && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up the user with Supabase Auth
        const { error: signUpErr, data } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        
        if (signUpErr) {
          setErrorMessage(signUpErr.message);
          return;
        }
        
        // If sign up is successful, add the user to the users table
        if (data.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                id: data.user.id,
                email: email,
                created_at: new Date().toISOString()
              }
            ]);
            
          if (insertError) {
            console.error('Error adding user to table:', insertError);
            setErrorMessage('Account created but there was an issue saving your profile. Please contact support.');
            return;
          }
        }
        
        setSuccessMessage('Sign up successful! Please check your email for verification.');
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInErr) {
          setErrorMessage(signInErr.message);
          return;
        }
        // Successfully signed in - no need for a message as the user will be redirected
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-black p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">StashMate</h1>
          <p className="mt-2 text-gray-600">
            {isSignUp ? "Please create an account" : "Sign in to your account"}
          </p>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-4 pt-2">
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded font-medium ${
                isLoading 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
            
            <button 
              type="button"
              onClick={() => { 
                setSignup(!isSignUp);
                setErrorMessage('');
                setSuccessMessage('');
              }} 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded"
              disabled={isLoading}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

