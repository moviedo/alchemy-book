# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "generic/ubuntu1804"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 5432, host: 54320

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  # config.vm.provider "virtualbox" do |vb|
  #   # Display the VirtualBox GUI when booting the machine
  #   vb.gui = true
  #
  #   # Customize the amount of memory on the VM:
  #   vb.memory = "1024"
  # end
  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  config.vm.provision "shell", inline: <<-SHELL

    [ ! -e vars.yml ] || rm vars.yml -f
    echo "---" >> vars.yml
    echo "postgresql_databases:" >> vars.yml
    echo "  - name: side_projects" >> vars.yml
    echo "    owner: vagrant" >> vars.yml
    echo "  - name: alchemy_book_dev" >> vars.yml
    echo "    owner: vagrant" >> vars.yml


    echo "postgresql_users:" >> vars.yml
    echo "  - name: vagrant" >> vars.yml
    echo "    pass: md50da6942c9fdd345715460ce2f9d8e5af" >> vars.yml
    echo "    encrypted: yes" >> vars.yml
    # currently scram-sha-256 not working with ansible
    # using https://hacksoclock.blogspot.com/2018/10/how-to-set-up-scram-sha-256.html for password
    # echo "    pass: '123qwe'" >> vars.yml
    # echo "    encrypted: yes" >> vars.yml
    # echo "postgresql_default_auth_method_hosts: scram-sha-256" >> vars.yml
    echo "postgresql_default_auth_method_hosts: md5" >> vars.yml

    echo "postgresql_user_privileges:" >> vars.yml
    echo "  - name: vagrant" >> vars.yml
    echo "    db: side_projects" >> vars.yml
    echo "    priv: \"ALL\"" >> vars.yml
    echo "    role_attr_flags: \"CREATEDB\"" >> vars.yml
    echo "  - name: vagrant" >> vars.yml
    echo "    db: alchemy_book_dev" >> vars.yml
    echo "    priv: \"ALL\"" >> vars.yml
    echo "    role_attr_flags: \"CREATEDB\"" >> vars.yml

    echo "postgresql_listen_addresses:" >> vars.yml
    echo "  - '*'" >> vars.yml

    echo "postgresql_pg_hba_custom:" >> vars.yml
    echo "  - {type: host,  database: all, user: all, address: '0.0.0.0/0', method: md5}" >> vars.yml
    echo "  - {type: host,  database: all, user: all, address: '::/0', method: md5}" >> vars.yml
    # echo "  - {type: host,  database: all, user: all, address: '0.0.0.0/0', method: scram-sha-256}" >> vars.yml
    # echo "  - {type: host,  database: all, user: all, address: '::/0', method: scram-sha-256}" >> vars.yml


    [ ! -e playbook.yml ] || rm playbook.yml -f
    touch playbook.yml
    echo "---" >> playbook.yml
    echo "- hosts: all" >> playbook.yml
    echo "  become: yes" >> playbook.yml
    echo "  vars_files:" >> playbook.yml
    echo "  - vars.yml" >> playbook.yml
    echo "  roles:" >> playbook.yml
    echo "    - ANXS.postgresql" >> playbook.yml


    [ ! -e requirements.yml ] || rm requirements.yml -f
    touch requirements.yml
    echo "---" >> requirements.yml
    # ansible galaxy version not updated
    echo "- src: https://github.com/ANXS/postgresql" >> requirements.yml
    # echo "  version: v1.12.0" >> requirements.yml
    echo "  name: ANXS.postgresql" >> requirements.yml
  SHELL

  config.vm.provision "ansible_local" do |ansible|
    ansible.become = true
    ansible.provisioning_path = "/home/vagrant"
    ansible.playbook = "playbook.yml"
    ansible.galaxy_role_file = "requirements.yml"
  end
end
