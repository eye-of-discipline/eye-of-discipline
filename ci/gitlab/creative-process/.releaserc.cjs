const fs = require('fs');

module.exports = {
  tagFormat: "${version}",
  branches: [
    { name: 'feat/multi-language', channel: 'language' },
    { name: 'develop', channel: 'dev', prerelease: true },
    { name: 'alpha', channel: 'alpha', prerelease: true },
    { name: 'release', channel: 'rc', prerelease: true },
    { name: 'hotfix', channel: 'ht', prerelease: true },
    { name: 'main' }
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '✨ Features ✨' },
            { type: 'fix', section: '🐛 Bug Fixes 🐛' },
            { type: 'revert', section: '⏮️️ Reverts ⏮️️' },
            { type: 'perf', section: '🔧 Performance Improvements 🔧' },
            { type: 'docs', section: '📝 Documentation 📝' },
            { type: 'build', section: '📀 Build 📀' },
            { type: 'test', section: '💚 Tests 💚' },
            { type: 'ci', section: '🏁 CI/CD 🏁' }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# CHANGELOG'
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md"],
        "message": "chore(release): Aktualizacja CHANGELOG.md [skip ci]"
      }
    ],
    '@semantic-release/gitlab',
    {
      useJobToken: false,
      assets: [{ path: 'CHANGELOG.md', label: 'Changelog' }],
      name: 'versioning-variables',
      generateNotes: (pluginConfig, context) => {
        const releaseNote = context.nextRelease.notes;
        const nextVersion = context.nextRelease.version;

        // Check if the version is release or snapshot
        let artifactType = 'snapshot';
        if (context.branch.name === context.env.CI_DEFAULT_BRANCH) {
          artifactType = 'release';
        }

        // Extract JIRA issues from commits
        const jiraRegexp = /\b[A-Z][A-Z0-9_]+-[1-9][0-9]*/g;
        const jiraSet = new Set();

        for (const commit of context.commits) {
          if (commit.message) {
            const matchJIRA = commit.message.match(jiraRegexp);
            if (matchJIRA) {
              matchJIRA.forEach((match) => jiraSet.add(match));
            }
          }
        }

        // Create a file with the environment variables
        const uniqJiraList = Array.from(jiraSet);
        const environmentList = [
          { key: 'RELEASE_CANDIDATE_VERSION', value: nextVersion },
          { key: 'RELEASE_CANDIDATE_TAG', value: 'v' + nextVersion },
          { key: 'ARTIFACTS_TYPE', value: artifactType },
          {
            key: 'JIRA_ISSUES_IDS',
            value: '"' + uniqJiraList.join(', ') + '"'
          }
        ];
        const fileContent = environmentList
          .map((env) => `${env.key}=${env.value}`)
          .join('\n');
        fs.writeFileSync('versioning.env', fileContent);
      }
    }
  ]
};
