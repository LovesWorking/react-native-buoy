/**
 * RouteParser - Extract and organize routes from Expo Router's RouteNode tree
 *
 * Based on research findings in:
 * - docs/routing/expo/ROUTENODE_TYPE_DEFINITION.md
 * - docs/routing/expo/ROUTES_SITEMAP_RESEARCH.md
 */

// Type-only definition to avoid Metro resolution issues
type RouteNode = {
  type: 'route' | 'api' | 'layout' | 'redirect' | 'rewrite';
  route: string;
  contextKey: string;
  children: RouteNode[];
  dynamic: null | Array<{ name: string; deep: boolean; notFound?: boolean }>;
  internal?: boolean;
  generated?: boolean;
  initialRouteName?: string;
};

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Route type classification
 */
export type RouteType =
  | 'static'        // Regular route: /home
  | 'dynamic'       // Dynamic segment: /profile/[id]
  | 'catch-all'     // Catch-all: /posts/[...slug]
  | 'index'         // Index route: /
  | 'layout'        // Layout component: _layout
  | 'group'         // Route group: (tabs)
  | 'not-found';    // 404 fallback

/**
 * Parsed route information
 */
export interface RouteInfo {
  /** Full path (e.g., "/pokemon/[id]") */
  path: string;

  /** Route name/segment (e.g., "[id]") */
  name: string;

  /** Route type classification */
  type: RouteType;

  /** Dynamic parameter names (e.g., ["id"]) */
  params: string[];

  /** Original RouteNode type */
  nodeType: RouteNode['type'];

  /** File path/context key */
  contextKey: string;

  /** Is this route internal/generated? */
  isInternal: boolean;

  /** Children routes */
  children: RouteInfo[];

  /** Depth in route tree (0 = root) */
  depth: number;
}

/**
 * Grouped routes for display
 */
export interface RouteGroup {
  title: string;
  icon: string;
  routes: RouteInfo[];
}

/**
 * Route statistics
 */
export interface RouteStats {
  total: number;
  static: number;
  dynamic: number;
  catchAll: number;
  layouts: number;
  groups: number;
}

// ============================================================================
// Route Parser Class
// ============================================================================

export class RouteParser {
  /**
   * Parse RouteNode tree and extract all routes
   */
  static parseRouteTree(rootNode: RouteNode | null): RouteInfo[] {
    if (!rootNode) {
      return [];
    }

    const routes: RouteInfo[] = [];
    this.traverseNode(rootNode, '', routes, 0);
    return routes;
  }

  /**
   * Recursively traverse RouteNode tree
   */
  private static traverseNode(
    node: RouteNode,
    parentPath: string,
    routes: RouteInfo[],
    depth: number
  ): void {
    const currentPath = this.buildPath(node, parentPath);
    const routeType = this.detectRouteType(node);
    const shouldInclude = this.shouldIncludeRoute(node);

    const routeInfo: RouteInfo = {
      path: currentPath,
      name: node.route,
      type: routeType,
      params: this.extractParams(node),
      nodeType: node.type,
      contextKey: node.contextKey,
      isInternal: node.internal ?? false,
      children: [],
      depth,
    };

    if (shouldInclude) {
      routes.push(routeInfo);
    }

    for (const child of node.children) {
      this.traverseNode(child, currentPath, shouldInclude ? routeInfo.children : routes, depth + 1);
    }
  }

  /**
   * Build full path for a route node
   */
  private static buildPath(node: RouteNode, parentPath: string): string {
    if (node.type === 'layout' && node.route === '_layout') {
      return parentPath;
    }

    if (node.route.startsWith('(') && node.route.endsWith(')')) {
      return parentPath;
    }

    if (node.route === 'index') {
      return parentPath || '/';
    }

    const segment = node.route;

    if (!parentPath || parentPath === '/') {
      return `/${segment}`;
    }

    return `${parentPath}/${segment}`;
  }

  /**
   * Detect the route type classification
   */
  private static detectRouteType(node: RouteNode): RouteType {
    const routeName = node.route;

    if (node.dynamic?.some(d => d.notFound)) {
      return 'not-found';
    }

    if (node.dynamic?.some(d => d.deep)) {
      return 'catch-all';
    }

    if (node.dynamic && node.dynamic.length > 0) {
      return 'dynamic';
    }

    if (node.type === 'layout') {
      return 'layout';
    }

    if (routeName.startsWith('(') && routeName.endsWith(')')) {
      return 'group';
    }

    if (routeName === 'index') {
      return 'index';
    }

    return 'static';
  }

  /**
   * Extract dynamic parameter names from route
   */
  private static extractParams(node: RouteNode): string[] {
    if (!node.dynamic || node.dynamic.length === 0) {
      return [];
    }

    return node.dynamic.map(d => d.name);
  }

  /**
   * Determine if route should be included in results
   */
  private static shouldIncludeRoute(node: RouteNode): boolean {
    if (node.internal) return false;
    if (node.generated) return false;
    if (node.type === 'api') return false;
    return true;
  }

  /**
   * Organize routes into groups for display
   */
  static organizeRoutes(routes: RouteInfo[]): RouteGroup[] {
    const groups: RouteGroup[] = [];

    const rootRoutes = routes.filter(r => r.depth === 0 && r.type !== 'dynamic' && r.type !== 'layout');
    const dynamicRoutes = this.flattenRoutes(routes).filter(r => r.type === 'dynamic' || r.type === 'catch-all');
    const layoutRoutes = this.flattenRoutes(routes).filter(r => r.type === 'layout');
    const groupedRoutes = this.flattenRoutes(routes).filter(r => r.type === 'group');

    if (rootRoutes.length > 0) {
      groups.push({
        title: 'Root Routes',
        icon: '',
        routes: rootRoutes,
      });
    }

    if (dynamicRoutes.length > 0) {
      groups.push({
        title: 'Dynamic Routes',
        icon: '',
        routes: dynamicRoutes,
      });
    }

    if (layoutRoutes.length > 0) {
      groups.push({
        title: 'Layouts',
        icon: '',
        routes: layoutRoutes,
      });
    }

    if (groupedRoutes.length > 0) {
      groups.push({
        title: 'Route Groups',
        icon: '',
        routes: groupedRoutes,
      });
    }

    return groups;
  }

  /**
   * Flatten nested routes into a single array
   */
  private static flattenRoutes(routes: RouteInfo[]): RouteInfo[] {
    const flattened: RouteInfo[] = [];

    function traverse(route: RouteInfo) {
      flattened.push(route);
      route.children.forEach(traverse);
    }

    routes.forEach(traverse);
    return flattened;
  }

  /**
   * Get route statistics
   */
  static getRouteStats(routes: RouteInfo[]): RouteStats {
    const flatRoutes = this.flattenRoutes(routes);

    return {
      total: flatRoutes.length,
      static: flatRoutes.filter(r => r.type === 'static').length,
      dynamic: flatRoutes.filter(r => r.type === 'dynamic').length,
      catchAll: flatRoutes.filter(r => r.type === 'catch-all').length,
      layouts: flatRoutes.filter(r => r.type === 'layout').length,
      groups: flatRoutes.filter(r => r.type === 'group').length,
    };
  }

  /**
   * Search/filter routes by query
   */
  static filterRoutes(routes: RouteInfo[], query: string): RouteInfo[] {
    if (!query) {
      return routes;
    }

    const lowerQuery = query.toLowerCase();
    const flatRoutes = this.flattenRoutes(routes);

    return flatRoutes.filter(route => {
      return (
        route.path.toLowerCase().includes(lowerQuery) ||
        route.name.toLowerCase().includes(lowerQuery) ||
        route.type.toLowerCase().includes(lowerQuery) ||
        route.params.some(p => p.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Build a visual tree string representation
   */
  static buildTreeString(routes: RouteInfo[], depth: number = 0): string {
    let output = '';

    routes.forEach((route, index) => {
      const isLast = index === routes.length - 1;
      const prefix = this.buildTreePrefix(depth, isLast);

      let routeLine = `${prefix}${route.path}`;

      if (route.params.length > 0) {
        routeLine += ` { ${route.params.join(', ')} }`;
      }

      output += routeLine + '\n';

      if (route.children.length > 0) {
        output += this.buildTreeString(route.children, depth + 1);
      }
    });

    return output;
  }

  private static buildTreePrefix(depth: number, isLast: boolean): string {
    if (depth === 0) {
      return '';
    }

    const indent = '  '.repeat(depth - 1);
    const branch = isLast ? '└─ ' : '├─ ';
    return indent + branch;
  }

  /**
   * Sort routes by various criteria
   */
  static sortRoutes(routes: RouteInfo[], sortBy: 'path' | 'type' | 'name' = 'path'): RouteInfo[] {
    const sorted = [...routes];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'path': return a.path.localeCompare(b.path);
        case 'type': return a.type.localeCompare(b.type);
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return sorted;
  }

  /**
   * Get route by path
   */
  static findRouteByPath(routes: RouteInfo[], path: string): RouteInfo | null {
    const flatRoutes = this.flattenRoutes(routes);
    return flatRoutes.find(r => r.path === path) || null;
  }

  /**
   * Get all parent routes for a given route
   */
  static getParentRoutes(routes: RouteInfo[], targetPath: string): RouteInfo[] {
    const parents: RouteInfo[] = [];
    const flatRoutes = this.flattenRoutes(routes);

    const target = flatRoutes.find(r => r.path === targetPath);
    if (!target) {
      return parents;
    }

    const pathSegments = targetPath.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < pathSegments.length - 1; i++) {
      currentPath += '/' + pathSegments[i];
      const parent = flatRoutes.find(r => r.path === currentPath);
      if (parent) {
        parents.push(parent);
      }
    }

    return parents;
  }
}
