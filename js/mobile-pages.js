(() => {
  'use strict';
  const media = matchMedia('(max-width: 900px)');
  const sections = [...document.querySelectorAll('main.content > .hero, main.content > .sec')];
  const names = ['首页', '关于我', '荣誉奖项', '实习经历', '项目经历', '我的作品', '设计美工', '联系我'];
  const about = document.getElementById('about');
  const nestedSections = ['honors', 'contact'].map(id => {
    const section = document.getElementById(id);
    const anchor = document.createComment('Original section position: ' + id);
    section.before(anchor);
    return {section, anchor};
  });
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.setAttribute('aria-label', '栏目目录');
  nav.innerHTML = sections.map((section, i) => ['hero', 'honors', 'contact'].includes(section.id) ? '' : `<button type="button" data-page="${section.id}" aria-controls="${section.id}">${names[i]}</button>`).join('');
  document.querySelector('.topbar').after(nav);
  let current = 'hero';
  const groups = [];

  function group(sectionId, items) {
    const section = document.getElementById(sectionId);
    const bar = document.createElement('nav');
    bar.className = 'mobile-subnav';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', names[sections.indexOf(section)] + '分类');
    const entries = items.map(([label, selector]) => ({label, elements: [...(['#honors', '#contact'].includes(selector) ? document : section).querySelectorAll(selector)]}));
    const state = {sectionId, entries, index: 0};
    function choose(index) {
      state.index = index;
      entries.forEach((entry, i) => {
        entry.elements.forEach(el => el.classList.toggle('mobile-sub-active', i === index));
        bar.children[i].setAttribute('aria-pressed', String(i === index));
      });
      if (media.matches) window.scrollTo({top: 0, behavior: 'instant'});
    }
    entries.forEach((entry, i) => {
      entry.elements.forEach(el => el.classList.add('mobile-subpanel'));
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.label;
      button.addEventListener('click', () => choose(i));
      bar.append(button);
    });
    section.querySelector('.sec-head').after(bar);
    state.choose = choose;
    groups.push(state);
    choose(0);
  }

  group('about', [['个人档案', '.profile'], ['能力', '.ticket'], ['课程', '.transcript'], ['荣誉奖项', '#honors'], ['联系我', '#contact']]);
  group('honors', [['国家级', '#honor-group-national'], ['省级 / 行业', '#honor-group-province'], ['校级 / 证书', '#honor-group-school']]);
  group('experience', [['腾讯区域发展部', '#job-tencent'], ['蓝色光标', '#job-bluefocus']]);
  group('works', [['AI 短剧', '#row-drama'], ['AI 创意短片', '#row-ai'], ['剪辑 / 广告', '#row-edit']]);
  group('design', [['策划案', '.projector'], ['海报 / 平面', '.pins']]);

  function paginate(container, selector, size = 4) {
    const items = [...container.querySelectorAll(selector)];
    if (items.length <= size) return;
    let page = 0;
    const total = Math.ceil(items.length / size);
    const controls = document.createElement('div');
    controls.className = 'mobile-pagination';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '← 上一页';
    const status = document.createElement('span');
    status.setAttribute('aria-live', 'polite');
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '下一页 →';
    controls.append(previous, status, next);
    container.append(controls);
    function render() {
      items.forEach((item, i) => item.classList.toggle('mobile-item-hidden', Math.floor(i / size) !== page));
      previous.disabled = page === 0;
      next.disabled = page === total - 1;
      status.textContent = `${page + 1} / ${total}`;
    }
    function step(delta) {
      page += delta;
      render();
      window.scrollTo({top: 0, behavior: 'instant'});
    }
    previous.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    render();
  }
  document.querySelectorAll('.work-row').forEach(row => paginate(row, '.vcard'));
  document.querySelectorAll('.honors__col').forEach(column => {
    if (column.dataset.honorGroup === 'national') paginate(column, '.award');
  });
  paginate(document.querySelector('#design .pins'), '.pin-card');

  function sectionFor(hash) {
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.replace(/^#/, ''))); } catch { return null; }
    if (!target || target.id === 'top') return {section: document.getElementById('hero'), target: null};
    const section = target.closest('.hero, .sec');
    return section ? {section, target} : null;
  }

  function show(id, target = null, updateHash = false) {
    if (!sections.some(section => section.id === id)) return;
    const destinationId = id;
    if (['honors', 'contact'].includes(id)) {
      target ||= document.getElementById(id);
      id = 'about';
    }
    current = id;
    sections.forEach(section => section.classList.toggle('is-mobile-active', section.id === id));
    [...nav.children].forEach(button => {
      const selected = button.dataset.page === id;
      button.setAttribute('aria-current', selected ? 'page' : 'false');
    });
    if (target) {
      groups.filter(state => state.sectionId === id || document.getElementById(state.sectionId).contains(target)).forEach(state => {
        const index = state.entries.findIndex(entry => entry.elements.some(el => el === target || el.contains(target)));
        if (index >= 0) state.choose(index);
      });
    }
    if (media.matches) {
      document.querySelectorAll('.content video').forEach(video => {
        if (!video.closest('.is-mobile-active') || video.closest('.mobile-subpanel:not(.mobile-sub-active)')) video.pause();
      });
      if (updateHash) history.replaceState(null, '', '#' + destinationId);
      window.scrollTo({top: 0, behavior: 'instant'});
    }
  }

  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button) show(button.dataset.page, null, true);
  });
  // Show the destination before the existing project/video navigation runs.
  document.addEventListener('click', event => {
    if (!media.matches) return;
    const row = event.target.closest('[data-row-link]');
    const caseButton = event.target.closest('#idxSub button');
    const link = event.target.closest('a[href^="#"]');
    const hash = row ? '#row-' + row.dataset.rowLink : caseButton ? '#projects' : link?.getAttribute('href');
    if (!hash) return;
    const destination = sectionFor(hash);
    if (!destination) return;
    show(destination.section.id, destination.target);
    requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'}));
  }, true);
  addEventListener('hashchange', () => {
    if (!media.matches) return;
    const destination = sectionFor(location.hash);
    if (destination) show(destination.section.id, destination.target);
  });
  function sync() {
    document.body.classList.toggle('mobile-pages', media.matches);
    nestedSections.forEach(({section, anchor}) => {
      if (media.matches) about.append(section);
      else anchor.after(section);
    });
    nav.inert = document.body.classList.contains('is-intro') || document.body.classList.contains('is-locked');
    if (media.matches) {
      const destination = sectionFor(location.hash);
      show(destination?.section.id || current, destination?.target);
    }
  }
  media.addEventListener('change', sync);
  sync();
  addEventListener('load', () => {
    if (media.matches) requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'}));
  }, {once: true});
})();
