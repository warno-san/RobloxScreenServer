const http = require("http");

let color = "red";
let assetId = "";

const server = http.createServer((req, res) => {

    // 赤にする
    if (req.url === "/red") {
        color = "red";

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("赤にしました！");
        return;
    }

    // 青にする
    if (req.url === "/blue") {
        color = "blue";

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("青にしました！");
        return;
    }

    // アセットIDを設定する
    if (req.url.startsWith("/setasset?")) {

        const query = new URL(req.url, "http://localhost").searchParams;
        const newAssetId = query.get("id");

        if (newAssetId) {
            assetId = newAssetId;
        }

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("アセットIDを設定しました！");
        return;
    }

    // 現在のアセットIDを教える
    if (req.url === "/asset") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(assetId);
        return;
    }

    // 現在の色を教える
    if (req.url === "/color") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(color);
        return;
    }

    // ブラウザの画面
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Roblox Screen Controller</title>
        </head>

        <body>
            <h1>Roblox Screen Controller</h1>

            <button onclick="location.href='/red'">
                🔴 赤にする
            </button>

            <button onclick="location.href='/blue'">
                🔵 青にする
            </button>

            <h2>画像を変更</h2>

            <input id="assetId" type="text" placeholder="アセットIDを入力">

            <button onclick="setAsset()">
                🖼️ 画像を表示
            </button>

            <script>
                function setAsset() {
                    const id = document.getElementById("assetId").value;

                    if (!id) {
                        alert("アセットIDを入力してください！");
                        return;
                    }

                    location.href = "/setasset?id=" + encodeURIComponent(id);
                }
            </script>

        </body>
        </html>
    `);
});

const port = process.env.PORT || 3000;

server.listen(port, "0.0.0.0", () => {
    console.log("サーバー起動！");
    console.log(`port: ${port}`);
});
