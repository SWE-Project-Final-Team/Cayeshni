module.exports = {
  branches: ["main"],

  plugins: [
    // 1. Decide version bump
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "docs", release: false },
          { type: "refactor", release: false },
          { type: "test", release: false },
          { type: "chore", release: false },
          { type: "ci", release: false }
        ]
      }
    ],

    // 2. Generate changelog
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "docs", section: "Documentation" },
            { type: "refactor", section: "Refactoring" },
            { type: "test", section: "Tests" },
            { type: "chore", section: "Chores" },
            { type: "ci", section: "CI/CD" }
          ]
        }
      }
    ],

    // 3. Write CHANGELOG.md
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md"
      }
    ],

    // 4. Publish GitHub release
    "@semantic-release/github",

    // 5. Commit changelog back to repo
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]"
      }
    ]
  ]
};