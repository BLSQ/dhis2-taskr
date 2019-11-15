
# Context

Small dhis2 scripts editor/runner to automate recurring tasks.

![](./doc/screenshot.png)

Script in JavaScript

  - Can combine multiple api calls
  - Add filter logic, calculations
  - Reusable and customisable recipes
  - Write once - Rerun whenever you need

can display results

- As table, Exportable as CSV
- As a map, If coordinate, coordinates or geometry field
- As json

# Development
## Prerequisite

install nodejs and yarn

```
  brew install yarn
```

## Create a .env.development

see
or take you personal user

```
REACT_APP_DHIS2_URL=https://play.dhis2.org/2.32.2
REACT_APP_USER=admin
REACT_APP_PASSWORD=district
```

## Start developement mode

```
yarn start
Then goto http://127.0.0.1:3000/ or http://localhost:3000
```

Note that localhost:3000 and 127.0.0.0:3000 needs to be whitelisted in Dhis2 Settings -> Access -> CORS whitelist
see https://<<your-dhis2>>/dhis-web-settings/index.html#/access


## if you don't have access rights, you might want to proxy the dhis2 api request

in package.json

```
 "proxy": "https://mydhis2",
```

in .env.development

```
REACT_APP_DHIS2_URL=http://localhost:3000
REACT_APP_USER=xxxxxxxxxxxx
REACT_APP_PASSWORD=xxxxxxxxxxxx
```

## Deployment to production

```
./ship.sh 'https://play.dhis2.org/2.31.6' 'admin' '<password>'
```
