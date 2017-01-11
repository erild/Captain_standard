# Captain Standard [![Build Status](https://travis-ci.org/erild/Captain_standard.svg?branch=master)](https://travis-ci.org/erild/Captain_standard)

You can use either docker or vagrant to create a dev env.

#### Configuration

Some things to configure :
- the database : In a file `server/datasources.local.json` (on the production server, with environment variables following `datasources.production.json`)
- the oauth credentials : With environment variables (which you can put in `server/.env`), GITHUB_BACKEND_URL (for instance http://728738da72.ngrok.io), GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, which you can get by creating an app [here](https://github.com/settings/applications/new)
- the port for the server app, if you want something else than 2000 : In a file `server/config.local.json`

After having created the database in the psql command line (`psql -h localhost -p 5432 -U postgres -W` then `CREATE DATABASE captain_standard;`), update the schema with `node bin/autoupdate.js`;
#### Docker

You must have docker and docker-compose installed.

Create a file called docker-compose.override.yml with:

```YAML
version: '2'
services:
  lb:
    ports:
      - 2000:2000
      - 3000:3000
  pg:
    ports:
      - 5432:5432
```

(obviously, feel free to change the left port = the one on the host)

To launch the app : `docker-compose up -d`

To launch a shell on the app container: `docker-compose exec lb bash`

We use yarn rather than npm because it is much faster. To install a package, launch a shell on the app container and run `yarn add {package}` (or `yarn add {package} --dev` for a dev dependency).

In dev, you should launch the react hot-reloaded dev server with `npm start` in the `client` folder. In prod, `npm run build` will build the static files in `client/build` folder, that will be served by loopback server.

#### Vagrant

If you can't have a true docker install (for instance Windows < 10) or if you just don't like it, you may use vagrant.  If you are using a Windows host machine, you have to use a local account for the computer (instead of a connected Outlook account) to be able to use a password for the SMB sharing.

Install vagrant, virtualbox and ansible (ansible not needed if you use a Windows host machine; else, install using pip to get version > 2.2), then launch `vagrant up`. It should work out of the box, after vagrant is done with the provisioning. You can then access the VM using `captain.local` address in your browser (of course, launch the app with `node .` on the machine in `/vagrant` directory before).

##### Using Hyper-V instead of Virtualbox

If you have Hyper-V (for instance if you use Docker For Windows Beta), you can't use VirtualBox at the same time. You can either:

- Use a dual boot entry to choose to boot with or without Hyper-V : see http://www.hanselman.com/blog/SwitchEasilyBetweenVirtualBoxAndHyperVWithABCDEditBootEntryInWindows81.aspx
- Use a hyper-v vagrant box: download https://people.ragg.fr/~kiwi/shared/jessie-hyperv.box, and type in a command line `vagrant box add jessie-hyperv \path\to\jessie-hyperv.box`. Then you'll have to configure a virtual switch : Go in the Hyper V Configuration Management tool, choose in the right panel "Network switch", and add an external switch linked with the interface connected to the Internet. You're now ready to `vagrant up --provider=hyperv` !

NB: With Hyper V, you have to use Vagrant in a CLI/GUI launched with administrator privileges.


### Provisioning with Ansible

We use ansible to provision the vagrant machine (dev env) and the production server (production env).

To provision the dev vagrant, just launch `vagrant provision`. To provision the production server, you must create an inventory file. It is usually located in `/etc/ansible/hosts` but you can create wherever you want, you will simply have to indicate it in each ansible command using `-i` parameter. This file should look like :

```ini
[production]
main_prod ansible_host=1.2.3.4 ansible_user=ubuntu

[production:vars]
ansible_private_key_file=/home/yourname/.ssh/id_rsa.prod
env=production
apache_server_name=www.captain-standard.com
```

Once this file is created, you can provision the server with `ansible-playbook -i /path/to/inventory.ini ansible/playbook.yml -K`.

This provisioning is needed only once but can be done as many times as you want (just beware of the use of different vars across developers, especially regarding the password for the process manager `pm_password`).

Once the server is provisioned, you may deploy. We deploy by pushing on the 'production' git branch. Then Travis does the job. Nonetheless, you need to manually generate a ssh key and put the public key in the `~/.ssh/authorized_keys` on the production server. Travis needs also 3 environment variables set up:
- SSH_USER: user of the server
- SSH_KEY_RAW: ssh key you generated, without the first and the last line (`BEGIN RSA...` and `END RSA...`). Obviously needs to be private. You'll need to wrap it into double quotes as it has newlines.
- PRODUCTION_SERVER: host of the production server.
