module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          // funcionalidades
          { type: "feat", release: "minor" },
          // correções
          { type: "fix", release: "patch" },
          // performance/refactor
          { type: "perf", release: "patch" },
          { type: "refactor", release: "patch" },
          // dependências runtime
          {
            type: "build",
            scope: "deps",
            release: "patch",
          },
          // dependências dev/build/storybook
          {
            type: "build",
            scope: "deps-dev",
            release: "patch",
          },
          // breaking changes
          {
            breaking: true,
            release: "major",
          },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/github",
  ],
};