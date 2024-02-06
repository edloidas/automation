# Automation

> Showcases how to automate release processes using GitHub Actions.

It is designed for a specific release methodology, but can be adapted for other approaches. Key features include:

- Semantic versioning with a preceding `v` in tags and releases (e.g., `v1.0.3`).
- Releases are triggered upon tag push.
- Release notes are automatically extracted from the [CHANGELOG.md](CHANGELOG.md) file.
- Release titles are generated from a pattern recognized by a script in the workflow file, starting with `#` followed by the space and version tag.

## Release Action

We primarily utilize [softprops/action-gh-release](https://github.com/softprops/action-gh-release) for its simplicity and versatility.

However, for those looking for alternatives, especially since [actions/create-release](https://github.com/actions/create-release) is no longer maintained, consider:

- [ncipollo/release-action](https://github.com/ncipollo/release-action)
- [marvinpinto/action-automatic-releases](https://github.com/marvinpinto/action-automatic-releases)

## Managing Access

By default, workflow uses [GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) with default `restricted` permissions, which is not enough to do a release. There are several options to deal with it:

- **Adjust GITHUB_TOKEN Permissions:** Navigate to `Settings > Actions > General` in your repository, find `Workflow permissions`, and select `Read and write permissions`.

- **Specify more granular permissions:** Within your workflow's YAML file, specify necessary [permissions](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs#defining-access-for-the-github_token-scopes) as follows:

  ```yaml
  permissions:
    actions: write
    contents: write
  ```

  Contents `write` permission in required to create a release. Actions `write` permissions in is required to call `workflow_dispatch` event.

- **Use a Personal Access Token (PAT):** Create a PAT under `Settings > Developer Settings > Personal access tokens > Generate new token` with `All repositories` access and write `Actions` (if you use dispatch event) and `Contents` permissions. Add this token to your repository's secrets (`Settings > Secrets and variables > Actions > New repository secret`) and reference it as `WORKFLOW_TOKEN` in your workflows.

| **Note:** Using `actions/download-artifact` to read an artifact from one workflow to another [requires](https://github.com/actions/download-artifact?tab=readme-ov-file#download-artifacts-from-other-workflow-runs-or-repositories) PAT with Actions `read` permissions.

## Changelog

Once the changelog file is parsed, the notes will be passed between steps, so they need to be stored somewhere. The problem occurs when a release note contains multiple lines. To avoid problems with multi-line data, you should either remove special characters or use [Here Document](https://ss64.com/bash/syntax-here.html).

1. **Escaping.** It is common practice to replace `%`, `\n`, `\r` with their URL-encoded equivalents.

   ```sh
   CHANGELOG_CONTENT="${CHANGELOG_CONTENT//'%'/'%25'}"
   CHANGELOG_CONTENT="${CHANGELOG_CONTENT//$'\n'/'%0A'}"
   CHANGELOG_CONTENT="${CHANGELOG_CONTENT//$'\r'/'%0D'}"
   ```

   | **Note:** Using this string in the body of the release will likely cause the notes to be displayed as is, without being decoded.

2. **HereDoc.** Not a true Here Document _per se_, rather simulates the effect of appending a HereDoc-like structure to the output [output](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter). Notes can later be accessed via `${{steps.<step_id>.outputs.<variable_name>}}`.

   ```sh
   echo "changelog_content<<EOF" >> $GITHUB_OUTPUT
   echo "$CHANGELOG_CONTENT" >> $GITHUB_OUTPUT
   echo "EOF" >> $GITHUB_OUTPUT
   ```

   Content can also be written to `$GITHUB_ENV` and later accessed via `${{env.CHANGELOG_CONTENT}}`.

## Workflow

There are several common approaches to using the release workflow. Typically, you want to test your code before releasing it. So it makes sense to do a release after the application has been built and tested.

### 1. Single Workflow

The simplest way is to use a single file for all work. This approach may be suitable for small projects with simple workflows.

**Associated files:**

- [test-and-release.yml](.github/workflows/test-and-release.yml)

### 2. `workflow_dispatch` Event

This approach is suitable for cases where you want to have a separate workflow for release, for example your workflow files are large and you have many of them.

| **Note:** In addition to the above, you can run this "Release from Dispatch" release workflow on the Actions tab of the repository by specifying a `tag` value.

| **Note:** This event will only trigger the workflow if the workflow file is in the default branch.

**Associated files:**

- [test-and-dispatch.yml](.github/workflows/test-and-dispatch.yml)
- [release-from-dispatch.yml](.github/workflows/release-from-dispatch.yml)

### 3. `workflow_run` Event

Suitable for large projects, with multiple workflows and artifacts passed between them.

More than one type of activity triggers this [event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run). But we are only interested in the `completed` activity.

| **Note:** This event will only trigger a workflow if the workflow file is in the default branch.

**Associated files:**

- [test-and-share-artifacts.yml](.github/workflows/test-and-share-artifacts.yml)
- [release-from-artifacts.yml](.github/workflows/release-from-artifacts.yml)
