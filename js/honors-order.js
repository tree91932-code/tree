(() => {
  'use strict';
  const wall = document.getElementById('honors-wall');
  if (!wall) return;
  const key = 'portfolio-honors-order-v1';
  const columns = wall.querySelector('.honors__cols');
  const groups = [...columns.children];
  const cards = [...wall.querySelectorAll('.award')];
  const savedOrder = [
  {
    "group": "national",
    "cards": [
      "honor-1",
      "honor-2",
      "honor-5",
      "honor-6"
    ]
  },
  {
    "group": "province",
    "cards": [
      "honor-12",
      "honor-8",
      "honor-7",
      "honor-9",
      "honor-10",
      "honor-11",
      "honor-3",
      "honor-4"
    ]
  },
  {
    "group": "school",
    "cards": [
      "honor-13",
      "honor-14",
      "honor-15",
      "honor-16",
      "honor-17"
    ]
  }
];

  function snapshot() {
    return [...columns.children].map(group => ({
      group: group.dataset.honorGroup,
      cards: [...group.querySelectorAll('.award')].map(card => card.id),
    }));
  }
  function refresh() {
    groups.forEach(group => {
      const siblings = [...group.querySelectorAll('.award')];
      const counter = wall.querySelector(`[data-honor-count="${group.dataset.honorGroup}"]`);
      if (counter) { counter.removeAttribute('data-count'); counter.textContent = siblings.length; }
      siblings.forEach((card, i) => {
        card.style.setProperty('--i', i);
        const medal = card.querySelector('.award__medal');
        const mark = group.dataset.honorGroup === 'national' ? '国'
          : group.dataset.honorGroup === 'province' ? '省'
          : '校';
        if (medal.textContent !== mark) medal.textContent = mark;

      });
    });
  }
  function apply(order) {
    if (!Array.isArray(order) || order.length !== groups.length) return false;
    const seen = new Set();
    const seenCards = new Set();
    for (const entry of order) {
      const group = groups.find(g => g.dataset.honorGroup === entry?.group);
      if (!group || seen.has(group) || !Array.isArray(entry.cards)) return false;
      seen.add(group);
      for (const id of entry.cards) {
        if (seenCards.has(id) || !cards.some(card => card.id === id)) return false;
        seenCards.add(id);
      }
    }
    if (seenCards.size !== cards.length) return false;
    order.forEach(entry => {
      const group = groups.find(g => g.dataset.honorGroup === entry.group);
      entry.cards.forEach(id => group.querySelector('.stagger').append(document.getElementById(id)));
      columns.append(group);
    });
    refresh();
    return true;
  }
  // Preserve the user's saved arrangement and include it in text-editor backups.
  window.HonorsOrder = {
    get: snapshot,
    import: order => {
      if (apply(order)) try { localStorage.setItem(key, JSON.stringify(snapshot())); } catch {}
    },
  };
  apply(savedOrder);
  refresh();
})();
