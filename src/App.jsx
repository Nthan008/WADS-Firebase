import React, { useState, useEffect } from "react";
import { onAuthStateChange, signIn, signUp, signOutUser, resetPassword } from "./AuthService.js"; // Adjust path as needed
import { signInWithGoogle } from "./AuthService.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { createUserProfile } from './FirestoreService'; // This is a function you will create
import { doc} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig'; // Adjust the path as per your project structure
import { getStorage, uploadBytesResumable } from 'firebase/storage';
import {  query, where,  } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Adjust the path if necessary
import { realtimeDB } from './firebaseConfig';
import { onValue } from 'firebase/database';
import completebutton from "./images/red.png"
import deletebutton from "./images/delete.png"
import defaultbutton from "./images/default.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';


function ProfileUpdateForm({ user }) {
  const [newUsername, setNewUsername] = useState('');

  const handleUsernameUpdate = async () => {
    try {
      // Update the username in the database
      await updateDoc(doc(db, 'users', user.uid), {
        username: newUsername
      });
      console.log('Username updated successfully!');
      // Optionally, you can also update the local state to reflect the new username
      // setNewUsername(''); // Clear the input field
    } catch (error) {
      console.error('Error updating username:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="mt-4 bg-gray-50 p-4 border border-gray-300 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">Profile Information</h3>
      <p><strong>Email:</strong> {user.email}</p>
      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2">Update Username</h4>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="New Username"
          className="w-full p-2 mb-2 bg-white border border-gray-300 rounded-md"
        />
        <button onClick={handleUsernameUpdate} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Update</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [todo, setTodo] = useState(""); 
  const [todoList, setTodoList] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'ongoing', 'completed'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showProfile, setShowProfile] = useState(false); // State to toggle profile visibility
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]); // State to hold filtered tasks

  
  // Initialize Firebase Storage
  const storage = getStorage();
  
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        const userData = doc.data();
        if (userData) {
          // Assuming that the username field in Firestore is called 'username'
          setUser(prevUser => ({ ...prevUser, username: userData.username }));
        }
      });
      return () => unsubscribe();
    }
  }, [user]);
  
  const fetchProfileImageFromStorage = async () => {
    if (!user) {
      // No user logged in, return
      return;
    }
  
    const profileImageRef = ref(storage, `/profile_images/${user.uid}/Check.jpeg`); // Construct path with user's UID
    try {
      const url = await getDownloadURL(profileImageRef);
      setProfileImageUrl(url);
    } catch (error) {
      // If no profile image is found, set a default image
      setProfileImageUrl(defaultbutton);
    }
  };
  
  
  useEffect(() => {
    const fetchProfileImageFromStorage = async () => {
      if (!user) {
        // No user logged in, return
        return;
      }
    
      const profileImageRef = ref(storage, `/profile_images/${user.uid}/Check.jpeg`); // Construct path with user's UID
      try {
        const url = await getDownloadURL(profileImageRef);
        setProfileImageUrl(url);
      } catch (error) {
        // If no profile image is found, set a default image
        setProfileImageUrl(defaultbutton);
      }
    };
  
    fetchProfileImageFromStorage(); // Fetch profile image whenever user state changes
  }, [user]); // Execute whenever user state changes
  


  useEffect(() => {
    // Define and call fetchTasksFromFirebase function
    const fetchTasksFromFirebase = async () => {
      const db = firebase.firestore();
      const snapshot = await db.collection('tasks').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data;
    };

    fetchTasksFromFirebase().then((data) => {
      setTasks(data);
    });
  }, []);

  useEffect(() => {
    // Filter tasks based on the selected filter option
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else if (filter === 'ongoing') {
      setFilteredTasks(tasks.filter(task => !task.completed));
    } else if (filter === 'completed') {
      setFilteredTasks(tasks.filter(task => task.completed));
    }
  }, [filter, tasks]);
    
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const updatedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(updatedTasks);
    });
  
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const fetchTasks = async () => {
      const q = query(collection(db, "tasks")); // Adjust query as needed, e.g., add where() for filtering
      const querySnapshot = await getDocs(q);
      const fetchedTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(fetchedTasks); // Update state with fetched tasks
    };

    fetchTasks().catch(console.error);
  }, []); 

  // Log username changes
  useEffect(() => {
    console.log("Username updated:", username);
  }, [username]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log("Auth state changed, user:", user);
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  console.log("Current user state:", user);

  const handleImageUpload = async () => {
    try {
      if (!selectedImage) {
        throw new Error('No image selected');
      }
      
      // Firebase storage reference
      const storageRef = ref(storage, `profile_images/${user.uid}/Check.jpeg`); // Use the same pattern as fetchProfileImageFromStorage
      
      // Upload image to Firebase storage 
      const uploadTaskSnapshot = await uploadBytesResumable(storageRef, selectedImage);
      console.log('Upload successful:', uploadTaskSnapshot);
      
      // Get download URL for the uploaded image
      const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);
      console.log('File available at:', downloadURL);
      
      // Update profile image URL in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: downloadURL,
      });
      
      // Reset selected image state
      setSelectedImage(null);
  
      // Fetch updated profile image
      fetchProfileImageFromStorage();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };
  
  
  
  
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
  };
  

  const handleForm = async (e) => {
    e.preventDefault();
    if (!user) {
      // User not authenticated
      console.error('User not authenticated.');
      return;
    }
    const newTask = { userId: user.uid, todoName: todo, completed: false };
    try {
      await addDoc(collection(db, 'tasks'), newTask);
      setTodo(""); // Clear the input field
    } catch (error) {
      console.error("Error adding document: ", error);
      // Optionally, inform the user that the operation failed
    }
    setTodo(""); // Clear the input field
  };

  const toggleTodoCompletion = async (todoId, currentCompletedStatus) => {
    const todoRef = doc(db, 'tasks', todoId);
    
    try {
      await updateDoc(todoRef, {
        completed: !currentCompletedStatus // Toggle the completion status
      });
      // Update local state to reflect the change
      const updatedTodoList = todoList.map((todo) => {
        if (todo.id === todoId) { // Assuming each todo item has an 'id' field
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      });
      setTodoList(updatedTodoList);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };
  
  // New deleteTask function
  const deleteTask = async (todoId) => {
    const todoRef = doc(db, 'tasks', todoId);
  
    try {
      await deleteDoc(todoRef);
      // Update local state to remove the task
      const updatedTodoList = todoList.filter(todo => todo.id !== todoId);
      setTodoList(updatedTodoList);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };
  
  const getFilteredTodos = () => {
    switch (filter) {
      case "ongoing":
        return todoList.filter((todo) => !todo.completed);
      case "completed":
        return todoList.filter((todo) => todo.completed);
      case "all":
      default:
        return todoList;
    }
  };

  const handleAuth = async (action) => {
    try {
      if (action === 'signUp') {
        await signUp(email, password);
      } else if (action === 'signIn') {
        await signIn(email, password);
      } else if (action === 'resetPassword') {
        await resetPassword(email);
        alert('Check your email for the password reset link.');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAuthAction = async (action) => {
    try {
      if (action === 'signIn') {
        await signIn(email, password);
        // ... handle sign-in success
      } else if (action === 'signUp') {
        if (password !== confirmPassword) {
          alert("Passwords don't match.");
          return;
        }
        console.log('Username before sign up:', username); // Add this console log
        const userCredential = await signUp(email, password, username);
        // Create user profile in Firestore
        await createUserProfile(userCredential.user.uid, {
          username: username,
          email: email,
        });
        setSuccessMessage('Sign up successful, please login.');
        setTimeout(() => {
          setIsSignUp(false); // Redirect back to the login page
          setSuccessMessage(''); // Clear the success message
        }, 3000); // Redirect after 3 seconds
      }
      
      // ... handle other actions
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile); // Toggle the visibility of the profile section
  };

  // Function to navigate to the profile section
  const navigateToProfile = () => {
    setShowProfile(true); // Show the profile section
  };
  return (
    <>
      {!user ? (
         <div className="min-h-screen flex flex-col items-center justify-center bg-custom-bg">
         <div className="max-w-md w-full mx-auto p-8 border-yellow-500 border-4 bg-red-900 rounded-xl shadow-md">
           {isSignUp ? (
             <>
               <h2 className="text-4xl font-bold text-center text-yellow-500 mb-8">Sign Up</h2>
               <input
   type="text"
   value={username}
   onChange={(e) => setUsername(e.target.value)}
   placeholder="Username"
   className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
 />
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email Address"
                 className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
               />
              
 
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Password"
                 className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
               />
               <input
                 type="password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 placeholder="Confirm Password"
                 className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
               />
               <button onClick={() => handleAuthAction('signUp')} className="w-full p-3 bg-light-brown border-yellow-500 border-2 text-white rounded-lg hover:bg-yellow-600">Sign Up</button>
             </>
           ) : (
             <>
               <h2 className="text-4xl font-bold text-center text-yellow-500 mb-8 ">Login</h2>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email Address"
                 className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
               />
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Password"
                 className="w-full p-4 mb-4 bg-gray-50 border border-gray-300 rounded-lg"
               />
               <button onClick={() => handleAuthAction('signIn')} className="w-full p-3 bg-light-brown border-yellow-500 border-2 text-white rounded-lg hover:bg-yellow-600">Login</button>
               <div className="my-4 flex items-center justify-center">
                 <div className="h-px bg-gray-300 flex-grow"></div>
                 <div className="h-px bg-gray-300 flex-grow"></div>
               </div>
               <button onClick={signInWithGoogle} className="w-full p-3 bg-light-brown border-yellow-500 border-2 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center">
  <FontAwesomeIcon icon={faGoogle} className="mr-2" /> {/* Add some margin to separate the icon from text */}
  Login with Google
</button>
             </>
           )}
           <div className="flex justify-center mt-4">
             <button onClick={() => setIsSignUp(!isSignUp)} className="text-yellow-500 hover:text-yellow-600 font-bold">
               {isSignUp ? "Sign in here" : "Sign up here"}
           </button>
         </div>
       </div>
     </div>
        ) : (
          <>
            {!showProfile && (
              <div className="App bg-custom-bg ">
                <button onClick={signOutUser} className="sign-out-arrow">
                  ← Sign Out
                </button>
                <div className="bg-custom-bg w-full h-screen flex flex-col items-center">
                  <h1 className="text-5xl text-yellow-500 font-bold mb-4 mt-4 text-shadow">Todo List</h1>
                  <h2 className="text-2xl text-yellow-500 font-bold mb-8 mt-4 relative">Carlo Nathanael Bessie 2602236685</h2>
                  {profileImageUrl && (
                    <button onClick={navigateToProfile}>
                      <img src={profileImageUrl} alt="Profile" className="absolute top-4 right-4 w-16 h-16 rounded-full cursor-pointer" />
                    </button>
                  )}
                  
                  
                  <div className="w-full flex items-center flex-col">
                    <div className="w-[500px] mx-auto bg-red-900 p-5 border-yellow-500 border-solid border-4 relative mb-8 rounded-lg">
                      <div className="w-full flex justify-center">
                        <button onClick={navigateToProfile} className="bg-light-brown text-white py-3 px-8 rounded-lg w-full border-yellow-500 border-2 mb-5">
                          View Profile
                        </button>
                      </div>
                      <form onSubmit={handleForm} className="flex flex-col items-center">
                        <div className="w-full">
                          <input className="border-2 placeholder:text-gray-500 rounded-lg border-yellow-500 w-full p-5 mb-5 text-black" type="text" placeholder="Add Todo" value={todo} onChange={(e) => setTodo(e.target.value)} />
                        </div>
                        <div className="w-full flex justify-center">
                          <button type="submit" className="bg-light-brown text-white py-3 px-8 rounded-lg w-full border-yellow-500 border-2">
                            Add
                          </button>
                        </div>
                      </form>
                    </div>
                    <div className="w-[500px] mx-auto bg-red-900 p-5 border-yellow-500 border-solid border-4 relative rounded-lg">
  <div className="mb-4 flex justify-start">
    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-yellow-500 text-white py-2 px-3 rounded-lg border-yellow-500 border-2">
      <option value="all">All</option>
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
    </select>
  </div>
  <div className="todo-show-area">
    <ul>
      {filteredTasks.map((singleTodo, index) => (
        <li
          key={index}
          className={`mb-5 mx-0 flex justify-between items-center rounded-lg text-xl pr-5 pl-2 ${
            singleTodo.completed ? "bg-light-brown border-2 border-yellow-500" : "bg-light-brown border-yellow-500 border-2"
          }`}
          style={{ minHeight: '2.5rem' }}
        >
          <div
            className="w-80 h-6 bg-white flex justify-left items-center rounded px-3"
            style={{ lineHeight: '1rem' }}
          >
            {singleTodo.todoName}
          </div>
          <div className="flex items-center">
            <img
              onClick={() => toggleTodoCompletion(singleTodo.id, singleTodo.completed)}
              src={completebutton}
              alt={singleTodo.completed ? "Undo" : "Complete"}
              className="cursor-pointer mx-2 h-8 border-2 border-white rounded"
            />
            <img
              onClick={() => deleteTask(singleTodo.id)}
              src={deletebutton}
              alt="Delete"
              className="cursor-pointer text-red-500 h-8 mr-2 border-2 border-white rounded"
            />
            <span className={` pr-2 text-sm ${singleTodo.completed ? "text-green-500" : "text-yellow-500"}`}>
              {singleTodo.completed ? "Completed" : "Ongoing"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </div>  
</div>

                  </div>
                </div>
              </div>
            )}
            {showProfile && (
  <div className="min-h-screen flex flex-col items-center justify-center bg-custom-bg">
    <div className="max-w-md w-full mx-auto p-8 border-yellow-500 border-4 bg-red-900 rounded-xl shadow-md">
      <div className="mt-4 bg-white p-4 border border-gray-300 rounded-lg">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">Profile Information</h3>
        <div className="mb-4">
          <strong>Email:</strong>
          <p className="text-light-brown">{user.email}</p>
        </div>
        <div className="mb-4">
          <strong>Username:</strong>
          <p className="text-light-brown">{user.username}</p>
        </div>
        <div className="mb-2">
          <label htmlFor="profileImage" className="block mb-2 text-sm font-medium text-gray-900">Profile Picture:</label>
          <input type="file" id="profileImage" onChange={handleImageSelect} accept="image/*" className="text-sm text-grey-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-brown file:text-white hover:file:bg-yellow-600" />
          {selectedImage && (
            <button onClick={handleImageUpload} className="mt-2 w-full bg-light-brown text-white py-2 px-4 rounded-lg hover:bg-yellow-600">Upload Profile Picture</button>
          )}
        </div>
        {profileImageUrl && (
          <div className="flex justify-center mt-4">
            <img src={profileImageUrl} alt="Profile" className="w-20 h-20 rounded-full border-2 border-light-brown" />
          </div>
        )}
        <button onClick={toggleProfile} className="mt-4 w-full bg-light-brown text-white py-3 px-8 rounded-lg hover:bg-yellow-600">Go to Todo List</button>
      </div>
    </div>
  </div>



            )}
            </>
            )}
            </>
);
}



    




export default App;
