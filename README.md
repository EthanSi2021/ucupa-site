# UCUPA website

The introductory website for **The system of United Cyber Universe Position and Anchor**.

This repository contains the independently built website, not the UCUPA backend. It introduces the spatial tree, Core / Facet / Realm, five public behaviors, and anchor mounts. The 3D example illustrates the model; it is not connected to live UCUPA services.

## Files

- `dist/` contains the editable HTML, CSS, JavaScript, and brand asset. It is the site source and the static serving directory; no build step or package installation is required.
- `.github/workflows/pages.yml` publishes only `dist/` through GitHub Actions. No publication branch is required.
- `.openai/hosting.json` identifies `dist` as the static site directory. It does not indicate that the site has been published.

## Local preview

With Python 3 installed, run this command from the repository root:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

On systems where Python 3 is named `python3`, substitute `python3` for `python`.

Open <http://127.0.0.1:4173/>. After editing a file, reload the page. Stop the preview with Ctrl+C. If port 4173 is already in use, reuse the existing preview or choose another port.

## Website and backend

- Website: [ethansi2021.github.io/ucupa-site](https://ethansi2021.github.io/ucupa-site/)
- Website source and deployment status: [EthanSi2021/ucupa-site](https://github.com/EthanSi2021/ucupa-site)
- UCUPA backend: [EthanSi2021/UCUPA](https://github.com/EthanSi2021/UCUPA)

The website retains the Prototype maturity label. Its `go run ./cmd/ucupa` example belongs
to a separate backend checkout and cannot be run from this website repository. See the
backend [run guide](https://github.com/EthanSi2021/UCUPA/blob/main/RUN.md) and
[expected output](https://github.com/EthanSi2021/UCUPA/blob/main/docs/prototype-demo.md#run-the-example).
A successful demo requires all five output lines and exit code 0.

## Publish with GitHub Pages

1. In the website repository, select **Settings → Pages → Build and deployment → Source → GitHub
   Actions**. This setting is required before deployment; the workflow does not enable Pages
   or change repository settings on its own.
2. Push reviewed website changes to `main`. The workflow runs when `dist/` or the workflow
   changes. To deploy manually, select **Actions → Deploy
   website to GitHub Pages → Run workflow** with `main` selected.
3. Wait for the deployment job to succeed and open its environment URL. Check the page,
   assets, navigation, and 3D interaction at that deployed URL before calling it published.

The workflow uses GitHub's built-in token and OpenID Connect, with read access to source and
write access only for Pages deployment and the required identity token. No personal access
token or custom repository secret is needed. Official Actions are pinned to full commit
SHAs. There is no dependency installation, build, or `gh-pages` branch. Only files under
`dist/` are included in the website artifact; the public source repository still includes
the reviewed source and configuration files.

Local asset URLs are relative, so the same files can be served at the default repository
path or a custom domain. Custom-domain setup is a separate step: verify domain ownership, configure the domain in
GitHub Pages settings, then configure DNS and HTTPS. This Actions deployment does not
require a `CNAME` file. Other owned domains need an HTTP redirect service if they are to
redirect to the primary domain; a DNS alias alone is not an HTTP redirect.

See GitHub's [custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[domain verification guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages),
and [custom-domain configuration guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## License

The website source is licensed under the [Apache License, Version 2.0](LICENSE).
