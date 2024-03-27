import React from 'react';
import { signOutUser } from './AuthService'; // Adjust the path as necessary

function SignOut() {
  const handleSignOut = async () => {
    try {
      await signOutUser();
      // Optionally redirect the user or indicate sign-out success
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  );
}

export default SignOut;
