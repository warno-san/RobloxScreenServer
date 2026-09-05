const http = require("http");

let color = "red";
let textureId = "";

// Supabaseの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Supabaseから最後のテクスチャIDを取得
async function loadTextureId() {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_state?select=texture_id&order=id.desc&limit=1`,
            {
                headers: {
                    "apikey": supabaseKey
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (data.length > 0) {
            textureId = data[0].texture_id || "";
            console.log("Supabaseから復元:", textureId);
        } else {
            console.log("保存されているテクスチャIDはありません");
        }

    } catch (error) {
        console.error("Supabaseからの読み込みに失敗:", error);
    }
}

// SupabaseにテクスチャIDを保存
async function saveTextureId(newTextureId) {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_state`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    texture_id: newTextureId
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase error: ${response.status} ${errorText}`);
        }

        console.log("Supabaseに保存:", newTextureId);

    } catch (error) {
        console.error("Supabaseへの保存に失敗:", error);
    }
}

const server = http.createServer(async (req, res) => {

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

    // テクスチャIDを設定する
    if (req.url.startsWith("/setasset?")) {

        const query = new URL(req.url, "http://localhost").searchParams;
        const newTextureId = query.get("id");

        if (newTextureId) {
            textureId = newTextureId;

            // Supabaseに保存
            await saveTextureId(newTextureId);
        }

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("テクスチャIDを設定しました！");
        return;
    }

    // 現在のテクスチャIDを教える
    if (req.url === "/asset") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(textureId);
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

            <p>
                ⚠️ <strong>「アセットID」ではなく「テクスチャID」を入力してください。</strong>
            </p>

            <input id="assetId" type="text" placeholder="テクスチャIDを入力">

            <button onclick="setAsset()">
                🖼️ 画像を表示
            </button>

            <script>
                function setAsset() {
                    const id = document.getElementById("assetId").value;

                    if (!id) {
                        alert("テクスチャIDを入力してください！");
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

server.listen(port, "0.0.0.0", async () => {
    console.log("サーバー起動！");
    console.log(`port: ${port}`);

    // 起動時にSupabaseから最後のIDを復元
    await loadTextureId();
});
