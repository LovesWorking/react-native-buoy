import { defineConfig } from 'vitepress'

const sidebar = [
  {
    text: 'GETTING STARTED',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/codex-docs/framework/react-native/overview' },
      { text: 'Installation', link: '/codex-docs/framework/react-native/installation' },
      { text: 'Quick Start', link: '/codex-docs/framework/react-native/quick-start' },
      { text: 'Devtools', link: '/codex-docs/framework/react-native/devtools' },
    ],
  },
  {
    text: 'GUIDES',
    collapsed: false,
    items: [
      { text: 'App Host', link: '/codex-docs/guides/app-host' },
      { text: 'Building a Tool', link: '/codex-docs/guides/building-a-tool' },
      { text: 'Customizing Floating Menu', link: '/codex-docs/guides/customizing-floating-menu' },
      { text: 'DevTools Settings Modal', link: '/codex-docs/guides/settings-modal' },
      { text: 'Managing Visibility State', link: '/codex-docs/guides/state-visibility' },
    ],
  },
  {
    text: 'PLUGINS',
    collapsed: false,
    items: [
      { text: 'Environment Inspector', link: '/codex-docs/plugins/environment-inspector' },
      { text: 'Network Monitor', link: '/codex-docs/plugins/network-monitor' },
      { text: 'Storage Browser', link: '/codex-docs/plugins/storage-browser' },
      { text: 'React Query Panel', link: '/codex-docs/plugins/react-query-panel' },
    ],
  },
  {
    text: 'API REFERENCE',
    collapsed: false,
    items: [
      { text: 'AppHostProvider', link: '/codex-docs/reference/AppHostProvider' },
      { text: 'FloatingMenu', link: '/codex-docs/reference/FloatingMenu' },
      { text: 'DevToolsSettingsModal', link: '/codex-docs/reference/DevToolsSettingsModal' },
      { text: 'EnvVarsModal', link: '/codex-docs/reference/EnvVarsModal' },
      { text: 'StorageModalWithTabs', link: '/codex-docs/reference/StorageModalWithTabs' },
      { text: 'ReactQueryDevToolsModal', link: '/codex-docs/reference/ReactQueryDevToolsModal' },
      { text: 'useDevToolsSettings', link: '/codex-docs/reference/useDevToolsSettings' },
      { text: 'useDevToolsVisibility', link: '/codex-docs/reference/useDevToolsVisibility' },
      { text: 'useDynamicEnv', link: '/codex-docs/reference/useDynamicEnv' },
      { text: 'useNetworkEvents', link: '/codex-docs/reference/useNetworkEvents' },
      { text: 'settingsBus', link: '/codex-docs/reference/settingsBus' },
    ],
  },
  {
    text: 'EXAMPLES',
    collapsed: false,
    items: [
      { text: 'Basic Floating Menu', link: '/codex-docs/examples/basic-floating-menu' },
      { text: 'Launching Tools Programmatically', link: '/codex-docs/examples/launching-tools-programmatically' },
      { text: 'Custom Inline Tool', link: '/codex-docs/examples/custom-tool-inline' },
    ],
  },
]

export default defineConfig({
  title: 'Floating Dev Tools',
  description: 'Documentation for the floating developer menu platform',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,
  appearance: false,
  themeConfig: {
    logo: '/logo.svg',
    nav: [],
    sidebar,
    sidebarMenuLabel: 'Menu',
    outlineTitle: 'On this page',
    outline: [2, 3],
    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/aj' }
    ],
    search: {
      provider: 'local',
    },
  },
})
