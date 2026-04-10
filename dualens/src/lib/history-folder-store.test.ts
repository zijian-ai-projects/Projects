import { describe, expect, it } from "vitest";
import {
  formatHistoryFolderState,
  mapPermissionState
} from "@/lib/history-folder-store";

describe("history-folder store helpers", () => {
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
});
