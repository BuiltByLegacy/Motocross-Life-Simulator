# Create Real GitHub Issues from Markdown Drafts

The files in `docs/github/issues/` are planning drafts stored in the repository. GitHub does not automatically turn those Markdown files into Issues, so this repository includes a manual GitHub Actions workflow that imports them through the GitHub API.

## Workflow

Use **Actions → Create issues from Markdown drafts → Run workflow**.

Inputs:

- **draft_path**: Markdown file or directory to import. The default is `docs/github/issues`.
- **dry_run**: Keep this enabled first to preview what would be created without changing GitHub Issues.
- **duplicate_mode**:
  - `skip`: Do not create a new issue when an issue with the exact same title already exists.
  - `create`: Always create issues, even if the title already exists.

## Recommended Process

1. Run the workflow with `dry_run` enabled.
2. Review the workflow log and confirm the issue titles and labels are correct.
3. Run the workflow again with `dry_run` disabled.
4. Leave `duplicate_mode` set to `skip` unless duplicate Issues are intentional.

## Draft Format

Each issue draft must start with a level-one heading in this format:

```md
# Issue: Implement Example Feature
```

The importer uses everything until the next `# Issue:` heading as that issue's body.

Labels are read from a `## Labels` section when labels are wrapped in backticks. When creating real Issues, the importer creates any missing labels with a default color before assigning them:

```md
## Labels
`mvp`, `calendar`, `backend`
```

## Local Preview

You can preview the same parsing locally without a GitHub token:

```sh
node scripts/create-github-issues-from-drafts.js --path docs/github/issues --dry-run
```

Creating real issues outside GitHub Actions requires `GITHUB_TOKEN` and `GITHUB_REPOSITORY` environment variables with permission to create Issues.
