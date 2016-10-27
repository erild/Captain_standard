#!/bin/bash
cd
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zlogin
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zlogout
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zshrc
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zshenv
mv zlogin zlogout zshrc zshenv /etc/zsh/
cp /etc/zsh/zshrc /home/vagrant/.zshrc
chown vagrant:vagrant /home/vagrant/.zshrc
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/dir_colors
mv dir_colors /etc/

wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/vimrc
mv vimrc /etc/vim/