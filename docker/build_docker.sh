cd ..
mkdir build # create build directory
mkdir build/web
mkdir build/conf
mkdir build/data

# start processing the database. read metadata from music files and store it in the database.

cd metadata
pnpm install
pnpm dev
pnpm db_album
cd ..

# start building the backend
cd server
cargo build --release --target x86_64-unknown-linux-musl
cp target/x86_64-unknown-linux-musl/release/musicflow .
cp conf/config.json ../build/conf
cd ..

# start building the frontend
cd web
pnpm install
pnpm build
cp -r dist/ ../docker/web/
cd ..

# build the docker image
cd docker
sudo docker build -t musicflow:latest .
cp docker-compose.yml ../build/