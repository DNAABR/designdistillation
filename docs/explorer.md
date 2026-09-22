# Website explorer

v0.8 adds a static human-facing explorer generated directly from Design Distillation's machine-readable source.

The explorer does not introduce a database or duplicate content model. A build compiles the current corpus, registry, token documents, taxonomy, and deterministic Composer output into a browser dataset.

## Build

~~~bash
npm run explorer -- build --out .design-distillation/explorer
~~~

The build writes:

~~~text
index.html
styles.css
app.js
data.js
~~~

Because the dataset is emitted as a script, the built explorer can be opened as static files without a data API.

## Serve locally

~~~bash
npm run explorer -- serve --port 4173
~~~

The dependency-free Node server rebuilds the explorer and serves it on localhost.

## Source references

Every corpus entry, registry entry, and token record includes both its repository path and a clickable GitHub source URL.

The default v0.8 build points to the feature branch while it is under review. Rebuild with the eventual stable source ref when publishing:

~~~bash
npm run explorer -- build --source-ref main
~~~

This keeps the human view traceable to the canonical machine-readable data.

## Library browser

The Library view combines corpus and registry metadata. Users can search by title, ID, kind, summary, tags, platform, and category, then inspect use/avoid conditions, rationale, provenance, the full machine entry, and its exact source file.

The explorer never rewrites corpus content into an independent editorial database.

## Token inspector

The token view indexes primitive, semantic, and theme token leaves with token path, DTCG type, raw machine value/alias, scope, theme where applicable, and source document.

Theme records remain separate so semantic parity and theme mappings stay visible.

## Design DNA Lab

The lab is recipe-bound rather than a free-form style generator.

For every one of the 11 design recipes, the build runs the real v0.5 Composer in explicit single-recipe mode and stores that canonical baseline profile.

In the browser, users select a recipe, inspect foundation strategies, adjust all 24 Design DNA axes only inside that recipe's declared ranges, change the preview theme, inspect the profile-shaped preview, and download the corresponding Composer input.

Interactive changes use explorer-preview-v0.8 provenance and preview decisions. They are not silently represented as canonical Composer output.

## Static architecture

The explorer intentionally uses plain HTML, CSS, and browser JavaScript. The repository remains architecture-first and dependency-light; a frontend framework is not needed to browse static canonical data.

A future hosted explorer can wrap this dataset/compiler without changing the source-of-truth rules.

## Validation

npm run check verifies that explorer source assets exist, compiled counts match canonical sources, every browsable record has a machine-source link, all 11 recipes produce deterministic baseline profiles with all 24 bounded axes, static builds contain all assets, and repeated dataset builds are deterministic.
