<template>
  <div class="version-selector-container">
    <div class="version-section">
      <label class="section-label">Version</label>
      <div class="custom-dropdown">
        <button
          class="custom-dropdown-trigger"
          type="button"
          @click="toggleDropdown"
          @blur="closeDropdown"
        >
          <span>{{ selectedVersion }}</span>
          <svg
            class="dropdown-icon"
            :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div v-if="isOpen" class="custom-dropdown-menu">
          <button
            v-for="version in versions"
            :key="version.value"
            class="custom-dropdown-option"
            type="button"
            @mousedown.prevent="selectVersion(version)"
          >
            {{ version.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
const selectedVersion = ref('Latest')
const versions = [
  { label: 'Latest', value: 'latest' },
  { label: 'v1.0.0', value: 'v1' }
]

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

const selectVersion = (version) => {
  selectedVersion.value = version.label
  isOpen.value = false
  console.log('Selected version:', version.value)
}
</script>

<style scoped>
.version-selector-container {
  padding: 12px 16px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.version-section {
  position: relative;
}
</style>