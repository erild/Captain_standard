#!/bin/bash
USER=$1
USERHOME=$(eval echo ~$USER)
if [[ -z $USER ]]; then
    USER=vagrant
fi
cd
wget http://formation-debian.via.ecp.fr/fichiers-config/zlogin
wget http://formation-debian.via.ecp.fr/fichiers-config/zlogout
wget http://formation-debian.via.ecp.fr/fichiers-config/zshrc
wget http://formation-debian.via.ecp.fr/fichiers-config/zshenv
mv zlogin zlogout zshrc zshenv /etc/zsh/
cp /etc/zsh/zshrc /root/.zshrc
chown root:root /root/.zshrc
cp /etc/zsh/zshrc $USERHOME/.zshrc
chown $USER:$USER $USERHOME/.zshrc
wget http://formation-debian.via.ecp.fr/fichiers-config/dir_colors
mv dir_colors /etc/

wget http://formation-debian.via.ecp.fr/fichiers-config/vimrc
mv vimrc /etc/vim/
