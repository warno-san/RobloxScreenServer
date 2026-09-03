const http = require("http");

let color = "red";

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
        </body>
        </html>
    `);
});

server.listen(3000, () => {
    console.log("サーバー起動！");
    console.log("http://localhost:3000");
});