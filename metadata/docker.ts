import { getAllMetadata, updateMetadataPath } from "./sql";
import { concurrence } from "./task";

const docker_music_dir = "/home/myapp/music";
const local_music_dir = "./music"; // 本地音乐目录
const job = () => {
  const metadatas = getAllMetadata();
  const count = metadatas.length;
  console.log("all metadatas:", count);
  // 将 metadata 中的 file_path 字段中的 local_music_dir 替换为 docker_music_dir
  // 将 file_path,file_url 字段中的 \ 替换为 /
  // 然后将修改后的 metadata 保存到数据库
  let processed_count = 0;
  concurrence(100, metadatas, (metadata) => {
    const file_path = metadata.file_path
      .replace(local_music_dir, docker_music_dir)
      .replace(/\\/g, "/");
    const file_url = file_path.replace(docker_music_dir, "").replace(/\\/g, "/");
    const id = metadata.id;
    const new_metadata = { id, file_path, file_url };
    updateMetadataPath(new_metadata);
    processed_count++;
    console.log(
      "count:",
      count,
      "processed:",
      processed_count,
      "percent:",
      Math.floor((processed_count / count) * 100)
    );
  });
};

job();
