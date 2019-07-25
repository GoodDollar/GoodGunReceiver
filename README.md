# GoodGunReceiver

This project is intended to work aside with [GoodDAPP](https://github.com/GoodDollar/GoodDAPP) project

## Prerequisites

* git - [Installation guide](https://www.linode.com/docs/development/version-control/how-to-install-git-on-linux-mac-and-windows/) .
* node.js - [Download page](https://nodejs.org/en/download/) .
* npm - comes with node or download yarn - [Download page](https://yarnpkg.com/lang/en/docs/install) .
* docker - [Installation guide](https://docs.docker.com/install/) .
* EB CLI - [Installation guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html#eb-cli3-install.scripts) .

## Install

1. Download the repository
2. Install npm modules: `npm install`
3. Start up the server: `node index.js` (for development)
4. View in browser at http://localhost:4444

## Test a Container Locally

1. `eb init -p docker` *application-name*
2. `eb local run --port 5000`
3. View in browser at http://localhost:5000

## Manual deploy

1. `eb init -p docker` *application-name*
2. `eb create` *environment-name* or `eb deploy` *environment-name*

## Travis Ci Deploy

1. Add your project’s repository to Travis CI
2. Push a `.travis.yml` file

### Add your project’s repository to Travis CI

Add your project’s GitHub repo to your list of Travis CI projects

Press _Environment Variables_ next, and you’ll be able to secretly add your credentials:

![](https://docs.travis-ci.com/images/settings-env-vars.png)

Create environment variables with names:

```
AWS_ACCESS_KEY
```
```
AWS_SECRET_ACCESS_KEY
```

### Deploy

Travis CI will deploy your files to AWS after a successful build.

1. `git commit`
2. `git push branch_name`
3. create pull request
4. Merge pull request.
