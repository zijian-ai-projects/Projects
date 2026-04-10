export type HistoryFolderStatus =
  | "unselected"
  | "authorized"
  | "needs-permission"
  | "unsupported";

export type HistoryFolderState = {
  status: HistoryFolderStatus;
  folderName: string | null;
  handle?: FileSystemDirectoryHandle;
};

type HistoryFolderSnapshot = {
  supported: boolean;
  handle?: FileSystemDirectoryHandle | null;
  permission?: PermissionState | "prompt";
};

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: {
      mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
  };

const DB_NAME = "dualens-history";
const STORE_NAME = "settings";
const HANDLE_KEY = "history-folder-handle";

export function mapPermissionState(
  state: PermissionState | "prompt" | "unsupported"
): HistoryFolderStatus {
  if (state === "granted") {
    return "authorized";
  }

  if (state === "prompt" || state === "denied") {
    return "needs-permission";
  }

  return "unsupported";
}

export function formatHistoryFolderState({
  supported,
  handle,
  permission
}: HistoryFolderSnapshot): HistoryFolderState {
  if (!supported) {
    return {
      status: "unsupported",
      folderName: null
    };
  }

  if (!handle) {
    return {
      status: "unselected",
      folderName: null
    };
  }

  return {
    status: permission === "granted" ? "authorized" : "needs-permission",
    folderName: handle.name,
    handle
  };
}

function supportsHistoryFolderAccess() {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function"
  );
}

async function openHistoryDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSavedHandleFromIndexedDb() {
  const db = await openHistoryDb();

  return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(HANDLE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function saveHandleToIndexedDb(handle: FileSystemDirectoryHandle) {
  const db = await openHistoryDb();

  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(handle, HANDLE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function loadHistoryFolderState(): Promise<HistoryFolderState> {
  if (!supportsHistoryFolderAccess()) {
    return formatHistoryFolderState({ supported: false });
  }

  const handle = await readSavedHandleFromIndexedDb();

  if (!handle) {
    return formatHistoryFolderState({
      supported: true,
      handle: null
    });
  }

  const permission = await handle.queryPermission({ mode: "readwrite" });

  return formatHistoryFolderState({
    supported: true,
    handle,
    permission
  });
}

export async function chooseHistoryFolder(): Promise<HistoryFolderState> {
  if (!supportsHistoryFolderAccess()) {
    return formatHistoryFolderState({ supported: false });
  }

  const handle = await (window as DirectoryPickerWindow).showDirectoryPicker?.({
    mode: "readwrite"
  });

  if (!handle) {
    return formatHistoryFolderState({
      supported: true,
      handle: null
    });
  }

  const permission = await handle.requestPermission({ mode: "readwrite" });
  await saveHandleToIndexedDb(handle);

  return formatHistoryFolderState({
    supported: true,
    handle,
    permission
  });
}
