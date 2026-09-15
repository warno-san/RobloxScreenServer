const http = require("http");

let color = "red";
let textureId = "";

// Supabaseの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;


// ==============================
// SupabaseからテクスチャIDを取得
// ==============================

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

            throw new Error(
                `Supabase error: ${response.status} ${errorText}`
            );
        }

        const data = await response.json();

        if (data.length > 0) {

            const newTextureId = data[0].texture_id || "";

            // IDが変わった場合だけ更新
            if (newTextureId !== textureId) {

                textureId = newTextureId;

                console.log(
                    "Supabaseから新しいテクスチャIDを取得:",
                    textureId
                );
            }

        }

    } catch (error) {

        console.error(
            "Supabaseからの読み込みに失敗:",
            error
        );
    }
}


// ==============================
// SupabaseにテクスチャIDを保存
// ==============================

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

            throw new Error(
                `Supabase error: ${response.status} ${errorText}`
            );
        }

        console.log(
            "Supabaseに保存:",
            newTextureId
        );

    } catch (error) {

        console.error(
            "Supabaseへの保存に失敗:",
            error
        );
    }
}


// ==============================
// サーバー
// ==============================

const server = http.createServer(async (req, res) => {


    // ------------------------------
    // 赤
    // ------------------------------

    if (req.url === "/red") {

        color = "red";

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("赤にしました！");

        return;
    }


    // ------------------------------
    // 青
    // ------------------------------

    if (req.url === "/blue") {

        color = "blue";

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("青にしました！");

        return;
    }


    // ------------------------------
    // サイトからIDを送る
    // （今後は使わなくてもOK）
    // ------------------------------

    if (req.url.startsWith("/setasset?")) {

        const query = new URL(
            req.url,
            "http://localhost"
        ).searchParams;

        const newTextureId = query.get("id");

        if (newTextureId) {

            textureId = newTextureId;

            await saveTextureId(newTextureId);
        }

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("テクスチャIDを設定しました！");

        return;
    }


    // ------------------------------
    // Robloxが画像IDを取得
    // ------------------------------

    if (req.url === "/asset") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(textureId);

        return;
    }


    // ------------------------------
    // 色を取得
    // ------------------------------

    if (req.url === "/color") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(color);

        return;
    }


    // ------------------------------
    // その他
    // ------------------------------

    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
        <h1>Roblox Screen Server</h1>
    `);

});


// ==============================
// Renderのポート
// ==============================

const port = process.env.PORT || 3000;


// ==============================
// サーバー起動
// ==============================

server.listen(
    port,
    "0.0.0.0",
    async () => {

        console.log("サーバー起動！");
        console.log(`port: ${port}`);

        // 起動時にSupabaseから読み込み
        await loadTextureId();

        // 2秒ごとにSupabaseを確認
        setInterval(
            loadTextureId,
            2000
        );

    }
);
