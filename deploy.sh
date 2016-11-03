echo "-----BEGIN RSA PRIVATE KEY-----" > $TRAVIS_BUILD_DIR/key
echo "$SSH_KEY_RAW" |tr " " "\n" >> $TRAVIS_BUILD_DIR/key
echo "-----END RSA PRIVATE KEY-----" >> $TRAVIS_BUILD_DIR/key
export SSH_KEY=$TRAVIS_BUILD_DIR/key
echo "Deploying..."
test $TRAVIS_BRANCH = "testprod" && slc deploy -s main http+ssh://$PRODUCTION_SERVER:8701 $TRAVIS_BUILD_DIR/../Captain_standard-1.0.0.tgz
