# savebook.net — Game Guides Monorepo

Unified repo for savebook.net game guide sites.

## Sites

| Site | Domain | Description |
|------|--------|-------------|
| hub | savebook.net | Main hub / portal |
| fh6guide | fh6.savebook.net | Forza Horizon 6 Japan Guide |
| dead-as-disco | disco.savebook.net | Dead As Disco Walkthrough |
| subnautica2 | subnautica2.savebook.net | Subnautica 2 Wiki |

## Structure

```
sites/
  hub/
  fh6guide/
  dead-as-disco/
  subnautica2/
dist/              ← build output (Cloudflare Pages reads from here)
  hub/
  fh6guide/
  dead-as-disco/
  subnautica2/
build.mjs           ← builds all sites to dist/
```

## Cloudflare Pages Setup

Each site has its own Cloudflare Pages project pointing to its sub-directory in `dist/`:

| Project | Root directory |
|---------|--------------|
| savebook | `/dist/hub/` |
| fh6guide | `/dist/fh6guide/` |
| dead-as-disco | `/dist/dead-as-disco/` |
| subnautica2 | `/dist/subnautica2/` |

Build command for all: `npm run build`
