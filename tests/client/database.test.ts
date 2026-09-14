import { db } from "../../src/client/db/database";
import {
  collectionRepository,
  environmentRepository,
  folderRepository,
  historyRepository,
  requestRepository,
} from "../../src/client/db/repositories";
import {
  createCollectionInput,
  createFolderInput,
  createRequestInput,
} from "../fixtures/requests";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

it("persists and reloads a request workspace", async () => {
  const collection = await collectionRepository.create(createCollectionInput());
  const request = await requestRepository.create(
    createRequestInput(collection.id),
  );

  expect(await requestRepository.get(request.id)).toMatchObject({
    name: "Health",
    method: "GET",
  });
});

it("lists folders and requests scoped to a collection", async () => {
  const collectionA = await collectionRepository.create(
    createCollectionInput({ name: "A" }),
  );
  const collectionB = await collectionRepository.create(
    createCollectionInput({ name: "B" }),
  );

  await folderRepository.create(
    createFolderInput(collectionA.id, { name: "Folder A" }),
  );
  await folderRepository.create(
    createFolderInput(collectionB.id, { name: "Folder B" }),
  );
  await requestRepository.create(
    createRequestInput(collectionA.id, { name: "Request A" }),
  );
  await requestRepository.create(
    createRequestInput(collectionB.id, { name: "Request B" }),
  );

  const foldersA = await folderRepository.listByCollection(collectionA.id);
  const requestsA = await requestRepository.listByCollection(collectionA.id);

  expect(foldersA).toHaveLength(1);
  expect(foldersA[0].name).toBe("Folder A");
  expect(requestsA).toHaveLength(1);
  expect(requestsA[0].name).toBe("Request A");
});

it("updates and removes records", async () => {
  const collection = await collectionRepository.create(createCollectionInput());
  const request = await requestRepository.create(
    createRequestInput(collection.id),
  );

  await requestRepository.update(request.id, { name: "Renamed" });
  expect((await requestRepository.get(request.id))?.name).toBe("Renamed");

  await requestRepository.remove(request.id);
  expect(await requestRepository.get(request.id)).toBeUndefined();
});

it("tracks a single active environment per collection", async () => {
  const first = await environmentRepository.create({
    collectionId: "c1",
    name: "Dev",
  });
  const second = await environmentRepository.create({
    collectionId: "c1",
    name: "Prod",
  });

  await environmentRepository.setActive("c1", first.id);
  expect((await environmentRepository.get(first.id))?.isActive).toBe(true);
  expect((await environmentRepository.get(second.id))?.isActive).toBe(false);

  await environmentRepository.setActive("c1", second.id);
  expect((await environmentRepository.get(first.id))?.isActive).toBe(false);
  expect((await environmentRepository.get(second.id))?.isActive).toBe(true);
});

it("stores and bounds history records", async () => {
  const request = {
    method: "GET",
    url: "https://example.test/health",
    query: [],
    headers: [],
    body: { type: "none" as const, content: "" },
  };
  const response = {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: [],
    body: "ok",
    durationMs: 1,
    sizeBytes: 2,
  };

  await historyRepository.add({
    requestId: null,
    requestSnapshot: request,
    responseSnapshot: response,
  });
  await historyRepository.add({
    requestId: null,
    requestSnapshot: request,
    responseSnapshot: response,
  });
  await historyRepository.add({
    requestId: null,
    requestSnapshot: request,
    responseSnapshot: response,
  });

  expect(await historyRepository.list(2)).toHaveLength(2);

  await historyRepository.clear();
  expect(await historyRepository.list(10)).toHaveLength(0);
});
