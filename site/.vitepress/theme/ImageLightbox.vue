<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

interface LightboxImage {
  alt: string;
  src: string;
}

interface Point {
  clientX: number;
  clientY: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

const visible = ref(false);
const currentImage = ref<LightboxImage | null>(null);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const scale = ref(1);
const fitScale = ref(1);
const viewport = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
let dragState: DragState | null = null;
let suppressClick = false;
let imageObserver: MutationObserver | undefined;
let previousOverflow = '';
let previousFocus: HTMLElement | null = null;

const labels = {
  en: {
    close: 'Close',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    dialog: 'Image preview',
  },
  zh: {
    close: '关闭',
    zoomOut: '缩小',
    zoomIn: '放大',
    dialog: '图片预览',
  },
  ja: {
    close: '閉じる',
    zoomOut: '縮小',
    zoomIn: '拡大',
    dialog: '画像プレビュー',
  },
  ko: {
    close: '닫기',
    zoomOut: '축소',
    zoomIn: '확대',
    dialog: '이미지 미리보기',
  },
} as const;

const copy = () => {
  const language =
    typeof document === 'undefined' ? 'en' : document.documentElement.lang;
  if (language.startsWith('zh')) {
    return labels.zh;
  }
  if (language.startsWith('ja')) {
    return labels.ja;
  }
  if (language.startsWith('ko')) {
    return labels.ko;
  }
  return labels.en;
};

const imagePattern =
  /\.(?:avif|gif|jpe?g|png|svgz?|webp)(?:[?#]|$)/i;
const standaloneImageSelector =
  '.vp-doc img[alt]:not([alt=""])';

function resolveImageUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value, window.location.href);
    return imagePattern.test(url.pathname) ? url.href : null;
  } catch {
    return null;
  }
}

function imageFromEvent(event: MouseEvent): LightboxImage | null {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }

  const target = event.target as Element | null;
  if (!target?.closest) {
    return null;
  }

  const anchor = target.closest<HTMLAnchorElement>('.vp-doc a[href]');
  if (anchor) {
    const src = resolveImageUrl(anchor.getAttribute('href'));
    const preview = anchor.querySelector('img');
    if (src && preview.alt.trim()) {
      return {
        alt: preview.alt,
        src,
      };
    }
    return null;
  }

  const preview =
    target.closest<HTMLImageElement>(standaloneImageSelector);
  if (!preview) {
    return null;
  }
  const src = resolveImageUrl(preview.currentSrc || preview.src);
  return src
    ? {
      alt: preview.alt,
      src,
    }
    : null;
}

function updateFitScale() {
  if (!viewport.value || !naturalWidth.value || !naturalHeight.value) {
    return;
  }
  const availableWidth = viewport.value.clientWidth - 48;
  const availableHeight = viewport.value.clientHeight - 48;
  fitScale.value = Math.min(
    1,
    availableWidth / naturalWidth.value,
    availableHeight / naturalHeight.value,
  );
}

async function setScale(nextScale: number, point?: Point) {
  if (!viewport.value) {
    return;
  }

  const bounds = viewport.value.getBoundingClientRect();
  const focusX = point
    ? point.clientX - bounds.left + viewport.value.scrollLeft
    : viewport.value.clientWidth / 2 + viewport.value.scrollLeft;
  const focusY = point
    ? point.clientY - bounds.top + viewport.value.scrollTop
    : viewport.value.clientHeight / 2 + viewport.value.scrollTop;
  const ratio = nextScale / scale.value;

  scale.value = Math.min(6, Math.max(fitScale.value * 0.5, nextScale));
  await nextTick();

  viewport.value.scrollLeft =
    focusX * ratio - (point ? point.clientX - bounds.left : bounds.width / 2);
  viewport.value.scrollTop =
    focusY * ratio - (point ? point.clientY - bounds.top : bounds.height / 2);
}

async function open(image: LightboxImage) {
  previousFocus = document.activeElement as HTMLElement | null;
  previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  currentImage.value = image;
  visible.value = true;
  scale.value = 1;
  suppressClick = false;

  await nextTick();
  updateFitScale();
  scale.value = fitScale.value;
  closeButton.value?.focus();
}

function close() {
  visible.value = false;
  currentImage.value = null;
  scale.value = 1;
  document.documentElement.style.overflow = previousOverflow;
  previousFocus?.focus();
}

async function handleDocumentClick(event: MouseEvent) {
  const image = imageFromEvent(event);
  if (!image) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  await open(image);
}

function consumeClickSuppression(): boolean {
  const shouldSuppress = suppressClick;
  suppressClick = false;
  return shouldSuppress;
}

function enhanceStandaloneImages(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>(standaloneImageSelector)
    .forEach(image => {
      if (image.closest('a') || image.dataset.lightboxReady === 'true') {
        return;
      }
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', image.alt);
      image.dataset.lightboxReady = 'true';
    });
}

function handlePreviewKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const target = event.target as Element | null;
  const image = target?.closest<HTMLImageElement>(standaloneImageSelector);
  if (!image || image.closest('a')) {
    return;
  }
  const src = resolveImageUrl(image.currentSrc || image.src);
  if (!src) {
    return;
  }
  event.preventDefault();
  void open({
    alt: image.alt,
    src,
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (visible.value) {
    handleDialogKeydown(event);
  } else {
    handlePreviewKeydown(event);
  }
}

function handleResize() {
  if (!visible.value) {
    return;
  }
  updateFitScale();
  scale.value = Math.min(
    6,
    Math.max(fitScale.value * 0.5, scale.value),
  );
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== 'Tab') {
    return;
  }

  const controls = [
    closeButton.value,
    ...(viewport.value?.parentElement?.querySelectorAll<HTMLButtonElement>(
      '.sf-lightbox-toolbar button',
    ) || []),
  ].filter((button): button is HTMLButtonElement => Boolean(button));
  if (controls.length === 0) {
    return;
  }
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleImageLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;
  updateFitScale();
  if (scale.value === 1 || scale.value > fitScale.value * 1.5) {
    scale.value = fitScale.value;
  }
}

async function toggleZoom(event: MouseEvent) {
  event.stopPropagation();
  if (consumeClickSuppression()) {
    return;
  }
  const expanded = scale.value > fitScale.value + 0.001;
  await setScale(expanded ? fitScale.value : 1, event);
}

async function handleWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  event.preventDefault();
  const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
  await setScale(scale.value * factor, event);
}

function startDrag(event: PointerEvent) {
  if (!viewport.value || event.button !== 0) {
    return;
  }
  const horizontallyScrollable =
    viewport.value.scrollWidth > viewport.value.clientWidth;
  const verticallyScrollable =
    viewport.value.scrollHeight > viewport.value.clientHeight;
  if (!horizontallyScrollable && !verticallyScrollable) {
    return;
  }
  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.value.scrollLeft,
    scrollTop: viewport.value.scrollTop,
    moved: false,
  };
}

function moveDrag(event: PointerEvent) {
  if (!dragState || !viewport.value ||
      dragState.pointerId !== event.pointerId) {
    return;
  }
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  if (Math.hypot(deltaX, deltaY) < 4) {
    return;
  }
  if (!dragState.moved) {
    viewport.value.setPointerCapture(event.pointerId);
  }
  dragState.moved = true;
  viewport.value.scrollLeft = dragState.scrollLeft - deltaX;
  viewport.value.scrollTop = dragState.scrollTop - deltaY;
}

function endDrag(event: PointerEvent) {
  if (dragState?.pointerId === event.pointerId) {
    suppressClick = dragState.moved;
    if (
      dragState.moved &&
      viewport.value?.hasPointerCapture(event.pointerId)
    ) {
      viewport.value.releasePointerCapture(event.pointerId);
    }
    dragState = null;
  }
}

function handleViewportClick(event: MouseEvent) {
  if (consumeClickSuppression()) {
    return;
  }
  if (event.target === viewport.value) {
    close();
  }
}

onMounted(() => {
  enhanceStandaloneImages(document);
  imageObserver = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          enhanceStandaloneImages(node as ParentNode);
        }
      });
    }
  });
  imageObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('keydown', handleKeydown, true);
});

onBeforeUnmount(() => {
  imageObserver?.disconnect();
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', handleDocumentClick, true);
  document.removeEventListener('keydown', handleKeydown, true);
  document.documentElement.style.overflow = previousOverflow;
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && currentImage"
      class="sf-lightbox"
      role="presentation"
      @click.self="close"
    >
      <div
        class="sf-lightbox-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="copy().dialog"
      >
        <div class="sf-lightbox-toolbar">
          <button type="button" @click="close">{{ copy().close }}</button>
          <button
            type="button"
            :disabled="scale <= fitScale * 0.51"
            @click="setScale(scale / 1.25)"
          >
            {{ copy().zoomOut }}
          </button>
          <button type="button" @click="setScale(scale * 1.25)">
            {{ copy().zoomIn }}
          </button>
        </div>
        <div
          ref="viewport"
          class="sf-lightbox-viewport"
          @click="handleViewportClick"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img
            :src="currentImage.src"
            :alt="currentImage.alt"
            :style="naturalWidth
              ? { width: `${naturalWidth * scale}px` }
              : null"
            draggable="false"
            @load="handleImageLoad"
            @click="toggleZoom"
            @wheel="handleWheel"
          >
        </div>
        <p
          v-if="currentImage.alt"
          class="sf-lightbox-caption"
          aria-hidden="true"
        >
          {{ currentImage.alt }}
        </p>
        <button
          ref="closeButton"
          class="sf-lightbox-close"
          type="button"
          @click="close"
        >
          <span class="game-icon gi-close" aria-hidden="true"></span>
          <span class="sr-only">{{ copy().close }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>
