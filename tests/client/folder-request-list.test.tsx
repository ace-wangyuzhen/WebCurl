import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderRequestList } from "../../src/client/components/FolderRequestList";
import {
  collectionRepository,
  folderRepository,
  requestRepository,
} from "../../src/client/db/repositories";
import { db } from "../../src/client/db/database";
import { useEditorStore } from "../../src/client/state/editor-store";

beforeEach(async () => {
  useEditorStore.getState().clearSelection();
  await db.requests.clear();
  await db.folders.clear();
  await db.collections.clear();
});

it("lists the folder's requests and opens one on click", async () => {
  const collection = await collectionRepository.create({ name: "API" });
  const folder = await folderRepository.create({
    collectionId: collection.id,
    name: "Instances",
  });
  const inFolder = await requestRepository.create({
    collectionId: collection.id,
    folderId: folder.id,
    name: "List instances",
    method: "GET",
    url: "https://example.test/list",
  });
  await requestRepository.create({
    collectionId: collection.id,
    folderId: null,
    name: "Root request",
    method: "POST",
    url: "https://example.test/root",
  });

  render(
    <FolderRequestList collectionId={collection.id} folderId={folder.id} />,
  );

  expect(await screen.findByText("List instances")).toBeInTheDocument();
  expect(screen.queryByText("Root request")).not.toBeInTheDocument();
  expect(screen.getByText("GET")).toHaveClass("folder-request-method");

  await userEvent.click(screen.getByText("List instances"));
  expect(useEditorStore.getState().selectedRequestId).toBe(inFolder.id);
});

it("shows an empty state when the folder has no requests", async () => {
  const collection = await collectionRepository.create({ name: "API" });
  const folder = await folderRepository.create({
    collectionId: collection.id,
    name: "Empty",
  });

  render(
    <FolderRequestList collectionId={collection.id} folderId={folder.id} />,
  );

  expect(await screen.findByText(/no requests yet/i)).toBeInTheDocument();
});
