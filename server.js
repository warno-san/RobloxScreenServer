const http = require("http");

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
            `${supabaseUrl}/rest/v1/screen_state?select=id,texture_id&order=id.desc&limit=1`,
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

        } else {

            console.log(
                "Supabaseにデータがありません"
            );
        }

    } catch (error) {

        console.error(
            "Supabaseからの読み込みに失敗:",
            error
        );
    }
}


// ==============================
// Supabaseの既存の1行を更新
// ==============================

async function saveTextureId(newTextureId) {

    try {

        // 最新の1行を取得
        const getResponse = await fetch(
            `${supabaseUrl}/rest/v1/screen_state?select=id&order=id.desc&limit=1`,
            {
                headers: {
                    "apikey": supabaseKey
                }
            }
        );

        if (!getResponse.ok) {

            const errorText = await getResponse.text();

            throw new Error(
                `Supabase取得エラー: ${getResponse.status} ${errorText}`
            );
        }

        const data = await getResponse.json();


        // ==============================
        // 行がない場合
        // ==============================

        if (data.length === 0) {

            console.log(
                "Supabaseに行がないので、新しく作成します"
            );

            const insertResponse = await fetch(
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

            if (!insertResponse.ok) {

                const errorText = await insertResponse.text();

                throw new Error(
                    `Supabase INSERTエラー: ${insertResponse.status} ${errorText}`
                );
            }

            console.log(
                "Supabaseに新しい行を作成:",
                newTextureId
            );

            return;
        }


        // ==============================
        // 既存の1行を更新
        // ==============================

        const targetId = data[0].id;

        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/screen_state?id=eq.${targetId}`,
            {
                method: "PATCH",

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


        if (!updateResponse.ok) {

            const errorText = await updateResponse.text();

            throw new Error(
                `Supabase UPDATEエラー: ${updateResponse.status} ${errorText}`
            );
        }


        console.log(
            "Supabaseの既存の行を更新:",
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


    // ==============================
    // サイト
    // ==============================

    if (req.url === "/") {

        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });

        res.end(`
<!DOCTYPE html>

<html lang="ja">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

    <title>Roblox Screen Controller</title>

    <style>

        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 40px 20px;
            background: #f2f2f2;
        }

        .container {
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        h1 {
            margin-bottom: 30px;
        }

        input {
            width: 90%;
            padding: 12px;
            font-size: 18px;
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 8px;
        }

        button {
            width: 95%;
            padding: 13px;
            font-size: 18px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: #333;
            color: white;
        }

        button:hover {
            background: #555;
        }

        .info {
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }

    </style>

</head>


<body>

<div class="container">

    <h1>📺 Roblox Screen Controller</h1>

    <p>テクスチャIDを入力してください</p>

    <input
        id="textureId"
        type="text"
        placeholder="テクスチャIDを入力"
    >

    <br>

    <button onclick="changeImage()">
        🖼️ 画像を変更
    </button>

    <div class="info">

        <p>
            ⚠️ 「アセットID」ではなく
            「テクスチャID」を入力してください。
        </p>

    </div>

</div>


<script>

async function changeImage() {

    const id =
        document.getElementById("textureId").value.trim();


    if (!id) {

        alert("テクスチャIDを入力してください！");

        return;
    }


    try {

        const response = await fetch(
            "/setasset?id=" +
            encodeURIComponent(id)
        );


        const result =
            await response.text();


        alert(result);


    } catch (error) {

        alert(
            "送信に失敗しました！"
        );

        console.error(error);
    }

}

</script>


</body>

</html>
        `);

        return;
    }


    // ==============================
    // サイトからテクスチャIDを送る
    // ==============================

    if (req.url.startsWith("/setasset?")) {

        const query = new URL(
            req.url,
            "http://localhost"
        ).searchParams;

        const newTextureId =
            query.get("id");


        if (!newTextureId) {

            res.writeHead(400, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end(
                "テクスチャIDがありません！"
            );

            return;
        }


        // Render側の現在のIDを変更
        textureId = newTextureId;


        // Supabaseの既存の1行を更新
        await saveTextureId(
            newTextureId
        );


        res.writeHead(200, {
            "Content-Type":
                "text/plain; charset=utf-8"
        });

        res.end(
            "テクスチャIDを設定しました！"
        );

        return;
    }


    // ==============================
    // RobloxがテクスチャIDを取得
    // ==============================

    if (req.url === "/asset") {

        res.writeHead(200, {
            "Content-Type":
                "text/plain; charset=utf-8"
        });

        res.end(
            textureId
        );

        return;
    }


    // ==============================
    // その他
    // ==============================

    res.writeHead(404, {
        "Content-Type":
            "text/plain; charset=utf-8"
    });

    res.end(
        "ページが見つかりません"
    );

});


// ==============================
// Renderのポート
// ==============================

const port =
    process.env.PORT || 3000;


// ==============================
// サーバー起動
// ==============================

server.listen(
    port,
    "0.0.0.0",
    async () => {

        console.log(
            "サーバー起動！"
        );

        console.log(
            `port: ${port}`
        );


        // 起動時にSupabaseから読み込み
        await loadTextureId();


        // 2秒ごとにSupabaseを確認
        setInterval(
            loadTextureId,
            2000
        );

    }
);
