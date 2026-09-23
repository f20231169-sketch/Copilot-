/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// -------------------------------------------------------------
// Connection Validation (per Skill guidelines)
// -------------------------------------------------------------
export async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable. Please check network.');
    }
  }
}

// -------------------------------------------------------------
// Error Handling conforming to FirestoreErrorInfo
// -------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security / Operation Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// Auth Services
// -------------------------------------------------------------
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error('Sign-Out failed:', err);
    throw err;
  }
}

export function onAuthStatusChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await syncUserProfile(user);
      } catch (e) {
        console.warn('Sync profile on auth change note:', e);
      }
    }
    callback(user);
  });
}

// -------------------------------------------------------------
// User Profile Persistence
// -------------------------------------------------------------
export async function syncUserProfile(user: User, role = 'operations_lead') {
  if (!user?.uid) return;
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);

    if (!existingSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || 'Operator',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update display name or avatar if changed
      await setDoc(
        userDocRef,
        {
          displayName: user.displayName || 'Operator',
          photoURL: user.photoURL || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Conversation & Messages Multi-Turn Persistence
// -------------------------------------------------------------
export interface StoredConversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  role: string;
  messageCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface StoredChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  roleUsed?: string;
  timestamp: string;
  createdAt?: any;
}

export async function createOrUpdateConversation(
  userId: string,
  conv: { id: string; title: string; model: string; role: string; messageCount: number }
) {
  const path = `users/${userId}/conversations/${conv.id}`;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conv.id);
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      await setDoc(convRef, {
        id: conv.id,
        userId,
        title: conv.title,
        model: conv.model,
        role: conv.role,
        messageCount: conv.messageCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        convRef,
        {
          title: conv.title,
          model: conv.model,
          role: conv.role,
          messageCount: conv.messageCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function addChatMessageToFirestore(
  userId: string,
  conversationId: string,
  msg: {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    modelUsed?: string;
    roleUsed?: string;
    timestamp: string;
  }
) {
  const path = `users/${userId}/conversations/${conversationId}/messages/${msg.id}`;
  try {
    const msgRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', msg.id);
    await setDoc(msgRef, {
      id: msg.id,
      userId,
      conversationId,
      sender: msg.sender,
      content: msg.content,
      modelUsed: msg.modelUsed || 'gemini-3.5-flash',
      roleUsed: msg.roleUsed || 'operations_lead',
      timestamp: msg.timestamp,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchUserConversations(userId: string): Promise<StoredConversation[]> {
  const path = `users/${userId}/conversations`;
  try {
    const colRef = collection(db, 'users', userId, 'conversations');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StoredConversation);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchConversationMessages(
  userId: string,
  conversationId: string
): Promise<StoredChatMessage[]> {
  const path = `users/${userId}/conversations/${conversationId}/messages`;
  try {
    const colRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StoredChatMessage);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// -------------------------------------------------------------
// Saved Audits Persistence
// -------------------------------------------------------------
export interface StoredSavedAudit {
  id: string;
  userId: string;
  title: string;
  datasetName: string;
  voicesCount: number;
  csatAverage: number;
  topCluster: string;
  topStore: string;
  notes?: string;
  createdAt?: any;
}

export async function saveAuditToFirestore(
  userId: string,
  audit: {
    id: string;
    title: string;
    datasetName: string;
    voicesCount: number;
    csatAverage: number;
    topCluster: string;
    topStore: string;
    notes?: string;
  }
) {
  const path = `users/${userId}/savedAudits/${audit.id}`;
  try {
    const auditRef = doc(db, 'users', userId, 'savedAudits', audit.id);
    await setDoc(auditRef, {
      ...audit,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchSavedAudits(userId: string): Promise<StoredSavedAudit[]> {
  const path = `users/${userId}/savedAudits`;
  try {
    const colRef = collection(db, 'users', userId, 'savedAudits');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StoredSavedAudit);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
