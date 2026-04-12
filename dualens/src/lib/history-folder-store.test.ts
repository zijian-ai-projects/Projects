import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chooseHistoryFolder,
  formatHistoryFolderState,
  loadHistoryFolderState,
  mapPermissionState
} from "@/lib/history-folder-store";

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };

const indexedDbDescriptor = Object.getOwnPropertyDescriptor(window, "indexedDB");

function mockIndexedDbOpenFailure() {
  const error = new DOMException("blocked");
  const open = vi.fn().mockImplementation(() => {
    const request = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      error
    } as unknown as IDBOpenDBRequest;

    queueMicrotask(() => {
      request.onerror?.(new Event("error"));
    });

    return request;
  });

  Object.defineProperty(window, "indexedDB", {
    configurable: true,
    value: {
      open
    }
  });
}

describe("history-folder store helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as DirectoryPickerWindow).showDirectoryPicker;

    if (indexedDbDescriptor) {
      Object.defineProperty(window, "indexedDB", indexedDbDescriptor);
    } else {
      delete (window as Window & typeof globalThis & { indexedDB?: IDBFactory }).indexedDB;
    }
  });

  it("maps granted permission to the authorized UI state", () => {
    expect(mapPermissionState("granted")).toBe("authorized");
  });

  it("maps denied permission to the needs-permission UI state", () => {
    expect(mapPermissionState("denied")).toBe("needs-permission");
  });

  it("maps missing directory support to the unsupported UI state", () => {
    expect(formatHistoryFolderState({ supported: false })).toEqual({
      status: "unsupported",
      folderName: null
    });
  });

  it("returns the selected folder name when permission is granted", () => {
    const handle = { name: "Dualens Histories" } as FileSystemDirectoryHandle;

    expect(
      formatHistoryFolderState({
        supported: true,
        handle,
        permission: "granted"
      })
    ).toEqual({
      status: "authorized",
      folderName: "Dualens Histories",
      handle
    });
  });

  it("keeps the picked folder in memory when indexedDB save fails", async () => {
    const handle = {
      name: "Dualens Histories",
      requestPermission: vi.fn(async () => "granted")
    } as unknown as FileSystemDirectoryHandle;

    (window as DirectoryPickerWindow).showDirectoryPicker = vi.fn(async () => handle);
    mockIndexedDbOpenFailure();

    await expect(chooseHistoryFolder()).resolves.toEqual({
      status: "authorized",
      folderName: "Dualens Histories",
      handle
    });
  });

  it("surfaces storage read failures as a reauthorization state", async () => {
    (window as DirectoryPickerWindow).showDirectoryPicker = vi.fn(async () => {
      throw new Error("not used");
    });
    mockIndexedDbOpenFailure();

    await expect(loadHistoryFolderState()).resolves.toEqual({
      status: "needs-permission",
      folderName: null
    });
  });
});
