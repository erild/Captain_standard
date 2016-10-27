# Captain Standard

You can use either docker or vagrant to create a dev env.

#### Docker

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

In dev, you should launch the react hot-reloaded dev server with `npm start` in the `client` folder. In prod, `npm run build` will build the static files in `client/build` folder, that will be served by loopback server.

#### Vagrant

If the ports in `vagrant-conf.yml.dist` don't fit your config, create a `vagrant-conf.yml` and change whatever you wanna change.

Install vagrant and ansible (ansible normally not needed if you use a Windows host machine), then launch `vagrant up`. It should work out of the box, after vagrant is done with the provisioning.


### Ansible

We use ansible to provision the vagrant machine (dev env) and the production server (production env).

To provision the dev vagrant, just launch `vagrant provision`. To provision the production server, you must create an inventory file. It is usually located in `/etc/ansible/hosts` but you can create wherever you want, you will simply have to indicate it in each ansible command using `-i` parameter. This file should look like :

```ini
[production]
main_prod ansible_host=1.2.3.4 ansible_user=ubuntu

[production:vars]
ansible_private_key_file=/home/yourname/.ssh/id_rsa.prod
env=production
pm_username=admin
pm_password=passwordToChange
```

Once this file is created, you can provision the server with `ansible-playbook -i /path/to/inventory.ini ansible/playbook.yml`.

This provisioning is needed only once but can be done as many times as you want (just beware of the use of different vars across developers, especially regarding the password for the process manager `pm_password`).

Once the server is provisioned, you may deploy. We deploy using strongloop tool. Before deploying, you must create a new front-end build : `cd client && npm run build`. Then, `slc build --npm` to build a tgz to upload to the server, and `slc deploy -s main http://admin:passwordToChange@1.2.3.4:8701 ../Captain_standard-1.0.0.tgz`
