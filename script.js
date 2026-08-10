/* ==================================
   SPEEDMETER
   INTERNET SPEED MONITOR
================================== */


/* ==============================
   ELEMENTS
============================== */

const testButton =
    document.getElementById("testButton");

const buttonText =
    document.getElementById("buttonText");

const buttonIcon =
    document.getElementById("buttonIcon");

const monitorButton =
    document.getElementById("monitorButton");

const themeToggle =
    document.getElementById("themeToggle");

const themeIcon =
    document.getElementById("themeIcon");

const themeColor =
    document.getElementById("themeColor");

const downloadSpeed =
    document.getElementById("downloadSpeed");

const downloadStat =
    document.getElementById("downloadStat");

const uploadStat =
    document.getElementById("uploadStat");

const pingStat =
    document.getElementById("pingStat");

const progressBar =
    document.getElementById("progressBar");

const testMessage =
    document.getElementById("testMessage");

const testTime =
    document.getElementById("testTime");

const connectionBadge =
    document.getElementById("connectionBadge");

const connectionText =
    document.getElementById("connectionText");

const statusStat =
    document.getElementById("statusStat");

const networkStatus =
    document.getElementById("networkStatus");

const connectionType =
    document.getElementById("connectionType");

const effectiveType =
    document.getElementById("effectiveType");

const browserDownlink =
    document.getElementById("browserDownlink");

const canvas =
    document.getElementById("speedChart");

const chartEmpty =
    document.getElementById("chartEmpty");

const clearButton =
    document.getElementById("clearButton");


/* ==============================
   VARIABLES
============================== */

let testing = false;

let monitoring = false;

let monitorTimer = null;

let history = [];


/* ==============================
   THEME
============================== */

function loadTheme() {

    const saved =
        localStorage.getItem(
            "speedmeter-theme"
        );


    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeIcon.textContent = "☀";

        themeColor.setAttribute(
            "content",
            "#000000"
        );

    } else {

        themeIcon.textContent = "☾";

        themeColor.setAttribute(
            "content",
            "#ffffff"
        );
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        const dark =
            document.body.classList.toggle(
                "dark"
            );


        localStorage.setItem(
            "speedmeter-theme",
            dark
                ? "dark"
                : "light"
        );


        themeIcon.textContent =
            dark
                ? "☀"
                : "☾";


        themeColor.setAttribute(
            "content",
            dark
                ? "#000000"
                : "#ffffff"
        );


        drawChart();

    }
);


loadTheme();


/* ==============================
   CONNECTION STATUS
============================== */

function updateConnection() {

    const online =
        navigator.onLine;


    if (online) {

        connectionText.textContent =
            "Connected";

        statusStat.textContent =
            "Online";

        statusStat.className =
            "online";

        networkStatus.textContent =
            "Online";

    } else {

        connectionText.textContent =
            "Offline";

        statusStat.textContent =
            "Offline";

        statusStat.className = "";

        statusStat.style.color =
            "var(--red)";

        networkStatus.textContent =
            "Offline";
    }


    const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;


    if (connection) {

        connectionType.textContent =
            connection.type ||
            "Available";

        effectiveType.textContent =
            connection.effectiveType ||
            "—";


        if (connection.downlink) {

            browserDownlink.textContent =
                connection.downlink.toFixed(2);

        } else {

            browserDownlink.textContent =
                "—";
        }

    } else {

        connectionType.textContent =
            "Not available";

        effectiveType.textContent =
            "—";

        browserDownlink.textContent =
            "—";
    }

}


window.addEventListener(
    "online",
    updateConnection
);


window.addEventListener(
    "offline",
    updateConnection
);


updateConnection();


/* ==============================
   PING
============================== */

async function testPing() {

    const url =
        "https://www.gstatic.com/generate_204";


    const start =
        performance.now();


    try {

        await fetch(
            url +
            "?t=" +
            Date.now(),
            {
                cache: "no-store",
                mode: "no-cors"
            }
        );


        const result =
            Math.round(
                performance.now() -
                start
            );


        pingStat.textContent =
            result;


        return result;

    } catch {

        pingStat.textContent =
            "—";

        return null;
    }

}


/* ==============================
   DOWNLOAD TEST
============================== */

async function testDownload() {

    /*
        Cloudflare's public speed endpoint.
    */

    const bytes =
        5 * 1024 * 1024;


    const url =
        "https://speed.cloudflare.com/__down?bytes=" +
        bytes +
        "&cache=" +
        Date.now();


    const start =
        performance.now();


    try {

        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.body) {

            throw new Error(
                "Streaming unavailable"
            );
        }


        const reader =
            response.body.getReader();


        let received = 0;


        while (true) {

            const result =
                await reader.read();


            if (result.done) {

                break;
            }


            received +=
                result.value.length;


            const elapsed =
                (
                    performance.now() -
                    start
                ) / 1000;


            if (elapsed > 0) {

                const current =
                    (
                        received *
                        8 /
                        elapsed /
                        1000000
                    );


                downloadSpeed.textContent =
                    current.toFixed(2);


                downloadStat.textContent =
                    current.toFixed(2);


                progressBar.style.width =
                    Math.min(
                        100,
                        received /
                        bytes *
                        100
                    ) +
                    "%";
            }

        }


        const seconds =
            (
                performance.now() -
                start
            ) / 1000;


        const speed =
            received *
            8 /
            seconds /
            1000000;


        downloadSpeed.textContent =
            speed.toFixed(2);


        downloadStat.textContent =
            speed.toFixed(2);


        progressBar.style.width =
            "100%";


        return speed;

    } catch (error) {

        console.error(
            error
        );


        testMessage.textContent =
            "Download test unavailable";


        return null;
    }

}


/* ==============================
   UPLOAD TEST
============================== */

async function testUpload() {

    /*
        Browser upload measurement.

        Some browsers/network
        environments may block this.
    */

    const size =
        512 * 1024;


    const data =
        new Uint8Array(size);


    try {

        crypto.getRandomValues(
            data.subarray(
                0,
                Math.min(
                    65536,
                    data.length
                )
            )
        );

    } catch {

        /* Random data is not essential */
    }


    const start =
        performance.now();


    try {

        await fetch(
            "https://httpbin.org/post?x=" +
            Date.now(),
            {
                method: "POST",
                body: data,
                cache: "no-store"
            }
        );


        const seconds =
            (
                performance.now() -
                start
            ) / 1000;


        const speed =
            size *
            8 /
            seconds /
            1000000;


        uploadStat.textContent =
            speed.toFixed(2);


        return speed;

    } catch (error) {

        console.error(
            error
        );


        uploadStat.textContent =
            "—";


        return null;
    }

}


/* ==============================
   MAIN TEST
============================== */

async function runTest() {

    if (testing) {

        return;
    }


    if (!navigator.onLine) {

        testMessage.textContent =
            "You are offline.";

        return;
    }


    testing = true;


    testButton.disabled =
        true;

    monitorButton.disabled =
        true;


    buttonIcon.textContent =
        "◌";

    buttonText.textContent =
        "Testing...";


    testMessage.textContent =
        "Testing your connection";


    progressBar.style.width =
        "0%";


    try {

        await testPing();


        const download =
            await testDownload();


        await testUpload();


        if (download !== null) {

            addHistory(
                download
            );
        }


        const now =
            new Date();


        testTime.textContent =
            now.toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            );


        if (download !== null) {

            testMessage.textContent =
                "Speed test completed";
        }


    } catch (error) {

        console.error(
            error
        );


        testMessage.textContent =
            "Test could not be completed";
    }


    testing = false;


    testButton.disabled =
        false;

    monitorButton.disabled =
        false;


    buttonIcon.textContent =
        "▶";

    buttonText.textContent =
        monitoring
            ? "Run Test"
            : "Start Speed Test";
}


/* ==============================
   HISTORY
============================== */

function addHistory(speed) {

    history.push({

        speed: speed,

        time: new Date()

    });


    if (history.length > 30) {

        history.shift();
    }


    chartEmpty.style.display =
        "none";


    drawChart();
}


/* ==============================
   CHART
============================== */

function drawChart() {

    const ctx =
        canvas.getContext(
            "2d"
        );


    const rect =
        canvas.getBoundingClientRect();


    const ratio =
        window.devicePixelRatio ||
        1;


    canvas.width =
        rect.width *
        ratio;


    canvas.height =
        rect.height *
        ratio;


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );


    const width =
        rect.width;

    const height =
        rect.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (history.length === 0) {

        chartEmpty.style.display =
            "flex";

        return;
    }


    chartEmpty.style.display =
        "none";


    const dark =
        document.body.classList.contains(
            "dark"
        );


    const grid =
        dark
            ? "rgba(255,255,255,.07)"
            : "rgba(0,0,0,.06)";


    const line =
        dark
            ? "#0a84ff"
            : "#007aff";


    /* GRID */

    ctx.strokeStyle =
        grid;

    ctx.lineWidth =
        1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            15 +
            (
                height -
                30
            ) /
            4 *
            i;


        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }


    /* MAX */

    const max =
        Math.max(
            ...history.map(
                item =>
                    item.speed
            ),
            10
        );


    /* LINE */

    ctx.beginPath();


    history.forEach(
        (item, index) => {

            const x =
                history.length === 1
                    ? width / 2
                    :
                    (
                        index /
                        (
                            history.length -
                            1
                        )
                    ) *
                    width;


            const y =
                height -
                20 -
                (
                    item.speed /
                    max
                ) *
                (
                    height -
                    40
                );


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }

        }
    );


    ctx.strokeStyle =
        line;

    ctx.lineWidth =
        3;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.stroke();


    /* POINTS */

    history.forEach(
        (item, index) => {

            const x =
                history.length === 1
                    ? width / 2
                    :
                    (
                        index /
                        (
                            history.length -
                            1
                        )
                    ) *
                    width;


            const y =
                height -
                20 -
                (
                    item.speed /
                    max
                ) *
                (
                    height -
                    40
                );


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                line;

            ctx.fill();
        }
    );

}


window.addEventListener(
    "resize",
    drawChart
);


/* ==============================
   MONITORING
============================== */

monitorButton.addEventListener(
    "click",
    async () => {

        if (!monitoring) {

            monitoring = true;


            monitorButton.innerHTML =
                "■ Stop Monitoring";


            await runTest();


            /*
                Repeat every minute.
            */

            monitorTimer =
                setInterval(
                    runTest,
                    60000
                );

        } else {

            monitoring = false;


            clearInterval(
                monitorTimer
            );


            monitorTimer =
                null;


            monitorButton.innerHTML =
                "◉ Start Monitoring";

        }

    }
);


/* ==============================
   TEST BUTTON
============================== */

testButton.addEventListener(
    "click",
    runTest
);


/* ==============================
   CLEAR
============================== */

clearButton.addEventListener(
    "click",
    () => {

        history = [];


        chartEmpty.style.display =
            "flex";


        drawChart();
    }
);


/* ==============================
   INITIAL
============================== */

drawChart();
