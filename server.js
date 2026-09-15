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

        // 現在ある最新の1行を取得
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
        // 行が存在しない場合
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
        // 既存の最新の1行を更新
        // ==============================

        const targetId = data[0].id;

        console.log(
            "更新する行のID:",
            targetId
        );


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
    // サイトからテクスチャIDを送る
    // ==============================

    if (req.url.startsWith("/setasset?")) {

        const query = new URL(
            req.url,
            "http://localhost"
        ).searchParams;

        const newTextureId = query.get("id");


        if (newTextureId) {

            // Render側の現在のIDを更新
            textureId = newTextureId;


            // Supabaseの既存の行を更新
            await saveTextureId(
                newTextureId
            );
        }


        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(
            "テクスチャIDを設定しました！"
        );

        return;
    }


    // ==============================
    // Robloxが画像IDを取得
    // ==============================

    if (req.url === "/asset") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(
            textureId
        );

        return;
    }


    // ==============================
    // その他
    // ==============================

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

        console.log(
            "サーバー起動！"
        );

        console.log(
            `port: ${port}`
        );


        // 起動時にSupabaseから読み込み
        await loadTextureId();


        // ==============================
        // 2秒ごとにSupabaseを確認
        // ==============================

        setInterval(
            loadTextureId,
            2000
        );

    }
);
