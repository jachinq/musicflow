cd ..

echo "Building initial database"
# start processing the database. read metadata from music files and store it in the database.
cargo build --release --target x86_64-unknown-linux-musl -p initdb
cp target/x86_64-unknown-linux-musl/release/initdb ./run_initdb
echo "Starting read metadata from music files and store it in the database"
./run_initdb

echo "Building the backend"
# start building the backend
cargo build --release --target x86_64-unknown-linux-musl -p server
cp target/x86_64-unknown-linux-musl/release/server ./docker

echo "Building the frontend"
# start building the frontend
cd web
pnpm install
pnpm build
cp -r dist/ ../docker/web/dist/
cd ..

# build the docker image
cd docker
sudo docker build -t musicflow:latest .