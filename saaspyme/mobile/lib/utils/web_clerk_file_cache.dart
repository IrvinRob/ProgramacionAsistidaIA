import 'dart:io';

import 'package:clerk_flutter/src/utils/clerk_file_cache.dart';

/// Cache en memoria para Clerk en web (evita path_provider / dart:io).
class WebClerkFileCache implements ClerkFileCache {
  @override
  Future<void> initialize() async {}

  @override
  void terminate() {}

  @override
  Stream<File> stream(
    Uri uri, {
    Duration ttl = ClerkFileCache.defaultTTL,
    Map<String, String>? headers,
  }) {
    return Stream<File>.empty();
  }
}
