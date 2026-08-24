# Publish `dant3-robot` to PyPI safely

The Robot SDK is packaged at `sdk/python` as `dant3-robot` version `0.1.0`. Basic Robot interoperability stays free.

Dant3 uses **PyPI Trusted Publishing (OIDC)** rather than a long-lived PyPI API token. Do not add `PYPI_TOKEN`, PyPI passwords or upload credentials to GitHub secrets.

## One-time PyPI setup

On PyPI, create a pending Trusted Publisher for a new project (or add a publisher if the project already exists) with exactly:

- PyPI project name: `dant3-robot`
- GitHub owner: `snooptsz`
- GitHub repository: `dant3-mcp`
- Workflow filename: `release-robot-sdk.yml`
- Environment: `pypi`

The public workflow is `.github/workflows/release-robot-sdk.yml`.

A pending publisher does **not** reserve the project name until the first successful publish, so complete the first release promptly after the publisher is created.

## Recommended GitHub environment protection

Create the GitHub environment `pypi` and require a trusted maintainer approval before deployment. The publish job is isolated from the build job and receives only `contents: read` plus `id-token: write`.

## Release procedure

1. Confirm `sdk/python/pyproject.toml` has the intended unique version.
2. Confirm Robot SDK tests and packaging are clean.
3. Open **Actions → Release Robot Python SDK → Run workflow**.
4. Enter the exact confirmation string:

```text
PUBLISH_DANT3_ROBOT
```

5. Approve the `pypi` environment deployment when GitHub asks.
6. Verify the resulting PyPI project and install it into a clean Python environment.

The workflow always builds and tests first, then transfers only the built distributions to the isolated OIDC publish job.

## After first release

Once `dant3-robot` is independently installable from PyPI and the package has been smoke-tested, canonical Dant3 metadata can change the preferred install from the Git URL to:

```bash
python -m pip install dant3-robot
```

Do not advertise the PyPI install path until a real release exists and has been verified.
