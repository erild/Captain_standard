# -*- mode: ruby -*-
# vi: set ft=ruby :


require 'yaml'
dir = File.dirname(File.expand_path(__FILE__))
if File.exist?("#{dir}/vagrant-conf.yml")
  vconfig = YAML::load_file("#{dir}/vagrant-conf.yml")
else
  vconfig = YAML::load_file("#{dir}/vagrant-conf.yml.dist")
end

Vagrant.configure(2) do |config|

  config.vm.box = "debian/jessie64"

  config.vm.network "forwarded_port", guest: vconfig['ports']['guest']['front'], host: vconfig['ports']['host']['front']
  config.vm.network "forwarded_port", guest: vconfig['ports']['guest']['api'], host: vconfig['ports']['host']['api']
  config.vm.network "forwarded_port", guest: vconfig['ports']['guest']['pg'], host: vconfig['ports']['host']['pg']


  config.vm.network "private_network", ip: "192.168.33.10"

  if Vagrant::Util::Platform.windows?
    required_plugins = %w( vagrant-vbguest )
  else
    required_plugins = %w( vagrant-vbguest vagrant-bindfs)
  end
  required_plugins.each do |plugin|
    exec "vagrant plugin install #{plugin};vagrant #{ARGV.join(" ")}" unless Vagrant.has_plugin? plugin || ARGV[0] == 'plugin'
  end

  if Vagrant::Util::Platform.windows?
    config.vm.synced_folder ".", "/vagrant", type: "smb"
  else
    unless Vagrant.has_plugin?("vagrant-bindfs")
      raise "Plugin missing. Run : vagrant plugin install vagrant-bindfs"
    end
    config.vm.synced_folder ".", "/tmp-nfs",
      :type => :nfs,
      :create => true,
      :mount_options => ["rw,rsize=32768,wsize=32768,intr,noatime"],
      :nfs_udp => true,
      :nfs_version => "4"
    config.bindfs.bind_folder "/tmp-nfs", "/vagrant",
      :perms => "u=rwD:g=rD:o=rD",
      :user => :vagrant,
      :group => :vagrant,
      "create-as-user" => true
  end

  if Vagrant.has_plugin?("vagrant-hostmanager")
    config.hostmanager.enabled = true
    config.hostmanager.manage_host = true
  end

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
  config.vm.provider "hyperv" do |hyperv, override|
    override.vm.box = "jessie-hyperv"
    hyperv.memory = 512
    hyperv.maxmemory = 1536
    hyperv.ip_address_timeout = 240
    hyperv.vmname= "captain"
  end

  if Vagrant::Util::Platform.windows? then
    config.vm.provision :ansible_local do |ansible|
      ansible.install_mode = :pip
      ansible.version = :latest
      ansible.extra_vars = { ansible_user: 'vagrant', env: 'dev'}
      ansible.playbook = "ansible/playbook.yml"
    end
  else
    config.vm.provision :ansible do |ansible|
      ansible.extra_vars = { ansible_user: 'vagrant', env: 'dev' }
      ansible.playbook = "ansible/playbook.yml"
    end
  end
end
