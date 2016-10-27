#!/bin/bash
USER=$1
USERHOME=$(eval echo ~$USER)
if [[ -z $USER ]]; then
    USER=vagrant
fi
cd
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zlogin
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zlogout
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zshrc
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/zshenv
mv zlogin zlogout zshrc zshenv /etc/zsh/
cp /etc/zsh/zshrc /root/.zshrc
chown root:root /root/.zshrc
cp /etc/zsh/zshrc $USERHOME/.zshrc
chown $USER:$USER $USERHOME/.zshrc
wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/dir_colors
mv dir_colors /etc/

wget http://people.via.ecp.fr/~admin/ganeti/fichiers-config/vimrc
mv vimrc /etc/vim/
