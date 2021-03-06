
'strict mode'

const canvas = document.getElementById("capitalist");
const ctx = canvas.getContext("2d");

const restartButton = document.getElementById("restart");


const timerController = new TimerController();
const moneyController = new MoneyController();
const managerController = new ManagerController(moneyController, Managers);
const businessController = new BusinessController(
        timerController, moneyController, managerController, Offers);

const BusinessUIItemList = businessController.populateUIItemList(60, 60);

let prevTimestamp = 0;

function mainLoop(timestamp)
{
    let dt = prevTimestamp == 0 ? 0 : timestamp - prevTimestamp;
    dt *= 0.001;
    prevTimestamp = timestamp;

    timerController.updateTimers(dt);
    render();

    requestAnimationFrame(mainLoop);
}

function render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moneyController.render(ctx, 60, 10);

    for (let item of BusinessUIItemList) {
        item.render(ctx, timerController);
    }
}

function handleMouseDown(e)
{
    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;

    for (let item of BusinessUIItemList) {
        item.checkClicking(x, y);
    }
}

function saveToLocal()
{
    let localStorage = window.localStorage;
    localStorage.setItem("CapitalistSave", "1");

    moneyController.writeLocal(localStorage);
    managerController.writeLocal(localStorage);
    businessController.writeLocal(localStorage);

    localStorage.setItem("CapitalistTime", (new Date()).getTime().toString());
}

function initialize()
{
    let localStorage = window.localStorage;
    let hasSave = localStorage.getItem("CapitalistSave") === "1";
    if (hasSave) {
        moneyController.readLocal(localStorage);
        managerController.readLocal(localStorage);
        businessController.readLocal(localStorage);

        let timeString = localStorage.getItem("CapitalistTime");
        if (timeString) {
            lastTimestamp = parseInt(timeString);
            let timeDiff = ((new Date()).getTime() - lastTimestamp) / 1000;

            processOfflineChanges(timeDiff);
        }
    } else {
        saveToLocal();
    }

    window.addEventListener("load", () => { launch(); });
    window.addEventListener("beforeunload", () => { closing(); });
    document.addEventListener("mousedown", (e) => { handleMouseDown(e); });
}

function processOfflineChanges(timeDiff)
{
    timerController.updateTimers(timeDiff);
}

document.addEventListener("DOMContentLoaded", initialize);
restartButton.addEventListener("click", resetAll);

function launch()
{
    mainLoop(0);
}

function closing()
{
    saveToLocal();
    return true;
}

function resetAll()
{
    let localStorage = window.localStorage;
    localStorage.clear();

    timerController.resetAll();
    moneyController.resetAll();
    managerController.resetAll();
    businessController.resetAll();
}

function restart() {
    resetAll()
    initialize()
    launch()
}