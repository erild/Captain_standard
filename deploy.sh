export SSH_KEY=$PWD/key
slc deploy -s main http+ssh://cs.ragg.fr:8701 ../Captain_standard-1.0.0.tgz
