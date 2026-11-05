## Gradle

- Keep each Gradle wrapper with its Gradle project or in a parent directory used by that project. Do not assume every imported project's wrapper belongs at the workspace root.
- The `@nx/gradle` plugin can use a wrapper from a configured directory. Set `gradleExecutableDirectory` to the directory containing the wrapper when it is outside the default project lookup.
- If the target workspace already has Gradle configured, check each project's wrapper resolution before moving or removing a wrapper.
- Because the import lands in a subfolder, Gradle project references can break; review settings and project path references, then fix any errors.
- If `@nx/gradle` is installed, run `pnpm nx show projects` to verify that Gradle projects are being inferred.

Helpful docs:

- https://nx.dev/docs/technologies/java/gradle/introduction
