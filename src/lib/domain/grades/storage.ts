import type { GradebookDocument } from './types';

const DB_NAME = 'ims-academic-tools';
const DB_VERSION = 1;
const STORE = 'gradebooks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open gradebook storage.'));
  });
}

export async function listGradebooks(): Promise<GradebookDocument[]> {
  if (typeof indexedDB === 'undefined') return [];
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).getAll();

    request.onsuccess = () => {
      const values = (request.result ?? []) as GradebookDocument[];
      resolve(values.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    };
    request.onerror = () => reject(request.error ?? new Error('Could not load gradebooks.'));
    transaction.oncomplete = () => database.close();
  });
}

export async function saveGradebook(gradebook: GradebookDocument) {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(gradebook);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save gradebook.'));
  });

  database.close();
}

export async function deleteGradebook(id: string) {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete gradebook.'));
  });

  database.close();
}

export function createBlankGradebook(name = 'Untitled course'): GradebookDocument {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name,
    categories: [
      {
        id: crypto.randomUUID(),
        name: 'Long Exams',
        weight: 50,
        mode: 'points',
        assessments: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Quizzes / Exercises',
        weight: 20,
        mode: 'points',
        assessments: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Final Exam',
        weight: 30,
        mode: 'points',
        assessments: []
      }
    ],
    gradingScale: [],
    updatedAt: new Date().toISOString()
  };
}

export function isGradebookDocument(value: unknown): value is GradebookDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<GradebookDocument>;
  return (
    record.version === 1 &&
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    Array.isArray(record.categories) &&
    Array.isArray(record.gradingScale)
  );
}
