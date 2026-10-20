/* Shared LSAT classification vocabulary; question-specific notes stay on each problem. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.HabitLSATTaxonomy = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const norm = value => String(value == null ? '' : value).trim();
  const same = (a, b) => norm(a).toLocaleLowerCase() === norm(b).toLocaleLowerCase();
  function ensure(store, index, title) {
    if (!Number.isInteger(index) || index < 0 || index > 4) return '';
    const name = norm(title);
    if (!name) return '';
    if (!Array.isArray(store.subheadings)) store.subheadings = [[], [], [], [], []];
    if (!Array.isArray(store.subheadings[index])) store.subheadings[index] = [];
    const existing = store.subheadings[index].find(entry => same(entry, name));
    if (existing) return existing;
    store.subheadings[index].push(name);
    return name;
  }
  function init(store) {
    if (!Array.isArray(store.subheadings)) store.subheadings = [[], [], [], [], []];
    store.subheadings = Array.from({ length: 5 }, (_, index) => {
      const original = Array.isArray(store.subheadings[index]) ? store.subheadings[index] : [];
      const result = [];
      for (const entry of original) {
        const name = norm(entry);
        if (name && !result.some(v => same(v, name))) result.push(name);
      }
      return result;
    });
    for (const q of store.problems || []) {
      if (!Array.isArray(q.categories)) q.categories = [[], [], [], [], []];
      for (let i = 0; i < 5; i++) {
        if (!Array.isArray(q.categories[i])) q.categories[i] = [];
        for (const sub of q.categories[i]) {
          if (sub && typeof sub.title === 'string') ensure(store, i, sub.title);
        }
      }
    }
    return store;
  }
  function attach(store, question, index, title, idFactory) {
    const canonical = ensure(store, index, title);
    if (!canonical || !question) return null;
    if (!Array.isArray(question.categories)) question.categories = [[], [], [], [], []];
    if (!Array.isArray(question.categories[index])) question.categories[index] = [];
    const existing = question.categories[index].find(sub => same(sub.title, canonical));
    if (existing) return existing;
    const sub = { id: idFactory(), title: canonical, notes: '' };
    question.categories[index].push(sub);
    return sub;
  }
  function detach(question, index, id) {
    if (!Array.isArray(question?.categories?.[index])) return false;
    const old = question.categories[index].length;
    question.categories[index] = question.categories[index].filter(sub => sub.id !== id);
    return question.categories[index].length !== old;
  }
  function rename(store, index, oldTitle, newTitle) {
    init(store);
    const prior = store.subheadings[index]?.find(title => same(title, oldTitle));
    const desired = norm(newTitle);
    if (!prior || !desired) return false;
    if (store.subheadings[index].some(title => same(title, desired) && !same(title, prior))) return false;
    store.subheadings[index] = store.subheadings[index].map(title => same(title, prior) ? desired : title);
    for (const question of store.problems || []) {
      for (const sub of question.categories?.[index] || []) {
        if (same(sub.title, prior)) sub.title = desired;
      }
    }
    return true;
  }
  return { init, ensure, attach, detach, rename };
});
