"use client"

import React, { useState } from 'react';

const SimpleInput = () => {
  // 1. Initialize state to hold the input value
  const [text, setText] = useState("");

  // 2. Create a handler to update state when the user types
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <label htmlFor="name-input">Enter Name: </label>
      <input
        id="name-input"
        type="text"
        value={text}           // Bind value to state
        onChange={handleChange} // Update state on every keystroke
        placeholder="Type something..."
      />

      {/* 3. Display the state in real-time */}
      <p>Current value: <strong>{text}</strong></p>

      <button onClick={() => setText("")}>Clear</button>
    </div>
  );
};

export default SimpleInput;