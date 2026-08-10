/* =========================================================
   SPEEDMETER
   Live Internet Speed Test & Continuous Monitor
   Powered by Cloudflare's browser speed-test engine
========================================================= */


/* =========================================================
   CLOUDFARE SPEED TEST ENGINE
========================================================= */

let SpeedTestEngine = null;
let engine = null;


/* =========================================================
   ELEMENTS
========================================================= */

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

const connectionText =
    document.getElementById("connectionText");

const statusStat =
    document.getElementById("statusStat");

const connectionType =
    document.getElementById("connectionType");

const effectiveType =
    document.getElementById("effectiveType");

const browserDownlink =
    document.getElementById("browserDownlink");

const networkStatus =
    document.getElementById("networkStatus");

const canvas =
    document.getElementById("speedChart");

const chartEmpty =
    document.getElementById("chartEmpty");

const clearButton =
    document.getElementById("clearButton");


/* =========================================================
   STATE
========================================================= */

let testing = false;

let monitoring = false;

let monitorTimer = null;

let history = [];

let currentEngine = null;

let lastDownload = null;

let lastUpload = null;

let lastPing = null;


/*
    Monitoring waits this long after one complete test
    before beginning another one.
*/

const MONITOR_INTERVAL = 15000;


/* =========================================================
   LOAD CLOUDFLARE ENGINE
========================================================= */

async function loadSpeedTestEngine() {

    if (SpeedTestEngine) {

        return SpeedTestEngine;
    }


    try {

        /*
            Load the official Cloudflare speed-test
            package directly from a public CDN.

            Version 1.12.1 is the current release
            at the time this project is being built.
        */

        const module =
            await import(
                "https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.12.1/+esm"
            );


        SpeedTestEngine =
            module.default ||
            module.SpeedTest ||
            module;


        return SpeedTestEngine;

    } catch (error) {

        console.error(
            "Speed test engine failed to load:",
            error
        );


        throw error;
    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const saved =
        localStorage.getItem(
            "speedmeter-theme"
        );


    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeIcon.textContent =
            "☀";

        themeColor.setAttribute(
            "content",
            "#000000"
        );

    } else {

        themeIcon.textContent =
            "☾";

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


/* =========================================================
   CONNECTION INFORMATION
========================================================= */

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

        statusStat.className =
            "";

        statusStat.style.color =
            "var(--red)";

        networkStatus.textContent =
            "Offline";
    }


    /*
        Network Information API.

        Not supported by every browser,
        especially Safari/iPhone.
    */

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


        if (
            typeof connection.downlink ===
            "number"
        ) {

            browserDownlink.textContent =
                connection.downlink.toFixed(2);

        } else {

            browserDownlink.textContent =
                "—";
        }

    } else {

        connectionType.textContent =
            "Browser";

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


/* =========================================================
   FORMAT SPEED
========================================================= */

function formatSpeed(bps) {

    if (
        typeof bps !== "number" ||
        !Number.isFinite(bps) ||
        bps <= 0
    ) {

        return "0.00";
    }


    const mbps =
        bps / 1000000;


    if (mbps >= 1000) {

        return (
            mbps / 1000
        ).toFixed(2);

    }


    return mbps.toFixed(2);
}


/* =========================================================
   UPDATE DOWNLOAD
========================================================= */

function updateDownloadSpeed(bps) {

    if (
        typeof bps !== "number" ||
        !Number.isFinite(bps) ||
        bps <= 0
    ) {

        return;
    }


    const value =
        formatSpeed(bps);


    lastDownload =
        parseFloat(value);


    downloadSpeed.textContent =
        value;

    downloadStat.textContent =
        value;


    /*
        Visual live movement.

        The bar never represents an absolute
        internet limit. It simply gives the
        user visual feedback that the test
        is actively running.
    */

    const visual =
        Math.min(
            100,
            Math.max(
                8,
                lastDownload /
                2
            )
        );


    progressBar.style.width =
        visual + "%";
}


/* =========================================================
   UPDATE UPLOAD
========================================================= */

function updateUploadSpeed(bps) {

    if (
        typeof bps !== "number" ||
        !Number.isFinite(bps) ||
        bps <= 0
    ) {

        return;
    }


    const value =
        formatSpeed(bps);


    lastUpload =
        parseFloat(value);


    uploadStat.textContent =
        value;
}


/* =========================================================
   UPDATE PING
========================================================= */

function updatePing(value) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return;
    }


    lastPing =
        Math.round(value);


    pingStat.textContent =
        lastPing;
}


/* =========================================================
   READ CURRENT RESULTS
========================================================= */

function readLiveResults(speedEngine) {

    try {

        const results =
            speedEngine.results;


        /*
            DOWNLOAD
        */

        if (
            results &&
            typeof results.getDownloadBandwidthPoints ===
            "function"
        ) {

            const points =
                results.getDownloadBandwidthPoints();


            if (
                points &&
                points.length
            ) {

                const latest =
                    points[
                        points.length - 1
                    ];


                if (
                    latest &&
                    typeof latest.bps ===
                    "number"
                ) {

                    updateDownloadSpeed(
                        latest.bps
                    );
                }
            }
        }


        /*
            UPLOAD
        */

        if (
            results &&
            typeof results.getUploadBandwidthPoints ===
            "function"
        ) {

            const points =
                results.getUploadBandwidthPoints();


            if (
                points &&
                points.length
            ) {

                const latest =
                    points[
                        points.length - 1
                    ];


                if (
                    latest &&
                    typeof latest.bps ===
                    "number"
                ) {

                    updateUploadSpeed(
                        latest.bps
                    );
                }
            }
        }


        /*
            LATENCY
        */

        if (
            results &&
            typeof results.getUnloadedLatency ===
            "function"
        ) {

            const latency =
                results.getUnloadedLatency();


            if (
                typeof latency ===
                "number"
            ) {

                updatePing(
                    latency
                );
            }
        }

    } catch (error) {

        console.debug(
            "Live result update:",
            error
        );
    }
}


/* =========================================================
   CREATE ENGINE
========================================================= */

async function createEngine() {

    const SpeedTest =
        await loadSpeedTestEngine();


    /*
        We deliberately configure the test ourselves.

        This avoids relying on the deprecated public
        packet-loss TURN server.

        The test measures:
        - latency
        - download
        - upload
    */

    const config = {

        autoStart: false,

        measureDownloadLoadedLatency: true,

        measureUploadLoadedLatency: true,

        bandwidthFinishRequestDuration:
            1200,

        measurements: [

            {
                type: "latency",

                numPackets: 5
            },


            {
                type: "download",

                bytes: 100000,

                count: 3,

                bypassMinDuration: true
            },


            {
                type: "download",

                bytes: 1000000,

                count: 4
            },


            {
                type: "download",

                bytes: 5000000,

                count: 3
            },


            {
                type: "upload",

                bytes: 100000,

                count: 3,

                bypassMinDuration: true
            },


            {
                type: "upload",

                bytes: 1000000,

                count: 4
            },


            {
                type: "upload",

                bytes: 5000000,

                count: 2
            }

        ]
    };


    const speedEngine =
        new SpeedTest(
            config
        );


    speedEngine.onRunningChange =
        running => {

            if (running) {

                testing = true;

            } else {

                testing = false;
            }
        };


    speedEngine.onResultsChange =
        info => {

            /*
                This is the important part.

                Cloudflare calls this while the test
                is progressing, allowing SpeedMeter
                to update the UI live.
            */

            readLiveResults(
                speedEngine
            );


            if (testing) {

                if (
                    info &&
                    info.type ===
                    "download"
                ) {

                    testMessage.textContent =
                        "Measuring download speed…";

                } else if (
                    info &&
                    info.type ===
                    "upload"
                ) {

                    testMessage.textContent =
                        "Measuring upload speed…";

                } else if (
                    info &&
                    info.type ===
                    "latency"
                ) {

                    testMessage.textContent =
                        "Measuring connection latency…";

                } else {

                    testMessage.textContent =
                        "Testing your connection…";
                }
            }
        };


    speedEngine.onError =
        error => {

            console.error(
                "Speed test error:",
                error
            );


            testMessage.textContent =
                "Speed test encountered an error";

        };


    return speedEngine;
}


/* =========================================================
   FINAL RESULT
========================================================= */

function processFinalResults(
    results
) {

    try {

        /*
            Final download
        */

        if (
            results &&
            typeof results.getDownloadBandwidth ===
            "function"
        ) {

            const bps =
                results.getDownloadBandwidth();


            if (
                typeof bps ===
                "number" &&
                bps > 0
            ) {

                updateDownloadSpeed(
                    bps
                );
            }
        }


        /*
            Final upload
        */

        if (
            results &&
            typeof results.getUploadBandwidth ===
            "function"
        ) {

            const bps =
                results.getUploadBandwidth();


            if (
                typeof bps ===
                "number" &&
                bps > 0
            ) {

                updateUploadSpeed(
                    bps
                );
            }
        }


        /*
            Final ping
        */

        if (
            results &&
            typeof results.getUnloadedLatency ===
            "function"
        ) {

            const latency =
                results.getUnloadedLatency();


            if (
                typeof latency ===
                "number"
            ) {

                updatePing(
                    latency
                );
            }
        }


    } catch (error) {

        console.error(
            "Final result error:",
            error
        );
    }
}


/* =========================================================
   SAVE HISTORY
========================================================= */

function saveHistory() {

    if (
        typeof lastDownload !==
        "number" ||
        lastDownload <= 0
    ) {

        return;
    }


    history.push({

        download:
            lastDownload,

        upload:
            typeof lastUpload ===
            "number"
                ? lastUpload
                : null,

        ping:
            typeof lastPing ===
            "number"
                ? lastPing
                : null,

        time:
            new Date()
    });


    /*
        Keep the latest 40 results.
    */

    if (
        history.length >
        40
    ) {

        history.shift();
    }


    chartEmpty.style.display =
        "none";


    drawChart();
}


/* =========================================================
   RUN ONE TEST
========================================================= */

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
        "Testing…";


    testMessage.textContent =
        "Starting speed test…";


    progressBar.style.width =
        "5%";


    /*
        Reset live result placeholders.

        Keep previous final values visible until
        new measurements start arriving.
    */

    lastDownload =
        null;

    lastUpload =
        null;

    lastPing =
        null;


    try {

        currentEngine =
            await createEngine();


        engine =
            currentEngine;


        /*
            Attach final callback before play.
        */

        currentEngine.onFinish =
            results => {

                processFinalResults(
                    results
                );


                progressBar.style.width =
                    "100%";


                testMessage.textContent =
                    "Speed test completed";


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


                saveHistory();


                testing =
                    false;


                testButton.disabled =
                    false;


                monitorButton.disabled =
                    false;


                buttonIcon.textContent =
                    "▶";


                buttonText.textContent =
                    "Start Speed Test";


                currentEngine =
                    null;

            };


        /*
            START
        */

        currentEngine.play();


    } catch (error) {

        console.error(
            "Could not start speed test:",
            error
        );


        testMessage.textContent =
            "Unable to start speed test";


        testing =
            false;


        testButton.disabled =
            false;


        monitorButton.disabled =
            false;


        buttonIcon.textContent =
            "▶";


        buttonText.textContent =
            "Start Speed Test";


        currentEngine 
