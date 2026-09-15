import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CollectionFolderEditor } from "../../src/client/components/CollectionFolderEditor";
import { db } from "../../src/client/db/database";
import {
  collectionRepository,
  folderRepository,
} from "../../src/client/db/repositories";
import { useEditorStore } from "../../src/client/state/editor-store";

// `message.success` renders a transient toast outside React's test act scope;
// stub it so the save tests stay warning-free.
vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  useEditorStore.getState().clearSelection();
});

it("saves the collection pre-request script", async () => {
  const collection = await collectionRepository.create({ name: "C1" });
  useEditorStore.getState().selectCollection({
    collectionId: collection.id,
    name: collection.name,
    preRequestScript: "console.log('c')",
  });

  render(<CollectionFolderEditor />);
  await userEvent.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(async () => {
    const saved = await collectionRepository.get(collection.id);
    expect(saved?.preRequestScript).toBe("console.log('c')");
  });
});

it("saves the folder pre-request script", async () => {
  const collection = await collectionRepository.create({ name: "C1" });
  const folder = await folderRepository.create({
    collectionId: collection.id,
    name: "F1",
  });
  useEditorStore.getState().selectFolder({
    collectionId: collection.id,
    folderId: folder.id,
    name: folder.name,
    preRequestScript: "console.log('f')",
  });

  render(<CollectionFolderEditor />);
  await userEvent.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(async () => {
    const saved = await folderRepository.get(folder.id);
    expect(saved?.preRequestScript).toBe("console.log('f')");
  });
});
