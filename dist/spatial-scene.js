(() => {
  const view = document.querySelector('.u-spatial-view');
  if (!view) return;

  // Fixed parent-relative facts. Only the camera changes during interaction.
  const elements = [
    { id: 'R', parent: null, local: [0, 0, 0] },
    { id: 'A', parent: 'R', local: [3, 1, 1], range: 4.3 },
    { id: 'B', parent: 'A', local: [2, 0, 1], range: 1.8 },
    { id: 'E-04', parent: 'B', local: [1, 0, 1] },
    { id: 'E-05', parent: 'A', local: [0, -2, .5] },
    { id: 'C', parent: 'R', local: [-3, 2, .5], range: 1.8 },
    { id: 'E-06', parent: 'C', local: [1, 0, 1] }
  ];
  const points = new Map();
  elements.forEach(item => {
    const parent = points.get(item.parent) || [0, 0, 0];
    points.set(item.id, item.local.map((v, i) => v + parent[i]));
  });

  let yaw = .5, pitch = .48, pointer = null;
  let width = 0, height = 0, scale = 1;
  let visible = false, frame = 0, previousTime = 0, resumeAt = 0;
  const center = [1.1, 1, 1];
  const NS = 'http://www.w3.org/2000/svg';
  function mark(tag, attributes, parent = view, text) {
    const element = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    parent.appendChild(element);
    return element;
  }
  const graphics = mark('g', { 'aria-hidden': 'true' });
  const paths = [];
  function path(vertices, attributes) {
    const element = mark('path', { fill: 'none', ...attributes }, graphics);
    paths.push({ element, vertices });
  }
  for (let x = -4; x <= 7; x++) {
    path([[x, -3, 0], [x, 5, 0]], { stroke: '#cbd5c9', 'stroke-width': .7, opacity: .65 });
  }
  for (let y = -3; y <= 5; y++) {
    path([[-4, y, 0], [7, y, 0]], { stroke: '#cbd5c9', 'stroke-width': .7, opacity: .65 });
  }
  const ranges = elements.filter(item => item.range).map(item => {
    const origin = points.get(item.id);
    const outline = mark('circle', {
      fill: '#246451', 'fill-opacity': .025, stroke: '#246451',
      'stroke-opacity': .2, 'stroke-width': .8, 'data-range': item.id
    }, graphics);
    for (let axis = 0; axis < 3; axis++) {
      const vertices = Array.from({ length: 65 }, (_, i) => {
        const angle = i * Math.PI / 32;
        const p = [...origin];
        p[(axis + 1) % 3] += Math.cos(angle) * item.range;
        p[(axis + 2) % 3] += Math.sin(angle) * item.range;
        return p;
      });
      path(vertices, { stroke: '#246451', 'stroke-width': .8, opacity: .3 });
    }
    return { origin, radius: item.range, outline };
  });
  elements.filter(item => item.parent).forEach(item => {
    path([points.get(item.parent), points.get(item.id)], {
      stroke: '#246451', 'stroke-width': 1.8, 'data-edge': `${item.parent}:${item.id}`
    });
  });
  const axes = [[1.4, 0, 0], [0, 1.4, 0], [0, 0, 1.4]].map((end, i) => {
    const color = ['#9b5335', '#246451', '#3f6496'][i];
    path([[0, 0, 0], end], { stroke: color, 'stroke-width': 1.4 });
    return { end, text: mark('text', { style: `fill:${color}` }, graphics, ['X', 'Y', 'Z'][i]) };
  });
  const nodes = elements.map(item => {
    const group = mark('g', {}, graphics);
    const dot = mark('circle', {
      r: item.id.startsWith('E') ? 5 : 4.5,
      fill: item.id.startsWith('E') ? '#246451' : '#f6f5ef', stroke: '#246451',
      'stroke-width': 1.8, 'data-point': item.id, 'data-position': points.get(item.id).join(',')
    }, group);
    const label = mark('text', { class: 'u-point-label' }, group, item.id);
    return { id: item.id, group, dot, label };
  });

  function project(point) {
    const [x, y, z] = point.map((v, i) => v - center[i]);
    const horizontal = Math.cos(yaw) * x - Math.sin(yaw) * y;
    const forward = Math.sin(yaw) * x + Math.cos(yaw) * y;
    return [width / 2 + horizontal * scale,
      height / 2 + (Math.sin(pitch) * forward - Math.cos(pitch) * z) * scale,
      Math.cos(pitch) * forward + Math.sin(pitch) * z];
  }
  function render() {
    paths.forEach(({ element, vertices }) => {
      element.setAttribute('d', vertices.map((p, i) => {
        const [x, y] = project(p);
        return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' '));
    });
    ranges.forEach(({ origin, radius, outline }) => {
      const [x, y] = project(origin);
      outline.setAttribute('cx', x); outline.setAttribute('cy', y); outline.setAttribute('r', radius * scale);
    });
    axes.forEach(({ end, text }) => {
      const [x, y] = project(end);
      text.setAttribute('x', x + 4); text.setAttribute('y', y + 5);
    });
    const projected = nodes.map(node => ({ ...node, p: project(points.get(node.id)) }));
    const labels = [];
    projected.sort((a, b) => a.p[2] - b.p[2]).forEach(({ id, group, dot, label, p: [x, y] }) => {
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      const textWidth = id.length * 8 + 4;
      const candidates = [[10, -12], [10, 23], [-textWidth - 10, -12], [-textWidth - 10, 23], [10, -28], [10, 39]];
      const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const scored = candidates.map(([dx, dy]) => {
        const box = { x: x + dx, y: y + dy - 13, w: textWidth, h: 18 };
        let score = labels.filter(b => overlap(box, b)).length * 10;
        score += projected.filter(n => overlap(box, { x: n.p[0] - 7, y: n.p[1] - 7, w: 14, h: 14 })).length * 10;
        if (box.x < 8 || box.x + box.w > width - 8 || box.y < 8 || box.y + box.h > height - 8) score += 100;
        return { box, score };
      }).sort((a, b) => a.score - b.score);
      const box = scored[0].box;
      label.setAttribute('x', box.x); label.setAttribute('y', box.y + 13);
      labels.push(box);
      graphics.appendChild(group);
    });
  }
  function resize() {
    width = Math.max(1, view.clientWidth); height = Math.max(1, view.clientHeight);
    scale = Math.max(1, Math.min((width - 66) / 13.4, (height - 60) / 13.4));
    view.setAttribute('viewBox', `0 0 ${width} ${height}`);
    render();
  }
  function animate(time) {
    frame = 0;
    if (!visible || document.hidden || pointer) { previousTime = 0; return; }
    if (previousTime && time >= resumeAt) {
      yaw = (yaw + Math.min(time - previousTime, 50) * .00013) % (Math.PI * 2);
      render();
    }
    previousTime = time;
    frame = requestAnimationFrame(animate);
  }
  function schedule() {
    if (!frame && visible && !document.hidden && !pointer) frame = requestAnimationFrame(animate);
  }
  function stopFrame() {
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
  }
  // Pointer deltas and arrow keys use the same camera-control convention.
  function turnView(horizontal, vertical) {
    yaw += horizontal;
    pitch = Math.max(-1.2, Math.min(1.2, pitch - vertical));
    render();
  }
  view.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || pointer) return;
    // Dragging needs pointer capture, not programmatic or native click focus.
    event.preventDefault();
    view.classList.toggle('is-pointer-focused', document.activeElement === view);
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    view.setPointerCapture(event.pointerId); view.classList.add('is-dragging');
    stopFrame();
  });
  view.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    turnView((event.clientX - pointer.x) * .007, (event.clientY - pointer.y) * .006);
    pointer.x = event.clientX; pointer.y = event.clientY;
  });
  function endDrag(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const id = pointer.id; pointer = null;
    if (view.hasPointerCapture(id)) view.releasePointerCapture(id);
    view.classList.remove('is-dragging'); resumeAt = performance.now() + 1600;
    schedule();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => view.addEventListener(name, endDrag));
  view.addEventListener('blur', () => view.classList.remove('is-pointer-focused'));
  view.addEventListener('keydown', event => {
    view.classList.remove('is-pointer-focused');
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') turnView(-.12, 0);
    if (event.key === 'ArrowRight') turnView(.12, 0);
    if (event.key === 'ArrowUp') turnView(0, -.1);
    if (event.key === 'ArrowDown') turnView(0, .1);
    resumeAt = performance.now() + 1600;
  });
  document.addEventListener('visibilitychange', () => { stopFrame(); schedule(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; stopFrame(); schedule();
  }).observe(view);
  new ResizeObserver(resize).observe(view);
  resize();
})();
