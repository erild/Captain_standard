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

  config.vm.network :private_network, type: :dhcp
  config.vm.hostname = 'captain.local'

  if Vagrant::Util::Platform.windows?
    required_plugins = %w( vagrant-vbguest vagrant-hostmanager )
  else
    required_plugins = %w( vagrant-vbguest vagrant-hostmanager vagrant-bindfs )
  end
  required_plugins.each do |plugin|
    exec "vagrant plugin install #{plugin};vagrant #{ARGV.join(" ")}" unless Vagrant.has_plugin? plugin || ARGV[0] == 'plugin'
  end

  if Vagrant::Util::Platform.windows?
    config.vm.synced_folder ".", "/vagrant", type: "smb"
  else
    config.vm.synced_folder ".", "/vagrant", disabled: true
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

  config.hostmanager.enabled = true
  config.hostmanager.manage_host = true
  config.hostmanager.ignore_private_ip = false
  config.hostmanager.ip_resolver = proc do |machine|
    result = ""
    machine.communicate.execute("/sbin/ifconfig eth1") do |type, data|
      result << data if type == :stdout
    end
    (ip = /inet addr:(\d+\.\d+\.\d+\.\d+)/.match(result)) && ip[1]
  end

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.name = "captain"
  end
  config.vm.provider "hyperv" do |hyperv, override|
    override.vm.box = "jessie-hyperv"
    hyperv.memory = 512
    hyperv.maxmemory = 1536
    hyperv.ip_address_timeout = 240
    hyperv.vmname= "captain"
  end

  if Vagrant::Util::Platform.windows?
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
