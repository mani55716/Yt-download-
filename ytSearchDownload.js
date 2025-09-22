const ytdl = require("ytdl-core");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

// Optional: Use a package for safer filenames
function sanitizeFilename(name) {
  return name.replace(/[^\w\s-]/gi, "_").replace(/\s+/g, "_").substring(0, 64);
}

async function ytSearchDownload(sock, jid, query, type = "mp3") {
  try {
    // Search YouTube
    const res = await yts(query);
    if (!res.videos.length) {
      return await sock.sendMessage(jid, { text: "❌ No results found." });
    }

    const video = res.videos[0];
    const url = video.url;
    const title = sanitizeFilename(video.title);
    const uniqueSuffix = Date.now();
    const filePath = path.join(
      __dirname,
      `${title}_${uniqueSuffix}.${type === "mp3" ? "mp3" : "mp4"}`
    );

    const streamOptions =
      type === "mp3"
        ? { filter: "audioonly" }
        : { quality: "18" };

    const writeStream = fs.createWriteStream(filePath);
    ytdl(url, streamOptions).pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    if (type === "mp3") {
      await sock.sendMessage(jid, {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
      });
    } else {
      await sock.sendMessage(jid, {
        video: { url: filePath },
        caption: video.title,
      });
    }

    // Remove file after sending
    fs.unlink(filePath, (err) => {
      if (err) console.error("File deletion error:", err);
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: "⚠️ Error downloading from YouTube." });
    console.error(err);
  }
}

module.exports = ytSearchDownload;