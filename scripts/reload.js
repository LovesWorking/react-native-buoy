#!/usr/bin/env node

const { execSync } = require("child_process");
const http = require("http");

/**
 * Expo App Reload Script for iOS Simulator
 *
 * This script provides multiple ways to reload your Expo app:
 * 1. Hot Module Reload via Metro WebSocket
 * 2. Send reload keypress to simulator
 * 3. HTTP request to Metro reload endpoint
 */

const DEFAULT_METRO_PORT = 8081;
const DEFAULT_HOST = "localhost";
const DEFAULT_CONNECT_TIMEOUT_MS = 1500; // Fast connect timeout for WS/HTTP
const DEFAULT_OVERALL_TIMEOUT_MS = 6000; // Prevent hangs in CI/sandbox

// Common Metro server hosts to try
const COMMON_HOSTS = [
  "localhost",
  "127.0.0.1",
  "192.168.4.55", // Your current IP from the Expo output
  "0.0.0.0",
];

class ExpoReloader {
  constructor(options = {}) {
    this.host = options.host || DEFAULT_HOST;
    this.port = options.port || DEFAULT_METRO_PORT;
    this.verbose = options.verbose || false;
    this.autoDetect = options.autoDetect !== false; // Auto-detect by default
    this.connectTimeoutMs =
      options.connectTimeoutMs || DEFAULT_CONNECT_TIMEOUT_MS;
    this.overallTimeoutMs =
      options.overallTimeoutMs || DEFAULT_OVERALL_TIMEOUT_MS;
  }

  log(message) {
    if (this.verbose) {
      console.log(`[ExpoReloader] ${message}`);
    }
  }

  /**
   * Auto-detect Metro server by checking which host responds
   */
  async detectMetroServer() {
    if (!this.autoDetect) {
      return { host: this.host, port: this.port };
    }

    this.log("Auto-detecting Metro server...");

    for (const host of COMMON_HOSTS) {
      try {
        await this.checkServerHealth(host, this.port);
        this.log(`Found Metro server at ${host}:${this.port}`);
        return { host, port: this.port };
      } catch (error) {
        this.log(`${host}:${this.port} not responding`);
        continue;
      }
    }

    throw new Error(
      'Could not auto-detect Metro server. Make sure Expo is running with "npx expo start"'
    );
  }

  /**
   * Check if Metro server is responding
   */
  async checkServerHealth(host, port) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: host,
          port: port,
          path: "/",
          method: "GET",
          timeout: this.connectTimeoutMs,
        },
        (res) => {
          resolve(true);
        }
      );

      req.on("error", reject);
      req.on("timeout", () => reject(new Error("Timeout")));
      req.end();
    });
  }

  /**
   * Method 1: Use Metro Message WebSocket to trigger reload
   */
  async reloadViaWebSocket(serverInfo = null) {
    const server = serverInfo || (await this.detectMetroServer());

    return new Promise((resolve, reject) => {
      // Use built-in WebSocket API (available in Node.js 20+)
      const WebSocket = require("ws");
      const ws = new WebSocket(`ws://${server.host}:${server.port}/message`);

      const connectTimeout = setTimeout(() => {
        try {
          ws.terminate();
        } catch {}
        reject(new Error("WS connect timeout"));
      }, this.connectTimeoutMs);

      ws.on("open", () => {
        clearTimeout(connectTimeout);
        this.log(
          `Connected to Metro message socket at ${server.host}:${server.port}/message`
        );

        // Send reload message in the format Metro expects
        const message = JSON.stringify({
          version: 2,
          method: "reload",
        });

        ws.send(message);
        this.log("Sent reload message");

        setTimeout(() => {
          ws.close();
          resolve(
            `Reload sent via WebSocket to ${server.host}:${server.port}/message`
          );
        }, 1000);
      });

      ws.on("error", (error) => {
        clearTimeout(connectTimeout);
        reject(
          `WebSocket error: ${error.message}. Ensure Metro is running or try --method=http`
        );
      });

      ws.on("close", () => {
        this.log("WebSocket connection closed");
      });
    });
  }

  /**
   * Method 2: Send Command+R keypress to iOS Simulator
   */
  async reloadViaSimulatorKeypress() {
    try {
      // Check if Simulator is running
      execSync('pgrep -f "Simulator"', { stdio: "ignore" });

      // Send Command+R to reload
      execSync(
        `osascript -e 'tell application "Simulator" to activate' -e 'tell application "System Events" to keystroke "r" using command down'`
      );

      return "Reload keypress sent to iOS Simulator";
    } catch (error) {
      throw new Error("iOS Simulator not running or keypress failed");
    }
  }

  /**
   * Method 3: HTTP request to Metro reload endpoint
   */
  async reloadViaHttp(serverInfo = null) {
    const server = serverInfo || (await this.detectMetroServer());

    return new Promise((resolve, reject) => {
      // Try multiple possible endpoints that Expo/Metro uses
      const endpoints = [
        { path: "/reload", method: "POST" },
        { path: "/reload", method: "GET" },
        { path: "/reloadApp", method: "POST" },
        { path: "/reloadApp", method: "GET" },
        { path: "/refresh", method: "POST" },
        { path: "/refresh", method: "GET" },
      ];

      let currentEndpoint = 0;

      const tryEndpoint = () => {
        if (currentEndpoint >= endpoints.length) {
          reject(`All HTTP endpoints failed for ${server.host}:${server.port}`);
          return;
        }

        const endpoint = endpoints[currentEndpoint];
        const postData =
          endpoint.method === "POST"
            ? JSON.stringify({ command: "reload" })
            : "";

        const options = {
          hostname: server.host,
          port: server.port,
          path: endpoint.path,
          method: endpoint.method,
          timeout: this.connectTimeoutMs,
          headers:
            endpoint.method === "POST"
              ? {
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(postData),
                }
              : {},
        };

        this.log(
          `Trying HTTP ${endpoint.method} ${server.host}:${server.port}${endpoint.path}`
        );

        const req = http.request(options, (res) => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve(
              `Reload requested via HTTP ${endpoint.method} ${server.host}:${server.port}${endpoint.path}`
            );
          } else {
            this.log(
              `HTTP ${endpoint.method} ${endpoint.path} failed with status: ${res.statusCode}`
            );
            currentEndpoint++;
            setTimeout(tryEndpoint, 100); // Small delay between attempts
          }
        });

        req.on("error", (error) => {
          this.log(
            `HTTP ${endpoint.method} ${endpoint.path} error: ${error.message}`
          );
          currentEndpoint++;
          setTimeout(tryEndpoint, 100);
        });

        req.on("timeout", () => {
          this.log(`HTTP ${endpoint.method} ${endpoint.path} timed out`);
          req.destroy();
          currentEndpoint++;
          setTimeout(tryEndpoint, 100);
        });

        if (endpoint.method === "POST") {
          req.write(postData);
        }
        req.end();
      };

      tryEndpoint();
    });
  }

  /**
   * Method 4: Use Expo CLI reload command if available
   */
  async reloadViaExpoCli() {
    try {
      // Try to use expo-cli or @expo/cli reload
      execSync("npx expo reload", { stdio: "ignore" });
      return "Reload triggered via Expo CLI";
    } catch (error) {
      throw new Error("Expo CLI reload not available or failed");
    }
  }

  /**
   * Try all reload methods in order of preference
   */
  async reload() {
    // Pre-detect server to share across HTTP methods
    let serverInfo = null;
    const watchdog = setTimeout(() => {
      console.warn(
        `Reload watchdog timed out after ${this.overallTimeoutMs}ms. Continuing without reload.`
      );
      // Do not throw; allow caller to proceed (e.g., screenshots)
    }, this.overallTimeoutMs);
    if (this.autoDetect) {
      try {
        serverInfo = await this.detectMetroServer();
        console.log(
          `📍 Detected Metro server at ${serverInfo.host}:${serverInfo.port}`
        );
      } catch (error) {
        this.log(`Server detection failed: ${error.message}`);
      }
    }

    const methods = [
      { name: "WebSocket", method: () => this.reloadViaWebSocket(serverInfo) },
      {
        name: "Simulator Keypress",
        method: () => this.reloadViaSimulatorKeypress(),
      },
      { name: "HTTP", method: () => this.reloadViaHttp(serverInfo) },
      { name: "Expo CLI", method: () => this.reloadViaExpoCli() },
    ];

    for (const { name, method } of methods) {
      try {
        this.log(`Trying reload method: ${name}`);
        const result = await method();
        console.log(`✅ Success: ${result}`);
        clearTimeout(watchdog);
        return;
      } catch (error) {
        this.log(`${name} failed: ${error.message}`);
        continue;
      }
    }

    console.error(
      "❌ All reload methods failed. Make sure your Expo dev server is running."
    );
    console.error("   Try running: npx expo start");
    clearTimeout(watchdog);
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const port =
    args.find((arg) => arg.startsWith("--port="))?.split("=")[1] ||
    DEFAULT_METRO_PORT;
  const host =
    args.find((arg) => arg.startsWith("--host="))?.split("=")[1] ||
    DEFAULT_HOST;
  const method = args.find((arg) => arg.startsWith("--method="))?.split("=")[1];

  const fast = args.includes("--fast");
  const timeoutArg = args.find((arg) => arg.startsWith("--timeout="));
  const connectTimeoutMs = timeoutArg
    ? parseInt(timeoutArg.split("=")[1], 10)
    : fast
      ? 800
      : DEFAULT_CONNECT_TIMEOUT_MS;
  const overallTimeoutArg = args.find((arg) =>
    arg.startsWith("--overall-timeout=")
  );
  const overallTimeoutMs = overallTimeoutArg
    ? parseInt(overallTimeoutArg.split("=")[1], 10)
    : fast
      ? 3500
      : DEFAULT_OVERALL_TIMEOUT_MS;

  const reloader = new ExpoReloader({
    host,
    port: parseInt(port),
    verbose,
    connectTimeoutMs,
    overallTimeoutMs,
  });

  if (method) {
    // Use specific method
    const methodMap = {
      websocket: () => reloader.reloadViaWebSocket(),
      keypress: () => reloader.reloadViaSimulatorKeypress(),
      http: () => reloader.reloadViaHttp(),
      cli: () => reloader.reloadViaExpoCli(),
    };

    if (methodMap[method]) {
      methodMap[method]()
        .then((result) => console.log(`✅ ${result}`))
        .catch((error) => console.error(`❌ ${error.message}`));
    } else {
      console.error(
        `❌ Unknown method: ${method}. Available: websocket, keypress, http, cli`
      );
    }
  } else {
    // Try all methods
    reloader.reload();
  }
}

module.exports = { ExpoReloader };
