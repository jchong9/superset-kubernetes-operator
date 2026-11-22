/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Zensical loads its search index while initializing the search component.
 * This script is inserted before its bundle on shared pages so a saved version
 * preference can select the corresponding root-relative index in time.
 */
(function () {
  "use strict";

  if (window.__supersetDocsSearchRouterInstalled) return;
  window.__supersetDocsSearchRouterInstalled = true;

  const VERSION_SEGMENT = /^(?:main|[0-9]+\.[0-9]+)$/;
  const SEARCH_INDEX = "search.json";
  const VERSION_SEARCH_INDEX = "search-root.json";
  const STORAGE_PREFIX = "superset-kubernetes-operator-docs-version:";
  const script = document.currentScript;
  let availableVersions;
  try {
    availableVersions = JSON.parse(script?.dataset.versions || "[]");
  } catch (error) {
    return;
  }
  if (!Array.isArray(availableVersions)) return;

  const scope = window.__md_scope;
  if (!(scope instanceof URL)) return;

  const root = scope.pathname.endsWith("/") ? scope.pathname : `${scope.pathname}/`;
  const pageParts = window.location.pathname.split("/").filter(Boolean);
  if (pageParts.some((part) => /^(?:main|latest|[0-9]+\.[0-9]+)$/.test(part))) return;

  let version;
  try {
    version = window.sessionStorage.getItem(`${STORAGE_PREFIX}${root}`);
  } catch (error) {
    return;
  }
  if (!version || !VERSION_SEGMENT.test(version) || !availableVersions.includes(version)) return;

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (method.toUpperCase() === "GET") {
      try {
        const request = new URL(url, window.location.href);
        if (
          request.origin === window.location.origin &&
          request.pathname === `${root}${SEARCH_INDEX}`
        ) {
          request.pathname = `${root}${version}/${VERSION_SEARCH_INDEX}`;
          url = request.href;
        }
      } catch (error) {
        // Leave malformed or non-URL requests untouched.
      }
    }
    return originalOpen.call(this, method, url, ...args);
  };
})();
