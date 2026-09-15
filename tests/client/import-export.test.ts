import { db } from "../../src/client/db/database";
import {
  collectionRepository,
  environmentRepository,
  requestRepository,
} from "../../src/client/db/repositories";
import { exportWorkspace, importWorkspace } from "../../src/client/db/seed";
import {
  createCollectionInput,
  createRequestInput,
} from "../fixtures/requests";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

it("round-trips workspace data through export and import", async () => {
  const collection = await collectionRepository.create(
    createCollectionInput({ name: "Export Me" }),
  );
  await requestRepository.create(
    createRequestInput(collection.id, { name: "Ping" }),
  );
  await environmentRepository.create({
    collectionId: collection.id,
    name: "Staging",
    isActive: true,
  });

  const exported = await exportWorkspace();
  expect(exported.version).toBe(1);
  expect(exported.collections).toHaveLength(1);

  await Promise.all(db.tables.map((table) => table.clear()));
  await importWorkspace(exported);

  const collections = await collectionRepository.list();
  expect(collections).toHaveLength(1);
  expect(collections[0].name).toBe("Export Me");
  expect(await requestRepository.listByCollection(collection.id)).toHaveLength(1);
  expect(
    await environmentRepository.listByCollection(collection.id),
  ).toHaveLength(1);
});

it("rejects an unknown workspace version", async () => {
  await expect(
    importWorkspace({
      version: 2,
      collections: [],
      folders: [],
      requests: [],
      environments: [],
    }),
  ).rejects.toThrow("Unsupported workspace version");
});

it("rejects malformed records without writing any data", async () => {
  const collection = await collectionRepository.create(createCollectionInput());

  await expect(
    importWorkspace({
      version: 1,
      collections: [{ name: "Missing id" }],
      folders: [],
      requests: [],
      environments: [],
    }),
  ).rejects.toThrow("Malformed workspace data");

  const collections = await collectionRepository.list();
  expect(collections).toHaveLength(1);
  expect(collections[0].id).toBe(collection.id);
});
