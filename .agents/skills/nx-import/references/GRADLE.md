## Gradle

- If you import an entire Gradle repository into a subfolder, files like `gradlew`, `gradlew.bat`, and `gradle/wrapper` will end up inside that imported subfolder.
- Keep the wrapper with the imported Gradle project. `@nx/gradle` uses the wrapper at the project root and searches parent directories only when it is absent.
- If the intended wrapper lives elsewhere, configure `gradleExecutableDirectory` for the `@nx/gradle` plugin in `nx.json`.
- Because the import lands in a subfolder, Gradle project references can break; review settings and project path references, then fix any errors.
- If `@nx/gradle` is installed, run `nx show projects` to verify that Gradle projects are being inferred.

Helpful docs:

- https://nx.dev/docs/technologies/java/gradle/introduction
