# Captain Standard

You must have docker and docker-compose installed.

Create a file called docker-compose.override.yml with:

```YAML
version: '2'
services:
  lb:
    ports:
      - 3000:3000
```

(obviously, feel free to change the left port = the one on the host)

To launch the app : `docker-compose up -d`

To launch a shell on the app container: `docker-compose exec lb bash`

We use yarn rather than npm because it is much faster. To install a package, launch a shell on the app container and run `yarn add {package}` (or `yarn add {package} --dev` for a dev dependency).

Generally speaking, use your local machine for coding and git, and the container shell for everything else (lint/test/package management), so that we all do those stuffs in the same environment.
