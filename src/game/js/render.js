import { UI_CONST, ENEMY, SHAKE } from './config.js';

export function computeMapViewport(canvasW, canvasH, mapW, mapH) {
  const availableWidth = canvasW;
  const availableHeight = Math.max(200, canvasH - UI_CONST.BOTTOM - UI_CONST.TOP);
  const baseScale = Math.min(availableWidth / mapW, availableHeight / mapH);
  const scale = baseScale * UI_CONST.MAP_ZOOM;
  const drawWidth = mapW * scale;
  const drawHeight = mapH * scale;
  const offsetX = (canvasW - drawWidth) / 2;
  const offsetY = UI_CONST.TOP + (availableHeight - drawHeight) / 2;
  return {
    ox: offsetX,
    oy: offsetY,
    dw: drawWidth,
    dh: drawHeight,
    scale,
  };
}

export function drawStarfish(ctx, cx, cy, radius) {
  const points = 5;
  const inner = radius * 0.45;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.2)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? radius : inner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = '#d26f45';
  ctx.strokeStyle = '#8c3f28';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawEnemies(ctx, enemies, bounds, sprites) {
  const { ox, oy, dw, dh } = bounds;
  const { crowImg, jellyImg } = sprites;
  const size = 42;
  const now = performance.now();

  enemies.forEach((enemy) => {
    const x = ox + enemy.x * dw;
    const y = oy + enemy.y * dh;
    ctx.save();
    if (enemy.state === 'flee') {
      const remain = Math.max(0, (enemy.fleeUntil - now) / 700);
      ctx.globalAlpha = Math.max(0.12, Math.min(1, remain));
    }
    if (enemy.type === ENEMY.JELLY) {
      if (jellyImg.complete && jellyImg.naturalWidth) {
        ctx.drawImage(jellyImg, x - size / 2, y - size / 2, size, size);
      } else {
        ctx.fillStyle = 'rgba(123,200,255,0.85)';
        ctx.beginPath();
        ctx.arc(x, y, 18, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 18, y, 36, 8);
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x - 14 + i * 7, y + 8);
          ctx.quadraticCurveTo(x - 14 + i * 7, y + 22 + (i % 2 ? 6 : -4), x - 14 + i * 7, y + 32);
          ctx.strokeStyle = 'rgba(80,150,220,0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    } else {
      const angle = Math.atan2(enemy.vy, enemy.vx);
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (crowImg.complete && crowImg.naturalWidth) {
        ctx.drawImage(crowImg, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#242424';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(10, -8);
        ctx.lineTo(10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-6, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd400';
        ctx.fillRect(10, -2, 6, 4);
      }
    }
    ctx.restore();
  });
}

export function drawBonuses(ctx, bonuses, bounds, images) {
  const { ox, oy, dw, dh } = bounds;
  const { imgPasticciotto, imgRustico, imgCaffe } = images;

  bonuses.forEach((bonus) => {
    const x = ox + bonus.x * dw;
    const y = oy + bonus.y * dh;
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - bonus.age / bonus.life);
    let sprite = null;
    if (bonus.type === 'pasticciotto') {
      sprite = imgPasticciotto;
    } else if (bonus.type === 'rustico') {
      sprite = imgRustico;
    } else if (bonus.type === 'caffe') {
      sprite = imgCaffe;
    }
    if (sprite && sprite.complete && sprite.naturalWidth) {
      const size = 42;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = '#ffe06b';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

export function renderWin(ctx, view, sprites, fx) {
  const { ox, oy, dw, dh } = view;
  const { birdImg, spiderImg } = sprites;
  const cx = ox + dw / 2;
  const cy = oy + dh / 2;
  const t = fx.t;
  const base = Math.min(dw, dh) * 0.36;
  const scale = 0.9 + 0.08 * Math.sin(t * 4);
  const rotation = 0.08 * Math.sin(t * 3.2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  const width = base * scale;
  if (birdImg.complete && birdImg.naturalWidth) {
    ctx.drawImage(birdImg, -width - 14, -width, width, width);
  } else {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-width * 0.5 - 10, 0, width * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  if (spiderImg.complete && spiderImg.naturalWidth) {
    ctx.drawImage(spiderImg, 14, -width, width, width);
  } else {
    ctx.fillStyle = '#b04123';
    ctx.beginPath();
    ctx.arc(width * 0.5 + 10, 0, width * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  fx.fireworks.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.initialLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function spawnFirework(store) {
  const colors = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b'];
  const width = window.innerWidth || 800;
  const height = window.innerHeight || 600;
  const cx = (Math.random() * 0.5 + 0.25) * width;
  const cy = (Math.random() * 0.4 + 0.20) * height;
  const count = 36 + Math.floor(Math.random() * 24);
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 90 + Math.random() * 160;
    store.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 2,
      color,
      life: 0.9 + Math.random() * 0.8,
      initialLife: 1.7,
    });
  }
}

export function applyShake({ mode, hitShake }) {
  if (mode !== 'play' || hitShake <= 0) {
    return { x: 0, y: 0 };
  }
  const alpha = Math.min(1, hitShake / SHAKE.MAX_S);
  const magnitude = 6 * alpha;
  return {
    x: (Math.random() * 2 - 1) * magnitude,
    y: (Math.random() * 2 - 1) * magnitude,
  };
}
