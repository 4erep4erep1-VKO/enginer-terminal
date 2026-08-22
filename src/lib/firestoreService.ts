import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from './firebaseConfig';
import { Car, MaintenanceRecord, Part, VehicleTask, UserSettings, DiagnosticSession } from '../types';

// CARS CRUD
export async function fetchUserCars(userId: string): Promise<Car[]> {
  try {
    const q = query(collection(db, 'cars'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Car));
  } catch (error) {
    console.error('Error fetching cars from Firestore:', error);
    return [];
  }
}

export async function saveCarToFirestore(car: Car): Promise<void> {
  try {
    const carRef = doc(db, 'cars', car.id);
    await setDoc(carRef, car, { merge: true });
  } catch (error) {
    console.error('Error saving car to Firestore:', error);
  }
}

export async function deleteCarFromFirestore(carId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cars', carId));
  } catch (error) {
    console.error('Error deleting car from Firestore:', error);
  }
}

// MAINTENANCE RECORDS CRUD
export async function fetchUserRecords(userId: string): Promise<MaintenanceRecord[]> {
  try {
    const q = query(collection(db, 'records'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MaintenanceRecord));
  } catch (error) {
    console.error('Error fetching records from Firestore:', error);
    return [];
  }
}

export async function saveRecordToFirestore(record: MaintenanceRecord): Promise<void> {
  try {
    const recRef = doc(db, 'records', record.id);
    await setDoc(recRef, record, { merge: true });
  } catch (error) {
    console.error('Error saving record to Firestore:', error);
  }
}

export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'records', recordId));
  } catch (error) {
    console.error('Error deleting record from Firestore:', error);
  }
}

// PARTS INVENTORY CRUD
export async function fetchUserParts(userId: string): Promise<Part[]> {
  try {
    const q = query(collection(db, 'parts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Part));
  } catch (error) {
    console.error('Error fetching parts from Firestore:', error);
    return [];
  }
}

export async function savePartToFirestore(part: Part): Promise<void> {
  try {
    const partRef = doc(db, 'parts', part.id);
    await setDoc(partRef, part, { merge: true });
  } catch (error) {
    console.error('Error saving part to Firestore:', error);
  }
}

export async function deletePartFromFirestore(partId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'parts', partId));
  } catch (error) {
    console.error('Error deleting part from Firestore:', error);
  }
}

// TASKS CRUD
export async function fetchUserTasks(userId: string): Promise<VehicleTask[]> {
  try {
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as VehicleTask));
  } catch (error) {
    console.error('Error fetching tasks from Firestore:', error);
    return [];
  }
}

export async function saveTaskToFirestore(task: VehicleTask): Promise<void> {
  try {
    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, task, { merge: true });
  } catch (error) {
    console.error('Error saving task to Firestore:', error);
  }
}

export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task from Firestore:', error);
  }
}

// USER SETTINGS CRUD
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const q = query(collection(db, 'user_settings'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user settings from Firestore:', error);
    return null;
  }
}

export async function saveUserSettingsToFirestore(userId: string, settings: UserSettings): Promise<void> {
  try {
    const settingsRef = doc(db, 'user_settings', userId);
    await setDoc(settingsRef, { ...settings, userId }, { merge: true });
  } catch (error) {
    console.error('Error saving user settings to Firestore:', error);
  }
}

// DIAGNOSTIC SESSIONS CRUD
export async function fetchUserDiagnosticSessions(userId: string): Promise<DiagnosticSession[]> {
  try {
    const q = query(collection(db, 'diagnostic_sessions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as DiagnosticSession));
  } catch (error) {
    console.error('Error fetching diagnostic sessions from Firestore:', error);
    return [];
  }
}

export async function saveDiagnosticSessionToFirestore(session: DiagnosticSession): Promise<void> {
  try {
    const sessionRef = doc(db, 'diagnostic_sessions', session.id);
    await setDoc(sessionRef, session, { merge: true });
  } catch (error) {
    console.error('Error saving diagnostic session to Firestore:', error);
  }
}

export async function deleteDiagnosticSessionFromFirestore(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'diagnostic_sessions', sessionId));
  } catch (error) {
    console.error('Error deleting diagnostic session from Firestore:', error);
  }
}

