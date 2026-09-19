const http = require("http");

let textureId = "";

// Supabaseの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;


// ==================================================
// Supabaseから現在のテクスチャIDを取得
// ==================================================

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


// ==================================================
// screen_state の既存の1行を更新
// ==================================================

async function saveTextureId(newTextureId) {

    try {

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


        // 行がない場合は作成
        if (data.length === 0) {

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


        // 既存の1行を更新
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


// ==================================================
// スケジュールを登録
// ==================================================

async function addSchedule(executeAt, newTextureId) {

    try {

        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_schedule`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Prefer": "return=minimal"
                },

                body: JSON.stringify({
                    execute_at: executeAt,
                    texture_id: newTextureId,
                    executed: false
                })
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `スケジュール登録エラー: ${response.status} ${errorText}`
            );
        }


        console.log(
            "スケジュールを登録:",
            executeAt,
            newTextureId
        );

        return true;

    } catch (error) {

        console.error(
            "スケジュールの登録に失敗:",
            error
        );

        return false;
    }
}


// ==================================================
// 登録済みスケジュールを取得
// ==================================================

async function getSchedules() {

    try {

        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_schedule?select=id,execute_at,texture_id,executed&order=execute_at.asc`,
            {
                headers: {
                    "apikey": supabaseKey
                }
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `Supabaseスケジュール取得エラー: ${response.status} ${errorText}`
            );
        }


        return await response.json();

    } catch (error) {

        console.error(
            "スケジュール一覧の取得に失敗:",
            error
        );

        return [];
    }
}

// ==================================================
// スケジュールを削除
// ==================================================

async function deleteSchedule(id) {

    try {

        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_schedule?id=eq.${id}`,
            {
                method: "DELETE",

                headers: {
                    "apikey": supabaseKey
                }
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `Supabase削除エラー: ${response.status} ${errorText}`
            );
        }


        console.log(
            "スケジュールを削除:",
            id
        );

        return true;

    } catch (error) {

        console.error(
            "スケジュールの削除に失敗:",
            error
        );

        return false;
    }
}

// ==================================================
// 実行するスケジュールを確認
// ==================================================

async function checkSchedules() {

    try {

        const now = new Date().toISOString();


        // まだ実行されていない、
        // かつ実行日時を過ぎているスケジュールを取得
        const response = await fetch(
            `${supabaseUrl}/rest/v1/screen_schedule?select=id,execute_at,texture_id&executed=eq.false&execute_at=lte.${encodeURIComponent(now)}&order=execute_at.asc`,
            {
                headers: {
                    "apikey": supabaseKey
                }
            }
        );


        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `スケジュール取得エラー: ${response.status} ${errorText}`
            );
        }


        const schedules = await response.json();


        // 実行するスケジュールがない
        if (schedules.length === 0) {

            return;
        }


        // 1件ずつ実行
        for (const schedule of schedules) {

            console.log(
                "スケジュール実行:",
                schedule.id,
                schedule.execute_at,
                schedule.texture_id
            );


            // 現在の画面を変更
            textureId = schedule.texture_id;

            await saveTextureId(
                schedule.texture_id
            );


            // 実行済みにする
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/screen_schedule?id=eq.${schedule.id}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseKey,
                        "Prefer": "return=minimal"
                    },

                    body: JSON.stringify({
                        executed: true
                    })
                }
            );


            if (!updateResponse.ok) {

                const errorText =
                    await updateResponse.text();

                console.error(
                    "実行済み更新に失敗:",
                    errorText
                );
            }
        }

    } catch (error) {

        console.error(
            "スケジュール確認に失敗:",
            error
        );
    }
}


// ==================================================
// サーバー
// ==================================================

const server = http.createServer(async (req, res) => {


    // ==================================================
    // サイト
    // ==================================================

    if (req.url === "/") {

        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });


        res.end(`<!DOCTYPE html>

<html lang="ja">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Roblox Screen Controller</title>


<style>

body {

    font-family:
        Arial,
        sans-serif;

    text-align:
        center;

    margin:
        0;

    padding:
        40px 20px;

    background:
        #f2f2f2;
}


.container {

    max-width:
        550px;

    margin:
        auto;

    background:
        white;

    padding:
        30px;

    border-radius:
        15px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,0.15);

}


h1 {

    margin-bottom:
        30px;

}


h2 {

    margin-top:
        35px;

}


input {

    width:
        90%;

    padding:
        12px;

    font-size:
        17px;

    margin-bottom:
        15px;

    border:
        1px solid #ccc;

    border-radius:
        8px;

    box-sizing:
        border-box;

}


button {

    width:
        95%;

    padding:
        13px;

    font-size:
        18px;

    border:
        none;

    border-radius:
        8px;

    cursor:
        pointer;

    background:
        #333;

    color:
        white;

    margin-bottom:
        10px;

}


button:hover {

    background:
        #555;

}


.schedule {

    margin-top:
        30px;

    padding-top:
        25px;

    border-top:
        1px solid #ddd;

}


.schedule-item {

    text-align:
        left;

    background:
        #f7f7f7;

    border:
        1px solid #ddd;

    border-radius:
        10px;

    padding:
        15px;

    margin-top:
        10px;

}


.schedule-date {

    font-size:
        18px;

    font-weight:
        bold;

    margin-bottom:
        8px;

}


.schedule-id {

    color:
        #555;

    word-break:
        break-all;

}


.no-schedule {

    color:
        #777;

    padding:
        15px;

}


.info {

    margin-top:
        20px;

    color:
        #666;

    font-size:
        14px;

}

</style>

</head>


<body>


<div class="container">


<h1>
📺 Roblox Screen Controller
</h1>


<!-- ========================= -->
<!-- 今すぐ変更 -->
<!-- ========================= -->

<h2>
🖼️ 今すぐ画像を変更
</h2>


<p>
テクスチャIDを入力してください
</p>


<input
    id="textureId"
    type="text"
    placeholder="テクスチャIDを入力"
>


<button
    onclick="changeImage()"
>
    🖼️ 画像を変更
</button>


<!-- ========================= -->
<!-- スケジュール登録 -->
<!-- ========================= -->

<div class="schedule">


<h2>
📅 スケジュール
</h2>


<p>
指定した日時に自動で画像を変更します
</p>


<p>
日時
</p>


<input
    id="scheduleDate"
    type="date"
>


<input
    id="scheduleTime"
    type="time"
>


<p>
テクスチャID
</p>


<input
    id="scheduleTextureId"
    type="text"
    placeholder="テクスチャIDを入力"
>


<button
    onclick="addSchedule()"
>
    📅 スケジュールを登録
</button>


<!-- ========================= -->
<!-- 登録済み一覧 -->
<!-- ========================= -->

<h2>
📋 登録済みスケジュール
</h2>


<div id="scheduleList">

    <div class="no-schedule">
        読み込み中...
    </div>

</div>


</div>


<div class="info">

<p>
⚠️ 「アセットID」ではなく
「テクスチャID」を入力してください。
</p>


<p>
日本時間（JST）で設定してください。
</p>


</div>


</div>


<script>


// ==================================================
// 今すぐ画像変更
// ==================================================

async function changeImage() {

    const id =
        document
        .getElementById("textureId")
        .value
        .trim();


    if (!id) {

        alert(
            "テクスチャIDを入力してください！"
        );

        return;
    }


    try {

        const response =
            await fetch(
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


// ==================================================
// スケジュール登録
// ==================================================

async function addSchedule() {

    const date =
        document
        .getElementById("scheduleDate")
        .value;


    const time =
        document
        .getElementById("scheduleTime")
        .value;


    const id =
        document
        .getElementById("scheduleTextureId")
        .value
        .trim();


    if (!date || !time || !id) {

        alert(
            "日時とテクスチャIDをすべて入力してください！"
        );

        return;
    }


    // 日本時間として送信
    const executeAt =
        date +
        "T" +
        time +
        ":00+09:00";


    try {

        const response =
            await fetch(
                "/schedule?executeAt=" +
                encodeURIComponent(executeAt) +
                "&id=" +
                encodeURIComponent(id)
            );


        const result =
            await response.text();


        alert(result);


        // 登録後すぐに一覧を更新
        loadSchedules();


    } catch (error) {

        alert(
            "スケジュール登録に失敗しました！"
        );

        console.error(error);
    }
}


// ==================================================
// HTMLに安全に表示するための処理
// ==================================================

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function deleteSchedule(id) {

    if (!confirm("このスケジュールを削除しますか？")) {
        return;
    }

    try {

        const response = await fetch(
            "/delete-schedule?id=" + encodeURIComponent(id)
        );

        const result = await response.text();

        if (!response.ok) {
            throw new Error(result);
        }

        alert("スケジュールを削除しました！");

        // 一覧を更新
        loadSchedules();

    } catch (error) {

        console.error(error);

        alert("スケジュールの削除に失敗しました。");
    }
}

// ==================================================
// 登録済みスケジュールを表示
// ==================================================

async function loadSchedules() {

    try {

        const response =
            await fetch("/schedules");


        const schedules =
            await response.json();


        const list =
            document.getElementById(
                "scheduleList"
            );


        // 未実行のものだけ表示
        const upcoming =
            schedules.filter(
                schedule => !schedule.executed
            );


        // スケジュールがない場合
        if (upcoming.length === 0) {

            list.innerHTML =
                '<div class="no-schedule">' +
                    '登録されているスケジュールはありません。' +
                '</div>';

            return;
        }


        list.innerHTML = "";


        for (const schedule of upcoming) {

            const date =
                new Date(
                    schedule.execute_at
                );


            // 日本時間で表示
            const formattedDate =
                date.toLocaleString(
                    "ja-JP",
                    {
                        timeZone: "Asia/Tokyo",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "schedule-item";


item.innerHTML =
    '<div class="schedule-date">' +
        '📅 ' + escapeHtml(formattedDate) +
    '</div>' +

    '<div class="schedule-id">' +
        'テクスチャID：' +
        escapeHtml(schedule.texture_id) +
    '</div>' +

    '<button class="delete-schedule-button" onclick="deleteSchedule(' +
        schedule.id +
    ')">' +
        '🗑️ 削除' +
    '</button>';


            list.appendChild(item);
        }


    } catch (error) {

        console.error(
            "スケジュール表示エラー:",
            error
        );


document
    .getElementById("scheduleList")
    .innerHTML =
        '<div class="no-schedule">' +
            'スケジュールを取得できませんでした。' +
        '</div>';
    }
}


// ==================================================
// 起動時にスケジュールを取得
// ==================================================

loadSchedules();


// ==================================================
// 2秒ごとにスケジュール一覧を更新
// ==================================================

setInterval(
    loadSchedules,
    2000
);


</script>


</body>

</html>`);

        return;
    }


    // ==================================================
    // 今すぐ画像変更
    // ==================================================

    if (req.url.startsWith("/setasset?")) {

        const query =
            new URL(
                req.url,
                "http://localhost"
            ).searchParams;


        const newTextureId =
            query.get("id");


        if (!newTextureId) {

            res.writeHead(400);

            res.end(
                "テクスチャIDがありません！"
            );

            return;
        }


        textureId =
            newTextureId;


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


    // ==================================================
    // スケジュール登録
    // ==================================================

    if (req.url.startsWith("/schedule?")) {

        const query =
            new URL(
                req.url,
                "http://localhost"
            ).searchParams;


        const executeAt =
            query.get("executeAt");


        const newTextureId =
            query.get("id");


        if (!executeAt || !newTextureId) {

            res.writeHead(400);

            res.end(
                "日時またはテクスチャIDがありません！"
            );

            return;
        }


        const success =
            await addSchedule(
                executeAt,
                newTextureId
            );


        res.writeHead(
            success ? 200 : 500,
            {
                "Content-Type":
                    "text/plain; charset=utf-8"
            }
        );


        res.end(
            success
                ? "スケジュールを登録しました！"
                : "スケジュール登録に失敗しました！"
        );


        return;
    }


    // ==================================================
    // 登録済みスケジュール一覧
    // ==================================================

    if (req.url === "/schedules") {

        const schedules =
            await getSchedules();


        res.writeHead(200, {
            "Content-Type":
                "application/json; charset=utf-8"
        });


        res.end(
            JSON.stringify(schedules)
        );


        return;
    }
// ==================================================
// スケジュール削除
// ==================================================

if (pathname === "/delete-schedule") {

    const id = url.searchParams.get("id");

    if (!id) {
        res.writeHead(400, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("IDが指定されていません");
        return;
    }

    const success = await deleteSchedule(id);

    res.writeHead(
        success ? 200 : 500,
        {
            "Content-Type": "text/plain; charset=utf-8"
        }
    );

    res.end(
        success
            ? "削除しました"
            : "削除に失敗しました"
    );

    return;
}

    // ==================================================
    // Robloxが現在のテクスチャIDを取得
    // ==================================================

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


    // ==================================================
    // その他
    // ==================================================

    res.writeHead(404, {
        "Content-Type":
            "text/plain; charset=utf-8"
    });


    res.end(
        "ページが見つかりません"
    );

});


// ==================================================
// Renderのポート
// ==================================================

const port =
    process.env.PORT || 3000;


// ==================================================
// サーバー起動
// ==================================================

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


        // 2秒ごとにスケジュール確認
        setInterval(
            checkSchedules,
            2000
        );

    }
);
