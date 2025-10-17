// Persistent cart shim - prevents 404s while legacy references are phased out.
// This file intentionally does not implement functionality yet.
if (!window.WTFPersistentCart) {
  window.WTFPersistentCart = {
    hydrate() {
      return Promise.resolve(null);
    }
  };
}
