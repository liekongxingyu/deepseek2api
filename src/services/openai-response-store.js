const STORE_TTL_MS = 15 * 60 * 1000;
const responseStore = new Map();

function getScopedStore(scope) {
  if (!responseStore.has(scope)) {
    responseStore.set(scope, new Map());
  }

  return responseStore.get(scope);
}

function pruneExpired(store) {
  const now = Date.now();

  for (const [responseId, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(responseId);
    }
  }
}

export function storeOpenAiResponse(scope, responseId, payload) {
  const store = getScopedStore(scope);
  pruneExpired(store);
  store.set(responseId, {
    expiresAt: Date.now() + STORE_TTL_MS,
    payload
  });
}

export function getOpenAiResponse(scope, responseId) {
  const store = getScopedStore(scope);
  pruneExpired(store);
  return store.get(responseId)?.payload ?? null;
}
