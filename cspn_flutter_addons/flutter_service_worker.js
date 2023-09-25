'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"canvaskit/canvaskit.js": "bbf39143dfd758d8d847453b120c8ebb",
"canvaskit/canvaskit.wasm": "19d8b35640d13140fe4e6f3b8d450f04",
"canvaskit/chromium/canvaskit.js": "96ae916cd2d1b7320fff853ee22aebb0",
"canvaskit/chromium/canvaskit.wasm": "1165572f59d51e963a5bf9bdda61e39b",
"canvaskit/skwasm.js": "95f16c6690f955a45b2317496983dbe9",
"canvaskit/skwasm.wasm": "d1fde2560be92c0b07ad9cf9acb10d05",
"canvaskit/skwasm.worker.js": "51253d3321b11ddb8d73fa8aa87d3b15",
"flutter.js": "6fef97aeca90b426343ba6c5c9dc5d4a",
"main.dart.js": "504a20491e8a9bd0a6c1779be0d0c957",
"version.json": "43c04e4fda91cec94490719208f27004",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/summernote.html": "0a4697b4b9d3eba6074a152e66b83aaf",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/summernote-no-plugins.html": "f1c66d2bb0db13d30b7aaa86c07be1a4",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/summernote-lite.min.css": "1cd76f2bcd4d6d7bb8d765a234734796",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/summernote-lite-dark.css": "224219a4d108f1e47aa8d883be6ecd7f",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/summernote-lite.min.js": "c25b8ce17dba7bcc8b65e9394d18f981",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/jquery.min.js": "dc5e7f18c8d36ac1d3d4753a87c98d0a",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/font/summernote.eot": "f4a47ce92c02ef70fc848508f4cec94a",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/font/summernote.ttf": "82fa597f29de41cd41a7c402bcf09ba5",
"assets/packages/cspn_flutter_addons/package/html_editor_enhanced/assets/plugins/summernote-at-mention/summernote-at-mention.js": "b11db8ec59b494470e6a9ecfe498e67a",
"assets/packages/flex_color_picker/assets/opacity.png": "49c4f3bcb1b25364bb4c255edcaaf5b2",
"assets/packages/flutter_inappwebview/assets/t_rex_runner/t-rex.html": "16911fcc170c8af1c5457940bd0bf055",
"assets/packages/flutter_inappwebview/assets/t_rex_runner/t-rex.css": "5a8d0222407e388155d7d1395a75d5b9",
"assets/fonts/MaterialIcons-Regular.otf": "3baa9d33d2c97b50c9cc0a54fe6845cf",
"assets/shaders/ink_sparkle.frag": "f8b80e740d33eb157090be4e995febdf",
"assets/AssetManifest.json": "cd2fd8100279e64232ecad02e2aa5df4",
"assets/AssetManifest.bin": "4a7a190e0c8502227a31fb0d04e30a6f",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/NOTICES": "12b874c5f60cd959001ebbd59e22ab84",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "f509ffd7dc3f72d652cbdbd9756e39da",
"/": "f509ffd7dc3f72d652cbdbd9756e39da",
"manifest.json": "1bad7b6e2af3cd5153b268bac9d8c520"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
