import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: 'AIzaSyA4A7P6gZR68GzGhmgcqIar1jCLuvhAPG8',
	authDomain: 'sih25-12264.firebaseapp.com',
	projectId: 'sih25-12264',
	storageBucket: 'sih25-12264.firebasestorage.app',
	messagingSenderId: '788693665934',
	appId: '1:788693665934:web:821df6683469b44941a1df',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
