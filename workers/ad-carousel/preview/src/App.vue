<script setup lang="ts">
const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "https://diligent-studios-ad-carousel.niko-a29.workers.dev";
</script>

<template>
  <div class="preview">
    <header class="preview-header">
      <span class="badge">Preview</span>
      <span class="worker-url">{{ WORKER_URL }}</span>
    </header>
    <div class="iframe-container">
      <iframe
        :src="`${WORKER_URL}/embed`"
        frameborder="0"
        scrolling="no"
        allow="autoplay"
        title="Ad Carousel"
      />
    </div>
    <footer class="preview-footer">
      Embed URL: <code>{{ WORKER_URL }}/embed</code>
    </footer>
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  padding: 40px 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 100px;
}

.worker-url {
  color: rgba(255,255,255,0.25);
  font-family: monospace;
  font-size: 12px;
}

.iframe-container {
  width: min(860px, 100%);
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-footer {
  color: rgba(255,255,255,0.2);
  font-family: monospace;
  font-size: 11px;
}

.preview-footer code {
  color: rgba(255,255,255,0.35);
}
</style>
