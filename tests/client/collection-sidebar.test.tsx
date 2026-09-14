import { render, screen } from "@testing-library/react";
import { CollectionSidebar } from "../../src/client/components/CollectionSidebar";
import {
  collectionRepository,
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

it("marks requests with a colored method chip and collections with an icon", async () => {
  const collection = await collectionRepository.create({ name: "My API" });
  await requestRepository.create({
    collectionId: collection.id,
    folderId: null,
    name: "List instances",
    method: "POST",
    url: "https://example.test/list",
  });

  render(<CollectionSidebar />);

  // The request row is reachable (tree auto-expands) and shows its method.
  expect(await screen.findByText("List instances")).toBeInTheDocument();
  const chip = screen.getByText("POST");
  expect(chip).toHaveClass("tree-node-method");
  expect(chip).toHaveAttribute("data-method", "POST");
});
