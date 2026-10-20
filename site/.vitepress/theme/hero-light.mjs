/** 灯芯在桌面背景原图中的坐标；移动版由同一原图裁切生成。 */
const LANTERN = { x: 1624, y: 657 };
/** 灯笼在水中的反光中心，独立于灯芯按原图标定。 */
const REFLECTION = { x: 1640, y: 867 };

/**
 * 将桌面原图坐标换算到当前背景资源的像素空间。
 * @param {{x: number, y: number}} point 桌面原图中的位置。
 * @param {boolean} mobile 是否使用移动版背景。
 * @return {{x: number, y: number}} 当前图片中的位置。
 */
function sourcePoint(point, mobile) {
  if (!mobile) return { ...point };
  return {
    x: (((point.x * 2880) / 2160 - 1650) * 720) / 930,
    y: (((point.y * 1440) / 1080) * 1115) / 1440,
  };
}

/**
 * 获取当前背景资源中的灯芯位置。
 * @param {boolean} mobile 是否使用移动版背景。
 * @return {{x: number, y: number}} 当前图片中的灯芯坐标。
 */
export function lanternPoint(mobile) {
  return sourcePoint(LANTERN, mobile);
}

/**
 * 按 object-fit: cover 和 object-position 将图片坐标映射到容器。
 * @param {object} options 原图、容器尺寸、对齐比例与原图坐标。
 * @param {number} options.imageWidth 原图宽度。
 * @param {number} options.imageHeight 原图高度。
 * @param {number} options.viewportWidth 容器宽度。
 * @param {number} options.viewportHeight 容器高度。
 * @param {number} options.positionX 横向对齐比例。
 * @param {number} options.positionY 纵向对齐比例。
 * @param {number} options.pointX 原图中的横坐标。
 * @param {number} options.pointY 原图中的纵坐标。
 * @return {{x: number, y: number, scale: number}|undefined} 显示坐标及缩放系数。
 */
export function imagePointToViewport({
  imageWidth,
  imageHeight,
  viewportWidth,
  viewportHeight,
  positionX,
  positionY,
  pointX,
  pointY,
}) {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return undefined;
  }
  const scale = Math.max(
    viewportWidth / imageWidth,
    viewportHeight / imageHeight
  );
  return {
    x:
      pointX * scale +
      (viewportWidth - imageWidth * scale) * positionX,
    y:
      pointY * scale +
      (viewportHeight - imageHeight * scale) * positionY,
    scale,
  };
}

/**
 * 使用同一呼吸周期绘制灯笼和水面倒影，分别按可见性停止绘制。
 * @param {HTMLCanvasElement} canvas 装饰画布。
 * @param {HTMLImageElement} image 使用 cover 显示的背景图。
 * @param {HTMLElement} hero 首页背景容器。
 * @param {HTMLCanvasElement} reflectionCanvas 水面反光画布。
 * @return {() => void} 释放观察器、事件监听和动画循环。
 */
export function mountLanternEffect(canvas, image, hero, reflectionCanvas) {
  const context = canvas.getContext('2d');
  const water = reflectionCanvas.getContext('2d');
  if (!context || !water) return () => {};
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 767px)');
  // 固定粒子参数，帧间只更新位置和亮度，避免持续分配对象。
  const particles = Array.from({ length: 12 }, (_, i) => ({
    phase: i * 2.39996,
    orbit: 8 + (i % 4) * 5,
    size: 0.65 + (i % 3) * 0.28,
    speed: 0.3 + (i % 5) * 0.065,
  }));
  let unit = 1;
  let size = 160;
  let reflectionWidth = 128;
  let reflectionHeight = 112;
  let frame = 0;
  let lastDraw = 0;
  let elapsed = 0;
  let lastTime = 0;
  let inView = false;
  let reflectionInView = false;
  let positioned = false;
  let reflectionPositioned = false;
  let disposed = false;

  /**
   * 在有限面积内绘制，不影响文本或按钮的点击区域。
   * @param {number} time 动画经过的秒数。
   * @param {number} breath 当前呼吸周期的亮度比例。
   */
  function drawLantern(time, breath) {
    const center = size / 2;
    context.clearRect(0, 0, size, size);
    // 原图已包含亮灯，低谷时局部压暗才能看出完整的明暗周期。
    const dim = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      42 * unit
    );
    dim.addColorStop(0, `rgba(35, 25, 12, ${0.55 * (1 - breath)})`);
    dim.addColorStop(
      0.35,
      `rgba(35, 25, 12, ${0.32 * (1 - breath)})`
    );
    dim.addColorStop(1, 'rgba(35, 25, 12, 0)');
    context.fillStyle = dim;
    context.fillRect(0, 0, size, size);
    const glow = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      (44 + 28 * breath) * unit
    );
    glow.addColorStop(
      0,
      `rgba(255, 226, 143, ${0.06 + 0.44 * breath})`
    );
    glow.addColorStop(
      0.25,
      `rgba(255, 205, 104, ${0.025 + 0.25 * breath})`
    );
    glow.addColorStop(0.65, `rgba(255, 195, 90, ${0.07 * breath})`);
    glow.addColorStop(1, 'rgba(255, 195, 90, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, size, size);
    context.save();
    context.translate(center, center);
    context.scale(unit, unit);
    context.save();
    context.scale(1, 1.8);
    const core = context.createRadialGradient(0, 0, 0, 0, 0, 13);
    core.addColorStop(
      0,
      `rgba(255, 247, 208, ${0.08 + 0.56 * breath})`
    );
    core.addColorStop(1, 'rgba(255, 232, 167, 0)');
    context.fillStyle = core;
    context.beginPath();
    context.arc(0, 0, 13, 0, Math.PI * 2);
    context.fill();
    context.restore();
    if (!motion.matches) {
      for (const particle of particles) {
        const cycle =
          (time * particle.speed + particle.phase) % (Math.PI * 2);
        const fade = Math.max(0, Math.sin(cycle));
        const x = Math.sin(cycle + particle.phase) * particle.orbit;
        const y = 20 - (cycle / (Math.PI * 2)) * 54;
        context.fillStyle = `rgba(255, 227, 152, ${fade * 0.32})`;
        context.beginPath();
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  /**
   * 反光沿原图的窄光带展开，以柔和的横向碎光表现水面扰动。
   * @param {number} time 动画经过的秒数。
   * @param {number} breath 当前呼吸周期的亮度比例。
   */
  function drawReflection(time, breath) {
    water.clearRect(0, 0, reflectionWidth, reflectionHeight);
    water.save();
    water.translate(reflectionWidth / 2, reflectionHeight / 2);
    water.scale(unit, unit);
    // 顺着原图反光向右下方展开，避开前景石块。
    water.save();
    water.transform(0.7, 0, 0.15, 1, 0, 0);
    const dim = water.createRadialGradient(0, 0, 0, 0, 0, 42);
    dim.addColorStop(0, `rgba(23, 48, 39, ${0.4 * (1 - breath)})`);
    dim.addColorStop(
      0.4,
      `rgba(23, 48, 39, ${0.22 * (1 - breath)})`
    );
    dim.addColorStop(1, 'rgba(23, 48, 39, 0)');
    water.fillStyle = dim;
    water.fillRect(-42, -42, 84, 84);
    const glow = water.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      38 + 6 * breath
    );
    glow.addColorStop(
      0,
      `rgba(255, 235, 161, ${0.025 + 0.18 * breath})`
    );
    glow.addColorStop(0.5, `rgba(255, 220, 138, ${0.07 * breath})`);
    glow.addColorStop(1, 'rgba(255, 220, 138, 0)');
    water.fillStyle = glow;
    water.fillRect(-44, -44, 88, 88);
    water.restore();
    for (let i = 0; i < 9; i++) {
      const drift = motion.matches
        ? 0
        : Math.sin(time * 1.3 + i * 1.7) * 1.8;
      const y = -28 + i * 7;
      const x = y * 0.15 + drift;
      const length = 7 + i * 2.4;
      const fade = Math.sin(((i + 1) / 10) * Math.PI);
      water.save();
      water.translate(x, y);
      water.scale(length, 1.1);
      const ripple = water.createRadialGradient(0, 0, 0, 0, 0, 1);
      ripple.addColorStop(
        0,
        `rgba(255, 240, 179, ${fade * (0.035 + 0.18 * breath)})`
      );
      ripple.addColorStop(1, 'rgba(255, 240, 179, 0)');
      water.fillStyle = ripple;
      water.fillRect(-1, -1, 2, 2);
      water.restore();
    }
    water.restore();
  }

  /**
   * 两处光照使用同一时钟，单独离屏的画布不再重绘。
   * @param {number} time 动画经过的秒数。
   * @param {boolean} force 是否绘制离屏画布。
   */
  function draw(time, force = false) {
    const breath = motion.matches
      ? 0.45
      : (1 - Math.cos((time * Math.PI * 2) / 4.2)) / 2;
    if (positioned && (force || inView)) drawLantern(time, breath);
    if (reflectionPositioned && (force || reflectionInView)) {
      drawReflection(time, breath);
    }
  }

  /**
   * 以 30 fps 上限绘制，页面隐藏或两处光照均不可见时停止。
   * @param {number} now 当前动画帧的毫秒时间戳。
   */
  function tick(now) {
    frame = 0;
    if (lastTime) elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    if (now - lastDraw >= 1000 / 30) {
      draw(elapsed / 1000);
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }

  /** 控制动画生命周期，减少动态模式只绘制静态光晕。 */
  function updatePlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (disposed || (!positioned && !reflectionPositioned)) return;
    if (motion.matches) {
      draw(0, true);
    } else if (
      ((positioned && inView) ||
        (reflectionPositioned && reflectionInView)) &&
      !document.hidden
    ) {
      frame = requestAnimationFrame(tick);
    }
  }

  /** 根据当前资源尺寸和实际 CSS 裁切位置定位灯芯。 */
  function resize() {
    if (disposed || !image.complete || !image.naturalWidth) return;
    const imageRect = image.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const positions = getComputedStyle(image).objectPosition.split(' ');
    const isMobile = image.currentSrc.includes('forest-hero-mobile');
    const lamp = lanternPoint(isMobile);
    const mapping = {
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      viewportWidth: imageRect.width,
      viewportHeight: imageRect.height,
      positionX: parseFloat(positions[0]) / 100,
      positionY: parseFloat(positions[1]) / 100,
    };
    const point = imagePointToViewport({
      ...mapping,
      pointX: lamp.x,
      pointY: lamp.y,
    });
    if (!point) return;
    unit = point.scale;
    size = Math.ceil(160 * unit);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(size * ratio);
    canvas.height = Math.ceil(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const lampLeft = imageRect.left - heroRect.left + point.x - size / 2;
    canvas.style.left = `${lampLeft}px`;
    canvas.style.top = `${imageRect.top - heroRect.top + point.y - size / 2}px`;
    positioned =
      point.x >= 0 &&
      point.x <= imageRect.width &&
      point.y >= 0 &&
      point.y <= imageRect.height;
    canvas.style.visibility = positioned ? 'visible' : 'hidden';
    const reflection = sourcePoint(REFLECTION, isMobile);
    const waterPoint = imagePointToViewport({
      ...mapping,
      pointX: reflection.x,
      pointY: reflection.y,
    });
    reflectionWidth = Math.ceil(128 * unit);
    reflectionHeight = Math.ceil(112 * unit);
    reflectionCanvas.width = Math.ceil(reflectionWidth * ratio);
    reflectionCanvas.height = Math.ceil(reflectionHeight * ratio);
    water.setTransform(ratio, 0, 0, ratio, 0, 0);
    reflectionCanvas.style.width = `${reflectionWidth}px`;
    reflectionCanvas.style.height = `${reflectionHeight}px`;
    const waterLeft = imageRect.left - heroRect.left +
      waterPoint.x - reflectionWidth / 2;
    const waterTop = imageRect.top - heroRect.top +
      waterPoint.y - reflectionHeight / 2;
    reflectionCanvas.style.left = `${waterLeft}px`;
    reflectionCanvas.style.top = `${waterTop}px`;
    reflectionPositioned =
      waterPoint.x >= 0 &&
      waterPoint.x <= imageRect.width &&
      waterPoint.y >= 0 &&
      waterPoint.y <= imageRect.height;
    reflectionCanvas.style.visibility = reflectionPositioned
      ? 'visible'
      : 'hidden';
    draw(elapsed / 1000, true);
    updatePlayback();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === canvas) inView = entry.isIntersecting;
      else reflectionInView = entry.isIntersecting;
    }
    updatePlayback();
  });
  visibility.observe(canvas);
  visibility.observe(reflectionCanvas);
  image.addEventListener('load', resize);
  mobile.addEventListener('change', resize);
  motion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
  resize();

  return () => {
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    visibility.disconnect();
    image.removeEventListener('load', resize);
    mobile.removeEventListener('change', resize);
    motion.removeEventListener('change', updatePlayback);
    document.removeEventListener(
      'visibilitychange',
      updatePlayback
    );
  };
}
