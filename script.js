/* ==================================
   SPEEDMETER
   INTERNET SPEED TEST
================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       ELEMENTS
    ============================== */

    const testButton = document.getElementById("testButton");
    const buttonText = document.getElementById("buttonText");
    const buttonIcon = document.getElementById("buttonIcon");

    const monitorButton = document.getElementById("monitorButton");
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeColor = document.getElementById("themeColor");

    const downloadSpeed = document.getElementById("downloadSpeed");
    const downloadStat = document.getElementById("downloadStat");
    const uploadStat = document.getElementById("uploadStat");
    const pingStat = document.getElementById("pingStat");

    const progressBar = document.getElementById("progressBar");
    const testMessage = document.getElementById("testMessage");
    const testTime = document.getElementById("testTime");

    const connectionText = document.getElementById("connectionText");
    const statusStat = document.getElementById("statusStat");
    const networkStatus = document.getElementById("networkStatus");

    const connectionType = document.getElementById("connectionType");
    const effectiveType = document.getElementById("effectiveType");
    const browserDownlink = document.getElementById("browserDownlink");

    const canvas = document.getElementById("speedChart");
    const chartEmpty = document.getElementById("chartEmpty");
    const clearButton = document.getElementById("clearButton");

    /* ==============================
       VARIABLES
    ============================== */

    let testing = false;
    let monitoring = false;
    let monitorTimer = null;
    let history = [];


    /* ==============================
       SAFETY CHECK
    ============================== */

    if (!testButton) {
        console.error("SpeedMeter: testButton not found.");
        return;
    }


    /* ==============================
       THEME
    ============================== */

    function loadTheme() {

        const saved = localStorage.getItem("speedmeter-theme");

        if (saved === "dark") {

            document.body.classList.add("dark");

            if (themeIcon) {
                themeIcon.textContent = "☀";
            }

            if (themeColor) {
                themeColor.setAttribute("content", "#000000");
            }

        } else {

            if (themeIcon) {
                themeIcon.textContent = "☾";
            }

            if (themeColor) {
                themeColor.setAttribute("content", "#ffffff");
            }
        }
    }


    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            const dark =
                document.body.classList.toggle("dark");

            localStorage.setItem(
                "speedmeter-theme",
                dark ? "dark" : "light"
            );

            if (themeIcon) {
                themeIcon.textContent =
                    dark ? "☀" : "☾";
            }

            if (themeColor) {
                themeColor.setAttribute(
                    "content",
                    dark ? "#000000" : "#ffffff"
                );
            }

            drawChart();
        });
    }

    loadTheme();


    /* ==============================
       CONNECTION STATUS
    ============================== */

    function updateConnection() {

        const online = navigator.onLine;

        if (online) {

            if (connectionText) {
                connectionText.textContent = "Connected";
            }

            if (statusStat) {
                statusStat.textContent = "Online";
                statusStat.className = "online";
                statusStat.style.color = "";
            }

            if (networkStatus) {
                networkStatus.textContent = "Online";
            }

        } else {

            if (connectionText) {
                connectionText.textContent = "Offline";
            }

            if (statusStat) {
                statusStat.textContent = "Offline";
                statusStat.className = "";
                statusStat.style.color = "var(--red)";
            }

            if (networkStatus) {
                networkStatus.textContent = "Offline";
            }
        }


        const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;


        if (connection) {

            if (connectionType) {
                connectionType.textContent =
                    connection.type || "Available";
            }

            if (effectiveType) {
                effectiveType.textContent =
                    connection.effectiveType || "—";
            }

            if (browserDownlink) {

                if (connection.downlink) {

                    browserDownlink.textContent =
                        connection.downlink.toFixed(2);

                } else {

                    browserDownlink.textContent = "—";
                }
            }

        } else {

            if (connectionType) {
                connectionType.textContent =
                    "Not available";
            }

            if (effectiveType) {
                effectiveType.textContent = "—";
            }

            if (browserDownlink) {
                browserDownlink.textContent = "—";
            }
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

        const start = performance.now();

        try {

            await fetch(
                url + "?t=" + Date.now(),
                {
                    cache: "no-store",
                    mode: "no-cors"
                }
            );

            const result =
                Math.round(
                    performance.now() - start
                );

            if (pingStat) {
                pingStat.textContent = result;
            }

            return result;

        } catch (error) {

            console.warn("Ping failed:", error);

            if (pingStat) {
                pingStat.textContent = "—";
            }

            return null;
        }
    }


    /* ==============================
       DOWNLOAD TEST
    ============================== */

    async function testDownload() {

        const bytes =
            10 * 1024 * 1024;

        const url =
            "https://speed.cloudflare.com/__down?bytes=" +
            bytes +
            "&cache=" +
            Date.now();


        const start =
            performance.now();


        try {

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 15000);


            const response =
                await fetch(
                    url,
                    {
                        cache: "no-store",
                        signal: controller.signal
                    }
                );


            clearTimeout(timeout);


            if (!response.body) {
                throw new Error(
                    "Streaming not supported"
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

                    const speed =
                        (
                            received *
                            8 /
                            elapsed /
                            1000000
                        );


                    if (downloadSpeed) {
                        downloadSpeed.textContent =
                            speed.toFixed(2);
                    }


                    if (downloadStat) {
                        downloadStat.textContent =
                            speed.toFixed(2);
                    }


                    if (progressBar) {

                        progressBar.style.width =
                            Math.min(
                                100,
                                received /
                                bytes *
                                100
                            ) + "%";
                    }
                }
            }


            const seconds =
                (
                    performance.now() -
                    start
                ) / 1000;


            if (received === 0) {
                throw new Error(
                    "No data received"
                );
            }


            const speed =
                received *
                8 /
                seconds /
                1000000;


            if (downloadSpeed) {
                downloadSpeed.textContent =
                    speed.toFixed(2);
            }


            if (downloadStat) {
                downloadStat.textContent =
                    speed.toFixed(2);
            }


            if (progressBar) {
                progressBar.style.width =
                    "100%";
            }


            return speed;


        } catch (error) {

            console.error(
                "Download test failed:",
                error
            );


            if (testMessage) {
                testMessage.textContent =
                    "Download test unavailable";
            }


            return null;
        }
    }


    /* ==============================
       UPLOAD TEST
    ============================== */

    async function testUpload() {

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

        } catch (error) {
            console.warn(
                "Random data unavailable"
            );
        }


        const start =
            performance.now();


        try {

            const controller =
                new AbortController();


            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);


            await fetch(
                "https://httpbin.org/post?x=" +
                Date.now(),
                {
                    method: "POST",
                    body: data,
                    cache: "no-store",
                    signal: controller.signal
                }
            );


            clearTimeout(timeout);


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


            if (uploadStat) {
                uploadStat.textContent =
                    speed.toFixed(2);
            }


            return speed;


        } catch (error) {

            console.warn(
                "Upload test failed:",
                error
            );


            if (uploadStat) {
                uploadStat.textContent =
                    "—";
            }


            return null;
        }
    }


    /* ==============================
       MAIN SPEED TEST
    ============================== */

    async function runTest() {

        if (testing) {
            return;
        }


        if (!navigator.onLine) {

            if (testMessage) {
                testMessage.textContent =
                    "You are offline.";
            }

            return;
        }


        testing = true;


        /* IMMEDIATELY UPDATE BUTTON */

        testButton.disabled = true;

        if (monitorButton) {
            monitorButton.disabled = true;
        }


        if (buttonIcon) {
            buttonIcon.textContent = "◌";
        }


        if (buttonText) {
            buttonText.textContent =
                "Testing...";
        }


        if (testMessage) {
            testMessage.textContent =
                "Testing your connection...";
        }


        if (progressBar) {
            progressBar.style.width =
                "0%";
        }


        try {

            /* PING */

            if (testMessage) {
                testMessage.textContent =
                    "Checking ping...";
            }

            await testPing();


            /* DOWNLOAD */

            if (testMessage) {
                testMessage.textContent =
                    "Testing download speed...";
            }

            const download =
                await testDownload();


            /* UPLOAD */

            if (testMessage) {
                testMessage.textContent =
                    "Testing upload speed...";
            }

            await testUpload();


            /* HISTORY */

            if (download !== null) {
                addHistory(download);
            }


            /* TIME */

            if (testTime) {

                testTime.textContent =
                    new Date().toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        }
                    );
            }


            if (download !== null) {

                if (testMessage) {
                    testMessage.textContent =
                        "Speed test completed";
                }

            } else {

                if (testMessage) {
                    testMessage.textContent =
                        "Speed test could not measure download";
                }
            }


        } catch (error) {

            console.error(
                "Speed test error:",
                error
            );


            if (testMessage) {
                testMessage.textContent =
                    "Test could not be completed";
            }

        } finally {

            testing = false;


            testButton.disabled =
                false;


            if (monitorButton) {
                monitorButton.disabled =
                    false;
            }


            if (buttonIcon) {
                buttonIcon.textContent =
                    "▶";
            }


            if (buttonText) {

                buttonText.textContent =
                    monitoring
                        ? "Run Test"
                        : "Start Speed Test";
            }
        }
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


        if (chartEmpty) {
            chartEmpty.style.display =
                "none";
        }


        drawChart();
    }


    /* ==============================
       CHART
    ============================== */

    function drawChart() {

        if (!canvas) {
            return;
        }


        const ctx =
            canvas.getContext("2d");


        if (!ctx) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const ratio =
            window.devicePixelRatio || 1;


        canvas.width =
            rect.width * ratio;


        canvas.height =
            rect.height * ratio;


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

            if (chartEmpty) {
                chartEmpty.style.display =
                    "flex";
            }

            return;
        }


        if (chartEmpty) {
            chartEmpty.style.display =
                "none";
        }


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

        ctx.lineWidth = 1;


        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const y =
                15 +
                (
                    height - 30
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
                    item => item.speed
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
                                history.length - 1
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
                        height - 40
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

        ctx.lineWidth = 3;

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
                                history.length - 1
                            )
                        ) *
                        widt
