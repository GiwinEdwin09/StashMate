'use client'

import React, { useState, FormEvent } from 'react';
import { supabase } from "../../lib/supabaseClient";

export default function Auth() {
  const [isSignUp, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleClick = async () => {
    if (isSignUp) {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      
      if (signUpErr) {
        console.error('error sign up', signUpErr.message);
        return;
      }
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      
      if (signInErr) {
        console.error('error sign up', signInErr.message);
        return;
      };
    }
  }

return (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-100">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">StashMate</h1>
        {isSignUp ? "Please create an account" : "Sign In into your account"}
        
        <div className="space-y-4 mt-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
          />
          
          <div className="flex flex-col gap-4">
            <button onClick={handleClick}
              className="w-full bg-blue-100 text-black py-2 px-4 rounded">
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
            
            <button onClick={() => { setSignup(!isSignUp) }} className="w-full bg-black-100 text-black py-2 px-4 rounded">
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}